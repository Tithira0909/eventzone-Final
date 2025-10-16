import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Printer, Save, Search, QrCode } from "lucide-react";
import { API_BASE } from "../../config";

/* ---------- helpers ---------- */
const VIP_LETTERS = new Set(["A", "B", "C", "D", "E"]);
const isVipTable = (tableId) =>
  VIP_LETTERS.has(String(tableId).trim().charAt(0).toUpperCase());
const unitPrice = (tableId) => (isVipTable(tableId) ? 7500 : 5000);
const money = (n) =>
  `${Number(n || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} LKR`;

async function postJSON(url, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data?.ok) {
    const err = new Error(data?.error || `HTTP ${r.status}`);
    err.data = data;
    throw err;
  }
  return data;
}

export default function TicketBook() {
  const nav = useNavigate();

  const [tableId, setTableId] = useState("");
  const [sel, setSel] = useState(() => new Set());
  const [saving, setSaving] = useState(false);
  const [source, setSource] = useState("ticket_book"); // 'ticket_book' | 'pickme'

  // QR of last saved
  const [lastOrderId, setLastOrderId] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");

  // recent orders (right pane)
  const [orders, setOrders] = useState([]);
  const [q, setQ] = useState("");

  const seats = useMemo(() => Array.from({ length: 10 }, (_, i) => i + 1), []);
  const qty = sel.size;
  const total = qty * unitPrice(tableId);

  const toggleSeat = (n) =>
    setSel((old) => {
      const s = new Set(old);
      s.has(n) ? s.delete(n) : s.add(n);
      return s;
    });

  const selectAll = () => setSel(new Set(seats));
  const clearSeats = () => setSel(new Set());

  const valid = tableId.trim().length >= 2 && sel.size > 0;

  /* ----- load existing Ticket Book + PickMe orders ----- */
  async function fetchOrders() {
    try {
      const r = await fetch(`${API_BASE}/api/admin/orders`, { cache: "no-store" });
      const data = await r.json().catch(() => ({}));
      const list = Array.isArray(data?.orders) ? data.orders : [];
      setOrders(
        list.filter((o) => {
          const s = (o.status || "").toLowerCase();
          return s === "ticket book" || s === "pickme";
        })
      );
    } catch {
      setOrders([]);
    }
  }
  useEffect(() => {
    fetchOrders();
  }, []);

  /* ----- save to DB and build QR ----- */
  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      const seatsArray = Array.from(sel).sort((a, b) => a - b);
      const res = await postJSON(`${API_BASE}/api/admin/ticket-book`, {
        tableId: tableId.trim(),
        seats: seatsArray,
        source, // 'ticket_book' or 'pickme'
      });
      const oid = res.orderId;
      setLastOrderId(oid);

      const { toDataURL } = await import("qrcode");
      const png = await toDataURL(JSON.stringify({ orderId: oid }), {
        errorCorrectionLevel: "M",
        margin: 1,
        scale: 8,
      });
      setQrDataUrl(png);

      fetchOrders();
    } catch (e) {
      alert(
        `Failed to save.\n` + (e?.data?.sqlMessage || e?.message || "Unknown error")
      );
    } finally {
      setSaving(false);
    }
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${lastOrderId || "Ticket"}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const printQR = () => {
    if (!qrDataUrl) return;
    const win = window.open("", "printqr");
    win.document.write(`
      <html><head><title>${lastOrderId}</title>
      <style>body{font-family:system-ui;padding:24px;text-align:center}
      .id{margin-top:8px;font-weight:600}</style></head>
      <body><img src="${qrDataUrl}" style="width:256px;height:256px;"/>
      <div class="id">${lastOrderId}</div></body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  const filtered = useMemo(() => {
    if (!q.trim()) return orders;
    const needle = q.trim().toLowerCase();
    return orders.filter((r) =>
      [r.orderId, r.description, r.customer?.name, r.customer?.email, r.customer?.phone]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle))
    );
  }, [orders, q]);

  return (
    <div className="min-h-screen bg-gray-950 text-teal-100">
      <header className="sticky top-0 z-40 border-b border-teal-800/40 bg-gray-900/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-3 sm:px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => nav(-1)}
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 hover:bg-white/10"
              title="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="font-semibold">Ticket Book</span>
          </div>
          <div className="text-xs text-teal-200/70">
            VIP tables: A–E • {money(7500)} per seat · General: {money(5000)} per seat
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6">
        <div className="grid gap-4 md:grid-cols-12">
          {/* left: form */}
          <section className="md:col-span-5 rounded-2xl border border-white/10 bg-gray-900/60 p-4">
            <h2 className="mb-3 text-lg font-semibold">Create Ticket</h2>

            <label className="block text-sm text-teal-200/80">Order Type</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="mt-1 mb-3 w-full rounded-lg border border-white/10 bg-gray-900 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="ticket_book">Ticket Book</option>
              <option value="pickme">PickMe</option>
            </select>

            <label className="block text-sm text-teal-200/80">Table ID</label>
            <input
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
              placeholder="e.g. A-5"
              className="mt-1 w-full rounded-lg border border-white/10 bg-gray-900 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-600"
            />

            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm text-teal-200/80">Seats (1–10)</span>
                <div className="space-x-2">
                  <button
                    onClick={selectAll}
                    className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
                  >
                    Select all
                  </button>
                  <button
                    onClick={clearSeats}
                    className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {seats.map((n) => {
                  const on = sel.has(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => toggleSeat(n)}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                        on
                          ? "bg-emerald-500/20 border border-emerald-500/40"
                          : "bg-white/5 border border-white/10 hover:bg-white/10"
                      }`}
                    >
                      S{n}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between text-sm">
                <span>Category</span>
                <span className="font-semibold">
                  {tableId ? (isVipTable(tableId) ? "VIP" : "GENERAL") : "-"}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span>Seats</span>
                <span className="font-semibold">{qty}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span>Unit price</span>
                <span className="font-semibold">
                  {tableId ? money(unitPrice(tableId)) : "-"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-base font-semibold">
                <span>Total</span>
                <span className="text-amber-300">{money(total)}</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                disabled={!valid || saving}
                onClick={handleSave}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 font-semibold ${
                  !valid || saving
                    ? "cursor-not-allowed bg-white/10 text-teal-300/50"
                    : "bg-amber-300 text-gray-900 hover:bg-amber-200"
                }`}
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save"}
              </button>

              <button
                disabled={!qrDataUrl}
                onClick={downloadQR}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-semibold hover:bg-white/10"
              >
                <Download className="h-4 w-4" />
                Download QR
              </button>
              <button
                disabled={!qrDataUrl}
                onClick={printQR}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-semibold hover:bg-white/10"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
            </div>

            {qrDataUrl && (
              <div className="mt-4 grid place-items-center">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                  <div className="mb-2 flex items-center justify-center gap-2 text-sm font-semibold">
                    <QrCode className="h-4 w-4" />
                    Ticket QR
                  </div>
                  <img
                    src={qrDataUrl}
                    alt="Ticket QR"
                    className="h-56 w-56 rounded-lg bg-white p-3"
                  />
                  <div className="mt-2 text-xs text-teal-200/80">{lastOrderId}</div>
                </div>
              </div>
            )}
          </section>

          {/* right: recent Ticket Book + PickMe */}
          <section className="md:col-span-7 rounded-2xl border border-white/10 bg-gray-900/60 p-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold">Recent Ticket Book & PickMe</h2>
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-teal-200/60" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by Order / Customer / Phone"
                  className="w-full rounded-lg border border-white/10 bg-gray-900 pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            <div className="overflow-auto rounded-xl border border-white/10">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5 text-teal-200/80">
                  <tr>
                    <th className="px-3 py-2 text-left">Order ID</th>
                    <th className="px-3 py-2 text-left">Items</th>
                    <th className="px-3 py-2 text-right">Total</th>
                    <th className="px-3 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-teal-200/70">
                        No Ticket Book / PickMe orders yet.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => {
                      const lower = (r.status || "").toLowerCase();
                      const badge =
                        lower === "pickme"
                          ? "bg-amber-500/15 text-amber-300"
                          : "bg-sky-500/15 text-sky-300";
                      return (
                        <tr key={r.orderId} className="hover:bg-white/5">
                          <td className="px-3 py-2 font-semibold">{r.orderId}</td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1">
                              {(r.items || []).slice(0, 4).map((it) => (
                                <span
                                  key={it.id}
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
                          <td className="px-3 py-2 text-right font-semibold text-amber-300">
                            {money(r.amount)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`rounded-full px-2 py-[2px] text-[11px] ${badge}`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
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
