// server/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import { pool } from "./db.js";
import locksRouter from "./routes/locks.js";
import ordersRouter from "./routes/orders.js";
import adminRouter from "./routes/admin.js";
import paymentsRouter from "./routes/payments.js";

/* -------------------- App -------------------- */
const app = express();

// If you deploy behind a proxy (Vercel/Render/NGINX), keep client IP correct:
app.set("trust proxy", true);

// Parse JSON up to 1MB (adjust if you need more)
app.use(express.json({ limit: "1mb" }));

/* -------------------- CORS -------------------- */
// SUPPORT: CORS_ORIGIN can be a single origin or comma-separated list.
// e.g. CORS_ORIGIN=http://localhost:5173,https://yourdomain.com
const rawOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // allow non-browser tools (no origin) and whitelisted origins
      if (!origin || rawOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS: Origin not allowed"));
    },
    credentials: true,
  })
);

/* -------------------- Health -------------------- */
app.get("/health", (_req, res) => res.json({ ok: true }));

/* -------------------- Routes -------------------- */
app.use("/api/locks", locksRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/admin", adminRouter);
app.use("/api/pay", paymentsRouter);

/* -------------------- 404 & Error Handler -------------------- */
app.use((req, res, next) => {
  if (res.headersSent) return next();
  res.status(404).json({ ok: false, error: "NOT_FOUND", path: req.originalUrl });
});

app.use((err, _req, res, _next) => {
  console.error("[ERROR]", err);
  const status = Number(err.status || 500);
  res.status(status).json({
    ok: false,
    error: err.message || "SERVER_ERROR",
  });
});

/* -------------------- Boot -------------------- */
process.on("unhandledRejection", (e) => console.error("[UNHANDLED_REJECTION]", e));
process.on("uncaughtException", (e) => {
  console.error("[UNCAUGHT_EXCEPTION]", e);
  process.exit(1);
});

(async () => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();

    // Helpful reminder if Onepay env vars are missing
    const missing = ["ONEPAY_APP_ID", "ONEPAY_API_KEY", "ONEPAY_HASH_SALT"].filter(
      (k) => !process.env[k]
    );
    if (missing.length) {
      console.warn(
        `[WARN] Missing Onepay env vars: ${missing.join(
          ", "
        )}. Redirect checkout link creation may fail.`
      );
    }

    const port = Number(process.env.PORT || 4000);
    app.listen(port, () => {
      console.log(`[API] Listening on http://localhost:${port}`);
      console.log(`[CORS] Allowed origins: ${rawOrigins.join(", ")}`);
    });
  } catch (e) {
    console.error("[BOOT_ERROR] MySQL connect failed:", e);
    process.exit(1);
  }
})();
