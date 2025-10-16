// server/routes/onepay.js
const express = require("express");
const router = express.Router();
const { createCheckout, verifySignatureFromOnePay } = require("../payments/onepay-client");
const pool = require("../db");

// Create OnePay checkout for an order
router.post("/create", async (req, res) => {
  try {
    const { orderId, amount, currency, description, customer } = req.body || {};
    if (!orderId || !amount) {
      return res.status(400).json({ ok: false, error: "Missing orderId/amount" });
    }

    // OPTIONAL: validate the order in DB
    const [rows] = await pool.query("SELECT status, amount FROM orders WHERE order_id=?", [orderId]);
    if (!rows.length) return res.status(404).json({ ok: false, error: "Order not found" });
    if (rows[0].status === "PAID") return res.status(409).json({ ok: false, error: "ALREADY_PAID" });

    // If your DB stores cents, line up the units you send to OnePay.
    const onepay = await createCheckout({
      reference: orderId,
      amount,          // align units with OnePay spec
      currency,        // "LKR"
      description,
      customer,
    });

    return res.json({ ok: true, ...onepay }); // typically includes { payment_url }
  } catch (e) {
    console.error("ONEPAY_CREATE_ERROR", e?.response?.data || e);
    return res.status(500).json({ ok: false, error: "ONEPAY_CREATE_FAILED" });
  }
});

// The browser is redirected here after payment (success/fail)
router.get("/return", async (req, res) => {
  try {
    const ref = req.query.ref;
    // You may also receive status codes in the query; if not, rely on webhook for truth.
    // Show a “processing your payment” page and poll your order status,
    // or redirect based on a quick DB check.
    return res.redirect(`/thank-you?ref=${encodeURIComponent(ref)}`);
  } catch {
    return res.redirect(`/payment-failed`);
  }
});

// Server-to-server notification (source of truth)
router.post("/webhook", express.json(), async (req, res) => {
  try {
    const payload = req.body || {};

    // 1) Verify signature
    const valid = verifySignatureFromOnePay(payload);
    if (!valid) {
      console.warn("ONEPAY_WEBHOOK_INVALID_SIGNATURE", payload);
      return res.status(400).json({ ok: false });
    }

    // 2) Confirm status & amount
    const { reference, status, amount } = payload; // status like "SUCCESS" / "FAILED"
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [rows] = await conn.query("SELECT amount, status FROM orders WHERE order_id=? FOR UPDATE", [reference]);
      if (!rows.length) {
        await conn.rollback();
        return res.status(404).json({ ok: false });
      }

      // (Optional) Compare amount with DB
      // if (+rows[0].amount !== +amount) { ... }

      // 3) Update order
      const newStatus = status === "SUCCESS" ? "PAID" : "FAILED";
      await conn.query("UPDATE orders SET status=?, paid_at=IF(?='PAID', NOW(), paid_at) WHERE order_id=?", [newStatus, newStatus, reference]);

      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("ONEPAY_WEBHOOK_ERROR", e);
    return res.status(500).json({ ok: false });
  }
});

module.exports = router;
