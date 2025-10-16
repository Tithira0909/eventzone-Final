// server/routes/admin.js
import express from "express";
import { pool } from "../db.js";

const router = express.Router();

/* ---------- helpers ---------- */
function isVip(tableId) {
  const letter = String(tableId || "").trim().charAt(0).toUpperCase();
  return ["A", "B", "C", "D", "E"].includes(letter);
}
function rand(n = 7) {
  return Math.random().toString(36).slice(2, 2 + n).toUpperCase();
}

/* ---------- LIST ORDERS ---------- */
router.get("/orders", async (_req, res) => {
  const conn = await pool.getConnection();
  try {
    const [[checkedCol]] = await conn.query(
      "SHOW COLUMNS FROM orders LIKE 'checked_in_at'"
    );
    const hasCheckedAt = !!checkedCol;

    const [[orderIdCol]] = await conn.query(
      "SHOW COLUMNS FROM orders LIKE 'order_id'"
    );
    const hasOrderIdStr = !!orderIdCol;

    const [[custTable]] = await conn.query("SHOW TABLES LIKE 'customers'");
    let custSelect =
      "NULL AS customer_name, NULL AS customer_email, NULL AS customer_phone";
    let custJoin = "";
    if (custTable) {
      const [custCols] = await conn.query("SHOW COLUMNS FROM customers");
      const names = new Set(custCols.map((c) => c.Field));
      const nameSel = names.has("name") ? "c.name" : "NULL";
      const emailSel = names.has("email") ? "c.email" : "NULL";
      const phoneSel = names.has("phone") ? "c.phone" : "NULL";
      custSelect = `${nameSel} AS customer_name, ${emailSel} AS customer_email, ${phoneSel} AS customer_phone`;
      custJoin = "LEFT JOIN customers c ON c.id = o.customer_id";
    }

    const sqlOrders = `
      SELECT o.id,
             ${hasOrderIdStr ? "o.order_id" : "NULL"} AS order_id,
             o.order_key,
             o.amount, o.currency, o.status, o.description,
             o.created_at AS ts,
             ${hasCheckedAt ? "o.checked_in_at" : "NULL"} AS checked_in_at,
             ${custSelect}
        FROM orders o
        ${custJoin}
       ORDER BY o.id DESC`;

    const [orders] = await conn.query(sqlOrders);

    const [[priceCentsCol]] = await conn.query(
      "SHOW COLUMNS FROM order_items LIKE 'price_cents'"
    );
    const priceExpr = priceCentsCol ? "oi.price_cents/100" : "oi.price";

    const [items] = await conn.query(
      `SELECT oi.order_id, oi.table_id, oi.seat_no, oi.category, ${priceExpr} AS price
         FROM order_items oi`
    );

    const byOrderId = new Map();
    for (const o of orders) {
      byOrderId.set(o.id, {
        orderId: o.order_id || `#${o.id}`,
        amount: Number(o.amount || 0),
        currency: o.currency || "LKR",
        status: o.status || "CREATED",
        description: o.description || "",
        ts: o.ts,
        checkedInAt: o.checked_in_at || null,
        customer: {
          name: o.customer_name || "",
          email: o.customer_email || "",
          phone: o.customer_phone || "",
        },
        items: [],
      });
    }
    for (const it of items) {
      const row = byOrderId.get(it.order_id);
      if (row) {
        row.items.push({
          id: `${it.table_id}-${it.seat_no}`,
          tableId: it.table_id,
          seatNo: it.seat_no,
          category: it.category,
          price: Number(it.price || 0),
        });
      }
    }
    res.json({ ok: true, orders: Array.from(byOrderId.values()) });
  } catch (e) {
    console.error("[ADMIN][orders]", e);
    res
      .status(500)
      .json({ ok: false, error: "ORDERS_FETCH_FAILED", sqlMessage: e?.sqlMessage });
  } finally {
    conn.release();
  }
});

/* ---------- CHECK-IN ---------- */
router.post("/checkin", async (req, res) => {
  const { orderId } = req.body || {};
  if (!orderId)
    return res.status(400).json({ ok: false, error: "NO_ORDER_ID" });
  const conn = await pool.getConnection();
  try {
    const [[checkedCol]] = await conn.query(
      "SHOW COLUMNS FROM orders LIKE 'checked_in_at'"
    );
    const hasCheckedAt = !!checkedCol;
    const [[orderIdCol]] = await conn.query(
      "SHOW COLUMNS FROM orders LIKE 'order_id'"
    );
    const hasOrderIdStr = !!orderIdCol;

    let sql = `UPDATE orders SET status = 'Checked-in'`;
    if (hasCheckedAt) sql += `, checked_in_at = NOW()`;
    sql += hasOrderIdStr ? ` WHERE order_id = ?` : ` WHERE 0`;
    const [r] = await conn.query(sql, [String(orderId)]);
    res.json({ ok: true, updated: r.affectedRows });
  } catch (e) {
    console.error("[ADMIN][checkin]", e);
    res
      .status(500)
      .json({ ok: false, error: "CHECKIN_FAILED", sqlMessage: e?.sqlMessage });
  } finally {
    conn.release();
  }
});

/* ---------- CREATE: Ticket Book or PickMe ---------- */
router.post("/ticket-book", async (req, res) => {
  const {
    tableId,
    seats,
    orderId: customOrderId,
    source = "ticket_book", // 'ticket_book' | 'pickme'
  } = req.body || {};

  const tId = String(tableId || "").trim();
  const seatList = Array.isArray(seats)
    ? seats.map(Number).filter((n) => n >= 1 && n <= 10)
    : [];

  if (!tId || seatList.length === 0) {
    return res.status(400).json({ ok: false, error: "BAD_ITEM" });
    }

  const category = isVip(tId) ? "vip" : "general";
  const unit = category === "vip" ? 7500 : 5000;
  const items = seatList.map((n) => ({
    tableId: tId,
    seatNo: n,
    category,
    price: unit,
  }));
  const amount = items.reduce((s, it) => s + (it.price || 0), 0);

  const src = String(source).toLowerCase() === "pickme" ? "pickme" : "ticket_book";
  const statusLabel = src === "pickme" ? "PickMe" : "Ticket Book";
  const descLabel = statusLabel;
  const payMethod = src === "pickme" ? "PICKME" : "TICKET_BOOK";
  const idPrefix = src === "pickme" ? "PME" : "TBK";

  const outOrderId = customOrderId || `${idPrefix}-${tId}-${rand(4)}`;
  const orderKey = `OK_${rand(12)}`;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [ins] = await conn.query(
      `INSERT INTO orders (order_id, order_key, customer_id, currency, amount, pay_method, status, description)
       VALUES (?, ?, NULL, ?, ?, ?, ?, ?)`,
      [outOrderId, orderKey, "LKR", amount, payMethod, statusLabel, descLabel]
    );
    const newOrderId = ins.insertId;

    // price column detection
    const [[pc]] = await conn.query(
      "SHOW COLUMNS FROM order_items LIKE 'price_cents'"
    );
    const useCents = !!pc;

    for (const it of items) {
      // lock/upsert seat and attach to order
      await conn.query(
        `INSERT INTO seat_locks (table_id, seat_no, order_id, hold_id, hold_expires_at)
             VALUES (?, ?, ?, NULL, NULL)
         ON DUPLICATE KEY UPDATE
             order_id = VALUES(order_id),
             hold_id = NULL,
             hold_expires_at = NULL`,
        [it.tableId, it.seatNo, newOrderId]
      );

      // line item
      if (useCents) {
        await conn.query(
          `INSERT INTO order_items (order_id, table_id, seat_no, category, price_cents)
           VALUES (?, ?, ?, ?, ?)`,
          [newOrderId, it.tableId, it.seatNo, it.category, Math.round(it.price * 100)]
        );
      } else {
        await conn.query(
          `INSERT INTO order_items (order_id, table_id, seat_no, category, price)
           VALUES (?, ?, ?, ?, ?)`,
          [newOrderId, it.tableId, it.seatNo, it.category, it.price]
        );
      }
    }

    await conn.commit();
    res.json({ ok: true, orderId: outOrderId, id: newOrderId });
  } catch (e) {
    await conn.rollback();
    console.error("[ADMIN][ticket-book]", e);
    res.status(500).json({
      ok: false,
      error: "TICKET_BOOK_SAVE_FAILED",
      sqlMessage: e?.sqlMessage,
    });
  } finally {
    conn.release();
  }
});

export default router;
