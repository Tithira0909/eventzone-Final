// server/routes/locks.js
import express from "express";
import { pool } from "../db.js";
import crypto from "crypto";

const router = express.Router();

/**
 * Return all effective locks:
 *  - permanent: rows with order_id IS NOT NULL
 *  - active holds: hold_expires_at > NOW()
 */
router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT table_id AS tableId, seat_no AS seatNo
       FROM seat_locks
       WHERE order_id IS NOT NULL
          OR (hold_id IS NOT NULL AND hold_expires_at > NOW())`
    );
    res.json({ ok: true, locks: rows });
  } catch (e) {
    console.error("[locks][GET] error", e);
    res.status(500).json({ ok: false, error: "LOCKS_UNAVAILABLE" });
  }
});

/**
 * Create/refresh a hold for a list of seats.
 * Body: { seats:[{tableId,seatNo}], ttlSec, holdId? }
 * Returns: {ok:true, holdId}
 */
router.post("/hold", async (req, res) => {
  const { seats, ttlSec = 600, holdId } = req.body || {};
  if (!Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({ ok: false, error: "BAD_REQUEST" });
  }

  const effectiveHoldId = holdId || "H_" + crypto.randomBytes(8).toString("hex");
  const expiresAtSql = `DATE_ADD(NOW(), INTERVAL ? SECOND)`;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const s of seats) {
      const tableId = String(s.tableId || "").trim();
      const seatNo  = Number(s.seatNo || 0);
      if (!tableId || seatNo < 1 || seatNo > 10) {
        throw Object.assign(new Error("BAD_ITEM"), { code: 400 });
      }

      // Check current state of this seat
      const [cur] = await conn.query(
        `SELECT order_id, hold_id, hold_expires_at
           FROM seat_locks
          WHERE table_id=? AND seat_no=?`,
        [tableId, seatNo]
      );

      // Already permanently booked?
      if (cur.length && cur[0].order_id) {
        throw Object.assign(new Error("SEAT_TAKEN"), { code: 409 });
      }

      // If there is an active hold by someone else, reject
      if (
        cur.length &&
        cur[0].hold_id &&
        new Date(cur[0].hold_expires_at) > new Date() &&
        cur[0].hold_id !== effectiveHoldId
      ) {
        throw Object.assign(new Error("SEAT_TAKEN"), { code: 409 });
      }

      // Upsert/refresh our hold
      await conn.query(
        `INSERT INTO seat_locks (table_id, seat_no, hold_id, hold_expires_at)
             VALUES (?, ?, ?, ${expiresAtSql})
         ON DUPLICATE KEY UPDATE
             hold_id = VALUES(hold_id),
             hold_expires_at = ${expiresAtSql}`,
        [tableId, seatNo, effectiveHoldId, ttlSec, ttlSec]
      );
    }

    await conn.commit();
    res.json({ ok: true, holdId: effectiveHoldId });
  } catch (e) {
    await conn.rollback();
    const status = e.code === 409 ? 409 : e.code === 400 ? 400 : 500;
    const error =
      e.message === "SEAT_TAKEN" ? "SEAT_TAKEN" :
      e.message === "BAD_ITEM"   ? "BAD_ITEM"   :
      "LOCK_FAILED";
    res.status(status).json({ ok: false, error });
  } finally {
    conn.release();
  }
});

/** Release a hold explicitly (best-effort) */
router.post("/release", async (req, res) => {
  const { holdId } = req.body || {};
  if (!holdId) return res.json({ ok: true });
  try {
    await pool.query(
      `UPDATE seat_locks
          SET hold_id = NULL, hold_expires_at = NULL
        WHERE hold_id = ? AND order_id IS NULL`,
      [holdId]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: "RELEASE_FAILED" });
  }
});

export default router;
