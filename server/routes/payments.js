// server/routes/payments.js
import express from "express";
import crypto from "node:crypto";
import { pool } from "../db.js";

const router = express.Router();

const APP_ID       = process.env.ONEPAY_APP_ID;
const APP_TOKEN    = process.env.ONEPAY_APP_TOKEN;    // Bearer for Item API
const HASH_SALT    = process.env.ONEPAY_HASH_SALT;    // secret used in hash
const FRONTEND_BASE = process.env.FRONTEND_BASE || "http://localhost:5173";

// ---------- utilities ----------
function to2dp(n) {
  return Number(n || 0).toFixed(2); // Onepay wants string with 2 decimals
}
function toE164(phone) {
  const p = String(phone || "").replace(/[^\d+]/g, "");
  return p.startsWith("+") ? p : (p ? `+${p}` : "");
}
function splitName(full = "") {
  const parts = String(full).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { first: "-", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts.slice(0, -1).join(" "), last: parts.at(-1) };
}
// Most accounts use app_id + reference + amount + currency + salt (confirm in your Onepay panel)
function computeHash({ appId, reference, amount2dp, currency, salt }) {
  const raw = `${appId}${reference}${amount2dp}${currency}${salt}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// ---------- Onepay helpers ----------
async function opCreateItem(item) {
  const r = await fetch("https://api.onepay.lk/v3/item/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${APP_TOKEN}`,
    },
    body: JSON.stringify(item),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data?.status !== 200) {
    const err = new Error(data?.message || `ONEPAY_ITEM_HTTP_${r.status}`);
    err.data = data;
    throw err;
  }
  return data.data.item_id;
}

async function opCreateCheckoutLink(payload) {
  const r = await fetch("https://api.onepay.lk/v3/checkout/link/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data?.status !== 200) {
    const err = new Error(data?.message || `ONEPAY_LINK_HTTP_${r.status}`);
    err.data = data;
    throw err;
  }
  return {
    redirectUrl: data.data?.gateway?.redirect_url,
    ipgId: data.data?.ipg_transaction_id,
  };
}

// ---------- routes ----------
/**
 * POST /api/pay/onepay/link
 * body: { orderId:number }
 */
router.post("/onepay/link", async (req, res) => {
  if (!APP_ID || !APP_TOKEN || !HASH_SALT) {
    return res.status(500).json({ ok: false, error: "ONEPAY_ENV_MISSING" });
  }

  const { orderId } = req.body || {};
  if (!orderId) return res.status(400).json({ ok: false, error: "MISSING_ORDER_ID" });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Your schema: orders.id, currency, amount, status, customer_id
    const [orders] = await conn.query(
      `SELECT o.id, o.currency, o.amount, o.status, o.customer_id,
              c.full_name, c.email, c.phone
         FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id
        WHERE o.id = ?`,
      [orderId]
    );
    if (!orders.length) {
      await conn.rollback();
      return res.status(404).json({ ok: false, error: "ORDER_NOT_FOUND" });
    }
    const order = orders[0];

    if (String(order.status).toUpperCase() === "PAID") {
      await conn.rollback();
      return res.status(409).json({ ok: false, error: "ALREADY_PAID" });
    }

    // Items from order_items (order_id FK -> orders.id)
    const [rows] = await conn.query(
      `SELECT table_id AS tableCode, seat_no AS seatNo, category, price
         FROM order_items
        WHERE order_id = ?`,
      [orderId]
    );
    if (!rows.length) {
      await conn.rollback();
      return res.status(400).json({ ok: false, error: "NO_ITEMS" });
    }

    // Create Onepay items
    const onepayItemIds = [];
    for (const it of rows) {
      const seatNo   = Number(it.seatNo);
      const priceNum = Number(it.price);
      const table    = String(it.tableCode || "").trim();
      if (!table || !Number.isFinite(seatNo) || !Number.isFinite(priceNum)) {
        await conn.rollback();
        return res.status(400).json({ ok: false, error: "BAD_ITEM" });
      }

      const name = `${(it.category || "ticket").toUpperCase()} – ${table} Seat ${seatNo}`;
      const description = `Event ticket for table ${table}, seat ${seatNo}`;

      const itemBody = {
        name,
        description,
        price: priceNum,              // numeric
        currency: "LKR",
        image_url: "https://onepay.lk/static/img/ticket.png",
        metadata: { table, seat: String(seatNo), category: String(it.category || "") },
      };

      const itemId = await opCreateItem(itemBody);
      onepayItemIds.push(itemId);
    }

    // Build checkout payload as Onepay expects
    const reference = String(order.id);                   // your order reference
    const currency  = order.currency || "LKR";
    const amount2dp = to2dp(order.amount);               // "7070.00"
    const { first, last } = splitName(order.full_name || "-");
    const phoneE164 = toE164(order.phone || "");
    const hash = computeHash({ appId: APP_ID, reference, amount2dp, currency, salt: HASH_SALT });

    const payload = {
      app_id: APP_ID,
      hash,
      currency,
      amount: amount2dp,                                  // string with 2 decimals
      reference,
      customer_first_name: first,
      customer_last_name: last,
      customer_email: order.email || "",
      customer_phone_number: phoneE164,
      transaction_redirect_url: `${FRONTEND_BASE}/payment/return?ref=${encodeURIComponent(reference)}`,
      additionalData: `order=${reference}`,
      // Onepay wants array of objects: { item_id, quantity }
      items: onepayItemIds.map(id => ({ item_id: id, quantity: 1 })),
    };

    const { redirectUrl /*, ipgId*/ } = await opCreateCheckoutLink(payload);

    // Update only what exists in your schema
    await conn.query(`UPDATE orders SET status = ? WHERE id = ?`, [
      "PENDING_PAYMENT",
      orderId,
    ]);

    await conn.commit();
    return res.json({ ok: true, checkoutUrl: redirectUrl });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    console.error("[ONEPAY_LINK_ERROR]", e?.data || e);
    return res
      .status(500)
      .json({ ok: false, error: e?.data?.message || e.message || "ONEPAY_LINK_FAILED" });
  } finally {
    conn.release();
  }
});

export default router;
