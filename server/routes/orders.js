// server/routes/orders.js
import express from "express";
import { pool } from "../db.js";

const router = express.Router();

/**
 * Create an order + attach seat locks + line items.
 * Header:  X-Idempotency-Key
 * Body: { orderId?, amount, currency?, description?, payVia?, holdId?, customer?, items: [...] }
 */
router.post("/", async (req, res) => {
  const idemKey = req.get("x-idempotency-key");
  if (!idemKey) return res.status(400).json({ ok: false, error: "NO_IDEMPOTENCY_KEY" });

  const {
    orderId,
    amount,
    currency = "LKR",
    description,
    items,
    customer = {},
    payVia = "ONEPAY_CARD",
    holdId,
  } = req.body || {};

  // --- basic validation -----------------------------------------------------
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ ok: false, error: "BAD_ITEM" });
  }
  const amt = Number(amount || 0);
  if (!Number.isFinite(amt) || amt <= 0) {
    return res.status(400).json({ ok: false, error: "BAD_AMOUNT" });
  }

  // Normalize items so server accepts multiple client shapes
  const normItems = [];
  for (const raw of items) {
    const tableId = String(raw.tableId ?? raw.table_id ?? raw.tableCode ?? "").trim();
    const seatNo = Number(raw.seatNo ?? raw.seat_no ?? 0);
    const category = (raw.category || "general").toString().toLowerCase() === "vip" ? "vip" : "general";
    const price = Number(raw.price || 0);

    if (!tableId || !Number.isFinite(seatNo) || seatNo < 1 || seatNo > 10 || !Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ ok: false, error: "BAD_ITEM" });
    }
    normItems.push({ tableId, seatNo, category, price });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ---- Idempotency: only one order per key --------------------------------
    const [dupes] = await conn.query(
      "SELECT id FROM orders WHERE order_key = ? LIMIT 1",
      [idemKey]
    );
    if (dupes.length) {
      await conn.rollback();
      return res.status(409).json({ ok: false, error: "DUPLICATE_ORDER" });
    }

    // ---- Verify seat availability / holds -----------------------------------
    for (const it of normItems) {
      const [cur] = await conn.query(
        `SELECT order_id, hold_id, hold_expires_at
           FROM seat_locks
          WHERE table_id = ? AND seat_no = ?
          FOR UPDATE`,
        [it.tableId, it.seatNo]
      );
      if (cur.length) {
        if (cur[0].order_id) {
          const err = new Error("SEAT_TAKEN");
          err.code = 409;
          throw err;
        }
        const activeHold = cur[0].hold_id && new Date(cur[0].hold_expires_at) > new Date();
        if (activeHold && cur[0].hold_id !== holdId) {
          const err = new Error("HOLD_MISMATCH");
          err.code = 409;
          throw err;
        }
      }
    }

    // ---- Work out dynamic columns (tolerant of future schema changes) -------
    // amount vs amount_cents
    const [[amountCentsCol]] = await conn.query("SHOW COLUMNS FROM orders LIKE 'amount_cents'");
    const amountField = amountCentsCol ? "amount_cents" : "amount";
    const amountToStore = amountCentsCol ? Math.round(amt * 100) : Number(amt.toFixed(2));

    // price vs price_cents (order_items)
    const [[priceCentsCol]] = await conn.query("SHOW COLUMNS FROM order_items LIKE 'price_cents'");
    const priceField = priceCentsCol ? "price_cents" : "price";

    // status column (let default apply if present)
    const [[statusCol]] = await conn.query("SHOW COLUMNS FROM orders LIKE 'status'");
    const statusHasDefault = !!statusCol?.Default;

    // ---- Insert order --------------------------------------------------------
    const payMethod = String(payVia || "ONEPAY_CARD").toUpperCase();
    const desc = (description || `Tickets for ${orderId || ""}`).trim();

    // Build column list; omit status if it has a default (matches your schema)
    const orderCols = ["order_key", "customer_id", "currency", amountField, "pay_method", "description"];
    const orderVals = [idemKey, null, currency, amountToStore, payMethod, desc];

    if (statusCol && !statusHasDefault) {
      orderCols.splice(5, 0, "status"); // before description
      // If no default, choose a safe initial value
      const statusValue = "CREATED";
      orderVals.splice(5, 0, statusValue);
    }

    const insSql = `INSERT INTO orders (${orderCols.join(", ")}) VALUES (${orderCols.map(() => "?").join(", ")})`;
    const [ins] = await conn.query(insSql, orderVals);
    const newOrderId = ins.insertId;

    // (Optional) persist some customer info if your schema has columns
    // try {
    //   await conn.query(
    //     "UPDATE orders SET customer_name=?, customer_email=?, customer_phone=? WHERE id=?",
    //     [customer.name || null, customer.email || null, customer.phone || null, newOrderId]
    //   );
    // } catch {}

    // ---- Attach locks and line items ----------------------------------------
    for (const it of normItems) {
      const priceToStore = priceCentsCol ? Math.round(it.price * 100) : Number(it.price.toFixed(2));

      // attach seat to this order (clears previous hold)
      await conn.query(
        `INSERT INTO seat_locks (table_id, seat_no, order_id, hold_id, hold_expires_at)
             VALUES (?, ?, ?, NULL, NULL)
         ON DUPLICATE KEY UPDATE
             order_id = VALUES(order_id),
             hold_id = NULL,
             hold_expires_at = NULL`,
        [it.tableId, it.seatNo, newOrderId]
      );

      const oiSql = `INSERT INTO order_items (order_id, table_id, seat_no, category, ${priceField})
                     VALUES (?, ?, ?, ?, ?)`;
      await conn.query(oiSql, [newOrderId, it.tableId, it.seatNo, it.category, priceToStore]);
    }

    // ---- Clear provided hold token ------------------------------------------
    if (holdId) {
      await conn.query(
        `UPDATE seat_locks
            SET hold_id = NULL, hold_expires_at = NULL
          WHERE hold_id = ? AND order_id = ?`,
        [holdId, newOrderId]
      );
    }

    await conn.commit();

    // Return id for next step (creating Onepay link)
    res.json({
      ok: true,
      id: newOrderId,
      amount: amt,
      currency,
    });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    // expose SQL detail to help during integration (keep in logs in prod)
    console.error("[ORDERS][ERROR]", e?.code, e?.errno, e?.sqlState, e?.sqlMessage || e);
    const status = e.code === 409 ? 409 : e.code === 400 ? 400 : 500;
    const error =
      e.message === "SEAT_TAKEN" ? "SEAT_TAKEN" :
      e.message === "HOLD_MISMATCH" ? "HOLD_MISMATCH" :
      e.message === "BAD_ITEM" ? "BAD_ITEM" :
      "ORDER_SAVE_FAILED";
    res.status(status).json({ ok: false, error, sqlMessage: e?.sqlMessage });
  } finally {
    conn.release();
  }
});

export default router;
