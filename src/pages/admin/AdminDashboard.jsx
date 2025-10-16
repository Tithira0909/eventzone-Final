// src/pages/AdminDashboard.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import {
  Download,
  LogOut,
  QrCode,
  Search,
  Trash2,
  Camera,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { saveAs } from "file-saver";
import { API_BASE } from "../../config";

/* ---------------- amounts / fee ---------------- */
const money = (n) =>
  `${Number(n || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} LKR`;

const FEE_RATE = 0.015; // 1.5%
const SCAN_TIMEOUT_MS = 20000;
const HILITE_MS = 6000;

/* ---------------- seat + category helpers ---------------- */
const CAT_RULES = {
  A: "vip",
  B: "vip",
  C: "vip",
  D: "vip",
  E: "vip",
  F: "general",
  G: "general",
  H: "general",
  I: "general",
  J: "general",
  K: "general",
  L: "general",
  M: "general",
  N: "general",
  O: "general",
  P: "general",
};
const catFor = (tableId) =>
  CAT_RULES[String(tableId || "X").charAt(0).toUpperCase()] || "general";

const genOrderId = (prefix = "EVZ") =>
  `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

function computeTotalFromItems(items) {
  const subtotal = (items || []).reduce((s, it) => s + (it.price || 0), 0);
  const fee = Math.round(subtotal * FEE_RATE);
  return subtotal + fee;
}

/* ---------- RECORD BUILDERS (legacy seat/general/vip scans) ---------- */
function recordFromSeatQR({ tableId, seats }) {
  const category = catFor(tableId);
  const items = (seats || [])
    .map(Number)
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 10)
    .map((seatNo) => ({
      id: `${tableId}-${seatNo}`,
      tableId,
      seatNo,
      category,
      price: category === "vip" ? 7500 : 5000,
    }));
  return {
    orderId: `SEAT-${tableId}`,
    amount: computeTotalFromItems(items),
    currency: "LKR",
    description: `Seat QR for ${tableId}`,
    items,
    customer: {},
    payVia: "SEAT_QR",
    ts: new Date().toISOString(),
    checkedInAt: new Date().toISOString(),
    status: "Ticket Book",
  };
}
function mergeSeatRecord(rows, rec) {
  const i = rows.findIndex((r) => r.orderId === rec.orderId);
  if (i === -1) return [rec, ...rows];
  const seen = new Set((rows[i].items || []).map((x) => x.id));
  const merged = [...rows[i].items];
  for (const it of rec.items || []) if (!seen.has(it.id)) merged.push(it);
  const updated = {
    ...rows[i],
    items: merged,
    amount: computeTotalFromItems(merged),
    checkedInAt: new Date().toISOString(),
    status: "Ticket Book",
  };
  const copy = [...rows];
  copy[i] = updated;
  return copy;
}
function recordFromVipTicket(orderIdIn) {
  const orderId = orderIdIn || genOrderId("VIP");
  const items = [
    {
      id: `VIP-${orderId}`,
      tableId: "VIP",
      seatNo: 0,
      category: "vip",
      price: 7500,
    },
  ];
  return {
    orderId,
    amount: computeTotalFromItems(items),
    currency: "LKR",
    description: "VIP Ticket",
    items,
    customer: {},
    payVia: "OFFLINE",
    ts: new Date().toISOString(),
    checkedInAt: new Date().toISOString(),
    status: "Checked-in",
  };
}
function recordFromGeneralTicket(qtyIn = 1, orderIdIn) {
  const qty = Math.max(1, Number(qtyIn) || 1);
  const orderId = orderIdIn || genOrderId("GEN");
  const items = Array.from({ length: qty }, (_, i) => ({
    id: `GEN-${orderId}-${i + 1}`,
    tableId: "GENERAL",
    seatNo: i + 1,
    category: "general",
    price: 5000,
  }));
  return {
    orderId,
    amount: computeTotalFromItems(items),
    currency: "LKR",
    description: `General Ticket x${qty}`,
    items,
    customer: {},
    payVia: "OFFLINE",
    ts: new Date().toISOString(),
    checkedInAt: new Date().toISOString(),
    status: "Checked-in",
  };
}

/* ============================ DASHBOARD ============================ */
export default function AdminDashboard() {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const stopControlsRef = useRef(null);
  const awaitingRef = useRef(false);
  const timerRef = useRef(null);

  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanErr, setScanErr] = useState("");
  const [permGranted, setPermGranted] = useState(false);

  // server-backed rows
  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [q, setQ] = useState("");
  const [hiliteId, setHiliteId] = useState(""); // orderId to highlight

  /* ---- load all bookings from API ---- */
  const fetchRows = async () => {
    try {
      setLoadingRows(true);
      const r = await fetch(`${API_BASE}/api/admin/orders`, { cache: "no-store" });
      const data = await r.json().catch(() => ({}));
      // expected shape: { ok:true, orders:[{orderId, amount, currency, customer:{name,email,phone}, items:[...], status, checkedInAt, ts}] }
      if (data?.ok && Array.isArray(data.orders)) {
        setRows(data.orders);
      } else {
        setRows([]);
      }
    } catch {
      setRows([]);
    } finally {
      setLoadingRows(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  /* ---- ask permission & enumerate ---- */
  const requestPermission = async () => {
    setScanErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      stream.getTracks().forEach((t) => t.stop());
      setPermGranted(true);

      const list = await BrowserMultiFormatReader.listVideoInputDevices();
      setDevices(list || []);
      const back = list?.find((d) => /back|rear|environment/i.test(d.label));
      setDeviceId(back?.deviceId || list?.[0]?.deviceId || "");
    } catch (e) {
      setPermGranted(false);
      setScanErr(humanizeCamError(e));
    }
  };
  useEffect(() => {
    navigator.permissions?.query?.({ name: "camera" }).then((s) => {
      if (s?.state === "granted") requestPermission();
    });
  }, []);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  const stopScan = () => {
    try {
      readerRef.current?.reset();
      stopControlsRef.current?.stop?.();
    } catch {}
    setScanning(false);
    if (awaitingRef.current) {
      awaitingRef.current = false;
      clearTimer();
    }
  };
  useEffect(() => () => stopScan(), []);

  const startScan = async () => {
    setScanErr("");
    if (!permGranted) {
      await requestPermission();
      if (!permGranted) return;
    }
    try {
      if (!readerRef.current) readerRef.current = new BrowserMultiFormatReader();

      const runDecode = async (idOrUndefined) =>
        readerRef.current.decodeFromVideoDevice(
          idOrUndefined,
          videoRef.current,
          (result, err) => {
            if (result) handleDecoded(result.getText());
            if (err && err.name !== "NotFoundException") {
              setScanErr((s) => s || humanizeCamError(err));
            }
          }
        );

      let controls;
      try {
        controls = await runDecode(deviceId || undefined);
      } catch {
        controls = await runDecode(undefined);
      }
      stopControlsRef.current = controls;
      setScanning(true);

      awaitingRef.current = true;
      clearTimer();
      timerRef.current = setTimeout(() => {
        if (awaitingRef.current) {
          stopScan();
          setScanErr("Timed out waiting for a QR. Try again.");
        }
      }, SCAN_TIMEOUT_MS);
    } catch (e) {
      setScanning(false);
      setScanErr(humanizeCamError(e));
    }
  };

  const flipCamera = () => {
    if (devices.length > 1) {
      const idx = devices.findIndex((d) => d.deviceId === deviceId);
      const next = devices[(idx + 1) % devices.length]?.deviceId || devices[0].deviceId;
      setDeviceId(next);
      if (scanning) {
        stopScan();
        startScan();
      }
    } else {
      if (scanning) {
        stopScan();
        startScan();
      }
    }
  };

  /* ---------------- decode → match order → check-in ---------------- */
  const handleDecoded = async (text) => {
    if (!awaitingRef.current) return;

    try {
      const payload = JSON.parse(text);

      // NEW: primary path — full checkout payload (what your Checkout QR encodes)
      if (payload?.orderId) {
        const id = String(payload.orderId).trim();
        const idx = rows.findIndex((r) => String(r.orderId) === id);
        if (idx === -1) {
          setScanErr(`Order ${id} not found in bookings.`);
        } else {
          // optimistic UI: highlight + mark checked-in
          const nowIso = new Date().toISOString();
          setRows((prev) => {
            const copy = [...prev];
            const r = copy[idx];
            copy[idx] = {
              ...r,
              status: "Checked-in",
              checkedInAt: nowIso,
            };
            return copy;
          });
          setHiliteId(id);
          setTimeout(() => setHiliteId(""), HILITE_MS);

          // persist to backend
          try {
            await fetch(`${API_BASE}/api/admin/checkin`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: id }),
            });
          } catch {}
        }
        awaitingRef.current = false;
        clearTimer();
        stopScan();
        return;
      }

      /* ===== Back-compat for older seat QR payloads ===== */
      if (
        (payload && payload.seatTag && typeof payload.tableId === "string" && Number.isInteger(payload.seatNo)) ||
        (payload && typeof payload.tableId === "string" && Number.isInteger(payload.seatNo) && !payload.type)
      ) {
        const tableId = payload.tableId.trim();
        const seats = [Number(payload.seatNo)];
        const rec = recordFromSeatQR({ tableId, seats });
        // For seat QR we just inject a synthetic row (kept from your original UX)
        setRows((curr) => mergeSeatRecord(curr, rec));
        setHiliteId(rec.orderId);
        setTimeout(() => setHiliteId(""), HILITE_MS);
        awaitingRef.current = false;
        clearTimer();
        stopScan();
        return;
      }

      // 2) Ticket QRs (single VIP or N general) — legacy offline paths
      if (payload?.type === "vip_ticket") {
        const rec = recordFromVipTicket(payload.orderId);
        setRows((curr) =>
          curr.some((r) => r.orderId === rec.orderId) ? curr : [rec, ...curr]
        );
        setHiliteId(rec.orderId);
        setTimeout(() => setHiliteId(""), HILITE_MS);
        awaitingRef.current = false;
        clearTimer();
        stopScan();
        return;
      }
      if (payload?.type === "general_ticket") {
        const rec = recordFromGeneralTicket(payload.qty, payload.orderId);
        setRows((curr) =>
          curr.some((r) => r.orderId === rec.orderId) ? curr : [rec, ...curr]
        );
        setHiliteId(rec.orderId);
        setTimeout(() => setHiliteId(""), HILITE_MS);
        awaitingRef.current = false;
        clearTimer();
        stopScan();
        return;
      }

      setScanErr("This QR is not a valid ticket or seat QR.");
    } catch {
      setScanErr("This QR is not a valid ticket.");
    }
  };

  /* ---------------- filter/search ---------------- */
  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const n = q.trim().toLowerCase();
    return rows.filter((r) =>
      [r.orderId, r.customer?.name, r.customer?.email, r.customer?.phone]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(n))
    );
  }, [rows, q]);

  /* ---------------- CSV / misc ---------------- */
  const exportCSV = () => {
    const header = [
      "orderId",
      "amount",
      "currency",
      "customerName",
      "customerEmail",
      "customerPhone",
      "payVia",
      "createdAt",
      "checkedInAt",
      "status",
      "items",
    ];
    const lines = filtered.map((r) => {
      const itemStr = JSON.stringify(r.items);
      return [
        r.orderId,
        r.amount,
        r.currency,
        r.customer?.name || "",
        r.customer?.email || "",
        r.customer?.phone || "",
        r.payVia || "",
        r.ts || "",
        r.checkedInAt || "",
        r.status || "",
        itemStr?.replaceAll(",", ";"),
      ]
        .map((x) => `"${String(x ?? "").replaceAll('"', '""')}"`)
        .join(",");
    });
    const csv = [header.join(","), ...lines].join("\n");
    saveAs(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
      `admin_checkins_${new Date().toISOString().slice(0, 10)}.csv`
    );
  };
  const clearAll = () => confirm("Clear all scanned records?") && setRows([]);
  const logout = () => {
    localStorage.removeItem("adminAuthed");
    location.href = "/admin/login";
  };

  return (
    <div className="min-h-screen bg-gray-950 text-teal-100">
      {/* Top */}
      <header className="sticky top-0 z-40 border-b border-teal-800/40 bg-gray-900/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:px-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-teal-400 to-amber-300" />
            <span className="font-semibold text-sm sm:text-base">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchRows}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs sm:text-sm hover:bg-white/10"
              title="Refresh orders"
            >
              Refresh
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs sm:text-sm hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
        <div className="grid gap-4 md:grid-cols-12">
          {/* Scanner */}
          <section className="md:col-span-5 rounded-2xl border border-white/10 bg-gray-900/60 p-3 sm:p-4">
            <h2 className="mb-3 flex items-center gap-2 text-base sm:text-lg font-semibold">
              <QrCode className="h-5 w-5" /> QR Scanner
            </h2>

            {!permGranted && (
              <button
                onClick={requestPermission}
                className="mb-3 inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-3 py-2 text-sm hover:bg-emerald-500/30"
              >
                <ShieldCheck className="h-4 w-4" />
                Grant camera access
              </button>
            )}

            <div className="mb-2 grid grid-cols-1 sm:flex sm:flex-wrap sm:items-center gap-2">
              <select
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="w-full sm:w-auto rounded-lg border border-white/10 bg-white/5 px-3 py-2 pr-8 text-sm outline-none focus:ring-2 focus:ring-teal-600"
              >
                {devices.length === 0 ? (
                  <option value="">
                    {permGranted ? "No cameras found" : "Select camera (allow first)"}
                  </option>
                ) : (
                  devices.map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `camera ${i}`}
                    </option>
                  ))
                )}
              </select>

              <div className="grid grid-cols-2 sm:flex gap-2">
                <button
                  type="button"
                  onClick={flipCamera}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
                  title="Flip camera"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Flip
                </button>

                {!scanning ? (
                  <button
                    onClick={startScan}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-amber-200"
                  >
                    <Camera className="h-4 w-4" />
                    Start Scan
                  </button>
                ) : (
                  <button
                    onClick={stopScan}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
                  >
                    Stop
                  </button>
                )}
              </div>
            </div>

            {/* Video */}
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/60">
              <div className="relative w-full sm:aspect-video aspect-[3/4]">
                <video
                  ref={videoRef}
                  className="absolute inset-0 h-full w-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
              </div>
            </div>

            {scanErr && (
              <p className="mt-2 text-xs sm:text-sm text-red-300">
                {scanErr}
                {location.protocol !== "https:" && (
                  <> — Tip: use HTTPS (or http://localhost) to access the camera.</>
                )}
              </p>
            )}

            <div className="mt-3 grid grid-cols-1 sm:flex sm:items-center gap-2">
              <button
                onClick={exportCSV}
                className="w-full sm:w-auto rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
              >
                <Download className="mr-1 inline h-4 w-4" />
                Export CSV
              </button>
              <button
                onClick={() => clearAll()}
                className="w-full sm:w-auto rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-white/10"
              >
                <Trash2 className="mr-1 inline h-4 w-4" />
                Clear
              </button>
            </div>
          </section>

          {/* Results */}
          <section className="md:col-span-7 rounded-2xl border border-white/10 bg-gray-900/60 p-3 sm:p-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base sm:text-lg font-semibold">
                Scanned Check-ins {loadingRows ? "• Loading…" : ""}
              </h2>
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-teal-200/60" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by Order, Name, Email, Phone"
                  className="w-full rounded-lg border border-white/10 bg-gray-900 pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            {/* Mobile cards (unchanged) */}
            <div className="sm:hidden space-y-2">
              {filtered.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-teal-200/70 text-sm text-center">
                  No records yet. Scan a QR to populate.
                </div>
              ) : (
                filtered.map((r) => (
                  <div
                    key={r.orderId}
                    className={`rounded-xl border border-white/10 p-3 ${
                      hiliteId === r.orderId ? "ring-2 ring-emerald-400 bg-emerald-500/10" : "bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{r.orderId}</div>
                      <div className="text-xs text-teal-200/70">
                        {r.checkedInAt ? new Date(r.checkedInAt).toLocaleString() : "-"}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-teal-200/80">
                      {r.customer?.name || "-"} • {r.customer?.email || "-"} •{" "}
                      {r.customer?.phone || "-"}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {r.items?.slice(0, 4).map((it) => (
                        <span
                          key={it.id || `${it.tableId}-${it.seatNo}`}
                          className="rounded-full border border-white/10 bg-gray-900/60 px-2 py-[2px] text-[11px]"
                        >
                          {(it.category || "seat").toUpperCase()} • {it.tableId} • S{it.seatNo}
                        </span>
                      ))}
                      {r.items?.length > 4 && (
                        <span className="text-[11px] text-teal-200/70">
                          +{r.items.length - 4} more
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span
                        className={`rounded-full px-2 py-[2px] text-[11px] ${
                          r.status === "Ticket Book"
                            ? "bg-sky-500/15 text-sky-300"
                            : "bg-emerald-500/15 text-emerald-300"
                        }`}
                      >
                        {r.status || "-"}
                      </span>
                      <span className="font-semibold text-amber-300">{money(r.amount)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-auto rounded-xl border border-white/10">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5 text-teal-200/80">
                  <tr>
                    <th className="px-3 py-2 text-left">Order ID</th>
                   
                    <th className="px-3 py-2 text-left">Items</th>
                    <th className="px-3 py-2">Total</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Checked-in</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-teal-200/70">
                        {loadingRows ? "Loading bookings…" : "No records yet. Scan a QR to populate."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => (
                      <tr
                        key={r.orderId}
                        className={`hover:bg-white/5 ${
                          hiliteId === r.orderId ? "bg-emerald-500/10 ring-1 ring-emerald-400" : ""
                        }`}
                      >
                        <td className="px-3 py-2 font-semibold">{r.orderId}</td>
                        
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {r.items?.slice(0, 4).map((it) => (
                              <span
                                key={it.id || `${it.tableId}-${it.seatNo}`}
                                className="rounded-full border border-white/10 bg-white/5 px-2 py-[2px] text-[11px]"
                              >
                                {(it.category || "seat").toUpperCase()} • {it.tableId} • S{it.seatNo}
                              </span>
                            ))}
                            {r.items?.length > 4 && (
                              <span className="text-xs text-teal-200/70">
                                +{r.items.length - 4} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center font-semibold text-amber-300">
                          {money(r.amount)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`rounded-full px-2 py-[2px] text-[11px] ${
                              (r.status || "").toLowerCase() === "checked-in"
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-sky-500/15 text-sky-300"
                            }`}
                          >
                            {r.status || "-"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center text-xs text-teal-200/70">
                          {r.checkedInAt ? new Date(r.checkedInAt).toLocaleString() : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

/* ------------- friendly camera errors ------------- */
function humanizeCamError(e) {
  const msg = e?.message || "";
  const name = e?.name || "";
  if (name === "NotAllowedError" || /Permission|denied/i.test(msg))
    return "Camera permission is blocked. Tap the address bar → Site settings → Allow camera, then reload.";
  if (name === "NotFoundError" || /no video input|no camera/i.test(msg))
    return "No camera found on this device.";
  if (name === "NotReadableError")
    return "The camera is already in use by another app/tab. Close other apps and try again.";
  if (location.protocol !== "https:")
    return "Camera requires HTTPS (or http://localhost during development).";
  return msg || "Failed to start camera. Check site permissions.";
}
