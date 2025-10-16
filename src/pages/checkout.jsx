// src/pages/Checkout.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Footer from "../components/Footer";
import { API_BASE } from "../config";

const FEE_RATE = 0.01;

const money = (n) =>
  `${Number(n || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} LKR`;

// POST helper
async function postJSON(url, body, headers) {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(headers || {}) },
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || data?.ok === false) {
    const err = new Error(data?.error || `HTTP ${resp.status}`);
    err.data = data;
    throw err;
  }
  return data;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const rawItems = Array.isArray(state?.items) ? state.items : [];
  const holdId = state?.holdId || ""; // <-- important for seat validation

  // idempotency key for /api/orders
  const idemKeyRef = useRef(
    "ORD-" + Math.random().toString(36).slice(2, 10).toUpperCase()
  );

  // VIP bundle handling
  const isVipBundle =
    rawItems.length >= 1 && rawItems.every((x) => x?.type === "vipTable");

  const displaySeats = useMemo(() => {
    if (isVipBundle) {
      const out = [];
      for (const b of rawItems) {
        const qty = Number.isFinite(b.qty) && b.qty > 0 ? b.qty : 1;
        for (let q = 0; q < qty; q++) {
          for (let i = 0; i < 10; i++) {
            out.push({
              id: `${b.tableId}-${i + 1}${q ? `-${q + 1}` : ""}`,
              tableId: String(b.tableId),
              seatNo: i + 1,
              category: "vip",
              price: 7000,
            });
          }
        }
      }
      return out;
    }
    return rawItems.map((s) => ({
      id: s.id,
      tableId: String(s.tableId),
      seatNo: Number(s.seatNo),
      category:
        (s.category || "general").toLowerCase() === "vip" ? "vip" : "general",
      price: Number(s.price || 0),
    }));
  }, [rawItems, isVipBundle]);

  const subtotal = useMemo(
    () => displaySeats.reduce((sum, r) => sum + (r.price || 0), 0),
    [displaySeats]
  );
  const convFee = useMemo(() => Math.round(subtotal * FEE_RATE), [subtotal]);
  const grandTotal = useMemo(() => subtotal + convFee, [subtotal, convFee]);

  // 10-minute hold timer
  const [deadline] = useState(() => Date.now() + 10 * 60 * 1000);
  const [remaining, setRemaining] = useState(
    Math.max(0, Math.floor((deadline - Date.now()) / 1000))
  );
  useEffect(() => {
    const id = setInterval(() => {
      const secs = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setRemaining(secs);
      if (secs <= 0) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, [deadline]);
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  // form
  const [form, setForm] = useState({
    first: "",
    last: "",
    email: "",
    dial: "+94",
    phone: "",
  });
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const digitsOnly = (form.phone || "").replace(/\D/g, "");
  const phoneValid = digitsOnly.length >= 7 && digitsOnly.length <= 15;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email || "");

  const [agree, setAgree] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [busy, setBusy] = useState(false);

  // Proceed → create order → create Onepay checkout link → redirect
  async function handlePay() {
    if (!displaySeats.length || !agree || !phoneValid || !emailValid) return;

    // If your backend enforces seat holds, the token is required
    if (!holdId) {
      alert("Your seat hold is missing or expired. Please reselect seats.");
      return;
    }

    setBusy(true);
    try {
      // 1) customer + items payload
      const customer = {
        name: `${(form.first || "").trim()} ${(form.last || "").trim()}`.trim(),
        email: (form.email || "").trim(),
        phone: `${form.dial} ${digitsOnly}`.trim(),
      };

      // Canonical item shape (server also accepts table_id/tableCode)
      const items = displaySeats.map((s) => ({
        tableId: String(s.tableId).trim(),
        seatNo: Number(s.seatNo),
        category: (s.category || "general").toLowerCase(),
        price: Number(s.price) || 0,
      }));

      // 2) Create order — include numeric amount, currency, and holdId
      const orderResp = await postJSON(
        `${API_BASE}/api/orders`,
        {
          amount: Number(grandTotal),
          currency: "LKR",
          description: "Event tickets",
          items,
          customer,
          payVia: "ONEPAY_CARD",
          holdId, // <-- fixes HOLD_MISMATCH
          additionalData: { newsletter },
        },
        { "X-Idempotency-Key": idemKeyRef.current }
      );

      const orderId =
        orderResp.id ||
        orderResp.orderId ||
        orderResp.orderKey ||
        orderResp.reference;
      if (!orderId) throw new Error("ORDER_CREATE_FAILED");

      // 3) Create Onepay checkout link
      const { checkoutUrl } = await postJSON(
        `${API_BASE}/api/pay/onepay/link`,
        { orderId }
      );
      if (!checkoutUrl) throw new Error("ONEPAY_LINK_FAILED");

      // 4) Redirect to Onepay hosted page
      window.location.href = checkoutUrl;
    } catch (e) {
      console.error(e);
      alert(
        `Payment init failed: ${e?.data?.error || e?.message || "Unknown error"}`
      );
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-teal-100">
      <div className="mx-auto w-full max-w-6xl px-3 py-6 sm:px-4 sm:py-10">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        <div className="grid gap-6 md:grid-cols-12">
          {/* Left: Billing */}
          <section className="md:col-span-7 rounded-2xl border border-white/10 bg-gray-900/60 p-5">
            <h2 className="text-xl font-semibold">Billing Details</h2>

            <div className="mt-3 text-[22px] font-semibold text-teal-50">
              {mm}:{ss}{" "}
              <span className="align-middle text-sm font-normal text-teal-200/70">
                Minutes Left to Confirm Your Booking…
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <input
                className="w-full rounded-lg border border-white/10 bg-gray-900 px-3 py-2"
                placeholder="Write your first name"
                value={form.first}
                onChange={(e) => update("first", e.target.value)}
              />
              <input
                className="w-full rounded-lg border border-white/10 bg-gray-900 px-3 py-2"
                placeholder="Write your last name"
                value={form.last}
                onChange={(e) => update("last", e.target.value)}
              />
              <input
                className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 ${
                  emailValid
                    ? "border-white/10 bg-gray-900 focus:ring-emerald-600"
                    : "border-red-500/40 bg-red-500/10 focus:ring-red-500"
                }`}
                placeholder="Write your email address"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />

              <div className="grid grid-cols-[110px_1fr] gap-3">
                <select
                  className="w-full rounded-lg border border-white/10 bg-gray-900 px-3 py-2"
                  value={form.dial}
                  onChange={(e) => update("dial", e.target.value)}
                >
                  <option value="+94">+94</option>
                  <option value="+91">+91</option>
                  <option value="+65">+65</option>
                  <option value="+971">+971</option>
                </select>
                <input
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 ${
                    phoneValid
                      ? "border-white/10 bg-gray-900 focus:ring-emerald-600"
                      : "border-red-500/40 bg-red-500/10 focus:ring-red-500"
                  }`}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Write your phone number"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Right: Summary */}
          <section className="md:col-span-5 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-5">
              <h3 className="mb-3 text-lg font-semibold">Booking Summary</h3>

              <div className="max-h-64 overflow-auto rounded-xl border border-white/10 bg-white/5">
                {displaySeats.length === 0 ? (
                  <div className="px-4 py-3 text-teal-200/75">
                    No tickets selected.
                  </div>
                ) : (
                  displaySeats.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-sm last:border-b-0"
                    >
                      <div className="text-teal-100">
                        <span className="font-medium uppercase">
                          {s.category}
                        </span>{" "}
                          • {s.tableId} – Seat {s.seatNo}
                      </div>
                      <div className="font-semibold text-amber-300">
                        {money(s.price)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 divide-y divide-white/10 rounded-xl bg-white/5">
                <div className="flex items-center justify-between px-4 py-3 text-sm">
                  <div className="text-teal-100">Subtotal</div>
                  <div className="font-semibold text-amber-300">
                    {money(subtotal)}
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-3 text-sm">
                  <div className="text-teal-100">
                    Convenience fee <span className="text-teal-300/70">(1%)</span>
                  </div>
                  <div className="font-semibold text-amber-300">
                    {money(convFee)}
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-3 text-base font-semibold">
                  <span className="text-teal-100">Total</span>
                  <span className="text-amber-300">{money(grandTotal)}</span>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm text-teal-200/80">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="accent-emerald-500"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                  />
                  <span>I have read the Terms and Conditions of attendance.</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="accent-emerald-500"
                    checked={newsletter}
                    onChange={(e) => setNewsletter(e.target.checked)}
                  />
                  <span>Subscribe for newsletters.</span>
                </label>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
                  aria-label="Back"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  disabled={
                    busy ||
                    !displaySeats.length ||
                    !agree ||
                    !phoneValid ||
                    !emailValid
                  }
                  onClick={handlePay}
                  className={`flex-1 rounded-xl px-5 py-3 text-center font-bold transition ${
                    busy ||
                    !displaySeats.length ||
                    !agree ||
                    !phoneValid ||
                    !emailValid
                      ? "cursor-not-allowed bg-white/10 text-teal-300/50"
                      : "bg-amber-300 text-gray-900 hover:bg-amber-200"
                  }`}
                >
                  {busy ? "Preparing…" : "Proceed to Pay"}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
