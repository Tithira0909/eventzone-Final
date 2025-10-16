// src/pages/SeatMap.jsx
import React, { useMemo, useState, useEffect } from "react";
import { X, Armchair, Volume2, ChevronRight } from "lucide-react";
import Footer from "../components/Footer";
import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE } from "../config";

/* ───────────────── CONFIG ───────────────── */
const VIP_SEAT_PRICE = 7000;
const GENERAL_SEAT_PRICE = 5000;
const VIP_TABLE_OFFER_PRICE = 70000;
const SEATS_PER_TABLE = 10;

/* Table layout */
const layout = {
  vip: {
    rows: [
      ["A-1","A-2","A-3","A-4","A-5","A-6","A-7","A-8"],
      ["B-1","B-2","B-3","B-4","B-5","B-6","B-7","B-8"],
      ["C-1","C-2","C-3","C-4","C-5","C-6","C-7","C-8"],
      ["D-1","D-2","D-3","D-4","D-5","D-6","D-7","D-8"],
      ["E-1","E-2","E-3","E-4","E-5","E-6","E-7","E-8"],
    ],
    price: VIP_SEAT_PRICE,
  },
  generalTop: {
    rows: [
      ["F-1","F-2","F-3","F-4","F-5","F-6","F-7","F-8"],
      ["G-1","G-2","G-3","G-4","G-5","G-6","G-7","G-8"],
      ["H-1","H-2","H-3","H-4","H-5","H-6","H-7",null],
      ["I-1","I-2","I-3","I-4","I-5","I-6","I-7",null],
    ],
    price: GENERAL_SEAT_PRICE,
  },
  generalBottom: {
    rows: [
      ["J-1","J-2","J-3","J-4","J-5","J-6","J-7",null],
      ["K-1","K-2","K-3","K-4","K-5","K-6","K-7","K-8"],
      ["L-1","L-2","L-3","L-4","L-5","L-6","L-7","L-8"],
      ["M-1","M-2","M-3","M-4","M-5","M-6","M-7","M-8"],
      ["N-1","N-2","N-3","N-4","N-5","N-6","N-7","N-8"],
      ["O-1","O-2","O-3","O-4","O-5","O-6","O-7","O-8"],
      ["P-1","P-2",null,null,null,null,"P-3","P-4"],
    ],
    price: GENERAL_SEAT_PRICE,
  },
};

/* permanently blocked tables */
const PERMA_LOCKED_TABLES = new Set([
  "A-1","A-2","B-1","B-2","B-3","C-6","C-7","C-8","D-8","E-1",
  "H-1","H-3","H-5","H-7","I-2","I-4","I-6","J-2","J-4","J-6",
  "K-1","K-3","K-5","K-7","L-2","L-4","L-6","L-8","M-1","M-3","M-5","M-7",
  "N-2","N-4","N-6","N-8","O-1","O-3","O-5","O-7","L-1", "L-3 ", "L-5 ","L-7",
"M-2","M-4","M-6","M-8" ,"N-1","N-3","N-5","N-7","O-2","O-4","O-6","O-8","P-1",
"P-2","P-3","P-4","F-1","F-3",
"D-1","D-2","D-3","D-4","D-5","D-6","D-7","E-1","E-2","E-3","E-4","E-5","E-6","E-7","E-8",]);

/* helpers */
const ROW_CAT = { A:"vip",B:"vip",C:"vip",D:"vip",E:"vip",
  F:"general",G:"general",H:"general",I:"general",J:"general",
  K:"general",L:"general",M:"general",N:"general",O:"general",P:"general" };

const catFor = (id) => ROW_CAT[(id||"X").charAt(0).toUpperCase()] || "general";
const money  = (n) => `${Number(n||0).toLocaleString("en-LK",{minimumFractionDigits:2,maximumFractionDigits:2})} LKR`;

/* booked map -> array of seat items */
const buildSeatItems = (booked) =>
  Object.entries(booked).flatMap(([tableId, seats]) => {
    if (tableId.startsWith("__")) return [];
    const category = catFor(tableId);
    const price = category === "vip" ? VIP_SEAT_PRICE : GENERAL_SEAT_PRICE;
    return seats.map((seatIdx) => ({
      id: `${tableId}-${seatIdx + 1}`,
      tableId,
      seatNo: seatIdx + 1,
      category,
      price,
    }));
  });

/* small POST helper */
async function postJSON(url, body) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  let json = null; try { json = await r.json(); } catch {}
  if (!r.ok || !json?.ok) {
    const e = new Error(json?.error || `HTTP ${r.status}`); e.status = r.status; throw e;
  }
  return json;
}

/* ───────────────── UI ───────────────── */
const Table = ({ label, status, onClick }) => {
  const base =
    "flex items-center justify-center rounded-full font-bold text-[10px] sm:text-xs md:text-sm text-white " +
    "shadow-md h-9 w-9 xs:h-10 xs:w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 transition-transform";
  const styles = {
    vip: "bg-green-600 hover:bg-green-500 cursor-pointer hover:scale-110",
    general: "bg-blue-600 hover:bg-blue-500 cursor-pointer hover:scale-110",
    partial: "bg-yellow-600 hover:bg-yellow-500 cursor-pointer hover:scale-110", // ← selected (orange)
    locked: "bg-gray-700 cursor-not-allowed opacity-60",
  };
  const dis = status === "locked";
  return (
    <div
      className={`${base} ${styles[status] || styles.vip}`}
      onClick={dis ? undefined : onClick}
      role="button"
      aria-label={`Table ${label}`}
      title={status === "locked" ? "Reserved" : ""}
    >
      {label}
    </div>
  );
};

const SeatSelectionModal = ({ table, lockedFromServer, onClose, onConfirm }) => {
  const [sel, setSel] = useState([]);
  const lockedSet = new Set(lockedFromServer || []);

  const toggle = (i) => {
    if (lockedSet.has(i)) return;
    setSel((s)=> s.includes(i) ? s.filter(x=>x!==i) : [...s,i]);
  };

  const confirm = () => { onConfirm(table.id, sel); onClose(); };

  const isPhone = typeof window !== "undefined" && window.innerWidth < 640;
  const radius = isPhone ? 92 : 112;
  const box    = isPhone ? 236 : 288;
  const seat   = isPhone ? 36  : 40;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-3 sm:p-4">
      <div className="w-full max-w-md rounded-2xl border border-teal-500/30 bg-gray-800 p-4 sm:p-6 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg sm:text-2xl font-bold text-white">
            Select Seats for <span className="text-teal-400">{table.id}</span>
          </h2>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:text-white" aria-label="Close"><X size={22}/></button>
        </div>

        <div className="mb-3 text-center text-gray-300">
          <p>{table.type === "vip" ? "VIP Table" : "General Table"}</p>
          <p className="font-semibold text-amber-400">LKR {table.price.toLocaleString()} per seat</p>
        </div>

        <div className="mb-5 flex h-60 sm:h-72 items-center justify-center">
          <div className="relative" style={{width:box, height:box}}>
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-dashed border-gray-600"
              style={{width:isPhone?92:112, height:isPhone?92:112}}
            >
              <span className="text-xs sm:text-sm font-bold text-gray-500">TABLE</span>
            </div>

            {Array.from({length:SEATS_PER_TABLE}).map((_,i)=>{
              const ang=(i/SEATS_PER_TABLE)*2*Math.PI - Math.PI/2;
              const x=box/2 + radius*Math.cos(ang) - seat/2;
              const y=box/2 + radius*Math.sin(ang) - seat/2;

              const locked = lockedSet.has(i);    // 🔴 from DB (via /api/locks)
              const selected = !locked && sel.includes(i); // teal highlight while picking

              let cls="absolute flex flex-col items-center transition-transform text-gray-400 hover:text-teal-300";
              if (locked) cls="absolute flex flex-col items-center text-red-600 cursor-not-allowed";
              if (selected) cls+=" text-teal-400 scale-110";

              return (
                <button
                  key={i}
                  style={{left:x, top:y}}
                  className={cls}
                  onClick={()=>toggle(i)}
                  type="button"
                  disabled={locked}
                >
                  <Armchair size={isPhone?26:32}/>
                  <span className="mt-1 text-[11px] sm:text-xs font-semibold">{i+1}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 flex justify-end gap-2 sm:gap-4">
          <button onClick={onClose} className="rounded-lg bg-gray-700 px-4 py-2 text-gray-300 hover:bg-gray-600">Cancel</button>
          <button onClick={confirm} disabled={!sel.length} className="rounded-lg bg-teal-600 px-5 py-2 font-semibold text-white hover:bg-teal-500 disabled:bg-gray-600">
            Book {sel.length || ""} Seat{sel.length!==1?"s":""}
          </button>
        </div>
      </div>
    </div>
  );
};

/* Summary: per-seat */
function TicketSummary({ bookedSeats, onContinue }) {
  const CATEGORIES = [
    {key:"general",label:"General",price:GENERAL_SEAT_PRICE},
    {key:"vip",label:"VIP",price:VIP_SEAT_PRICE},
  ];

  const rows = useMemo(
    ()=>Object.entries(bookedSeats)
      .filter(([id]) => !id.startsWith("__"))
      .map(([id,seats])=>({id, qty:seats.length, cat:catFor(id)})),
    [bookedSeats]
  );
  const perCat = useMemo(()=>rows.reduce((m,r)=>((m[r.cat]=(m[r.cat]||0)+r.qty),m),{general:0,vip:0}),[rows]);
  const items = CATEGORIES.map(c=>({ ...c, qty: perCat[c.key]||0, amount: (perCat[c.key]||0)*c.price }));
  const total = items.reduce((s,i)=>s+i.amount,0);
  const has = items.some(i=>i.qty>0);

  return (
    <section className="mx-auto mt-6 w-full max-w-4xl rounded-2xl border border-white/10 bg-gray-900/70 p-4 shadow-sm sm:p-6">
      <div className="hidden grid-cols-12 gap-3 rounded-lg bg-white/5 px-3 py-2 text-xs text-gray-300 sm:grid">
        <div className="col-span-5">Category</div><div className="col-span-2">Price</div>
        <div className="col-span-2">No. of Tickets</div><div className="col-span-3 text-right">Amount</div>
      </div>

      <div className="mt-1 divide-y divide-white/10 rounded-lg bg-white/5">
        {items.map(it=>(
          <div key={it.key} className="grid grid-cols-12 items-center gap-3 px-3 py-2 text-sm">
            <div className="col-span-12 sm:col-span-5">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{backgroundColor: it.key==="vip"?"#41D17E":"#4DB2FF"}}/>
                <span className="font-medium text-teal-50">{it.label}</span>
              </div>
              <div className="mt-1 text-xs text-gray-400 sm:hidden">{money(it.price)}</div>
            </div>
            <div className="col-span-2 hidden text-gray-300 sm:block">{money(it.price)}</div>
            <div className="col-span-6 text-gray-300 sm:col-span-2">{it.qty}</div>
            <div className="col-span-6 text-right font-semibold text-gray-100 sm:col-span-3">{money(it.amount)}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-12 gap-3 px-3 text-sm font-bold">
        <div className="col-span-12 sm:col-span-9 text-teal-100">Total</div>
        <div className="col-span-12 text-right text-amber-300 sm:col-span-3">{money(total)}</div>
      </div>

      <div className="mt-5 hidden items-center justify-center gap-3 sm:flex">
        <button className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold text-teal-100 hover:bg-white/10"
                onClick={()=>window.history.back()}>‹ Back</button>
        <button className="rounded-xl bg-amber-300 px-6 py-2 text-sm font-bold text-gray-900 hover:bg-amber-200 disabled:opacity-60"
                onClick={onContinue} disabled={!has}>
          Continue <ChevronRight className="ml-1 inline h-4 w-4"/>
        </button>
      </div>
    </section>
  );
}

/* Summary: VIP table offer */
function VipOfferSummary({ tablesSelectedCount, onContinue }) {
  const qty = tablesSelectedCount;
  const amount = qty * VIP_TABLE_OFFER_PRICE;
  const has = qty > 0;

  return (
    <section className="mx-auto mt-6 w-full max-w-4xl rounded-2xl border border-white/10 bg-gray-900/70 p-4 shadow-sm sm:p-6">
      <div className="hidden grid-cols-12 gap-3 rounded-lg bg-white/5 px-3 py-2 text-xs text-gray-300 sm:grid">
        <div className="col-span-5">Category</div>
        <div className="col-span-2">Price</div>
        <div className="col-span-2">No. of Tables</div>
        <div className="col-span-3 text-right">Amount</div>
      </div>

      <div className="mt-1 divide-y divide-white/10 rounded-lg bg-white/5">
        <div className="grid grid-cols-12 items-center gap-3 px-3 py-2 text-sm">
          <div className="col-span-12 sm:col-span-5">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{backgroundColor:"#41D17E"}}/>
              <span className="font-medium text-teal-50">VIP Table Offer</span>
            </div>
            <div className="mt-1 text-xs text-gray-400 sm:hidden">{money(VIP_TABLE_OFFER_PRICE)} / table</div>
          </div>
          <div className="col-span-2 hidden text-gray-300 sm:block">{money(VIP_TABLE_OFFER_PRICE)}</div>
          <div className="col-span-6 text-gray-300 sm:col-span-2">{qty}</div>
          <div className="col-span-6 text-right font-semibold text-gray-100 sm:col-span-3">{money(amount)}</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-12 gap-3 px-3 text-sm font-bold">
        <div className="col-span-12 sm:col-span-9 text-teal-100">Total</div>
        <div className="col-span-12 text-right text-amber-300 sm:col-span-3">{money(amount)}</div>
      </div>

      <div className="mt-5 hidden items-center justify-center gap-3 sm:flex">
        <button className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold text-teal-100 hover:bg-white/10"
                onClick={()=>window.history.back()}>‹ Back</button>
        <button className="rounded-xl bg-amber-300 px-6 py-2 text-sm font-bold text-gray-900 hover:bg-amber-200 disabled:opacity-60"
                onClick={onContinue} disabled={!has}>
          Continue <ChevronRight className="ml-1 inline h-4 w-4"/>
        </button>
      </div>
    </section>
  );
}

function StickyMobileBar({ totalUnits, label, onContinue, disabled }) {
  return (
    <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-gray-900/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2">
        <div className="flex-1 text-sm">
          <div className="font-semibold text-teal-100">{totalUnits} {label}</div>
          <div className="text-[11px] text-teal-200/70">Tap a table to add/remove</div>
        </div>
        <button
          className={`rounded-xl px-4 py-2 text-sm font-bold ${disabled ? "bg-gray-700 text-teal-300/60" : "bg-amber-300 text-gray-900 hover:bg-amber-200"}`}
          disabled={disabled}
          onClick={onContinue}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

/* ───────────────── PAGE ───────────────── */
export default function SeatMap() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // local selections (for checkout payload)
  const [selectedTable, setSelectedTable] = useState(null);
  const [bookedSeats, setBookedSeats]   = useState({}); // { [tableId]: number[] }
  const [holdId, setHoldId] = useState("");             // server hold id

  // server seat locks (truth from DB)
  const [serverLocks, setServerLocks] = useState({});   // { [tableId]: Set(index) }
  const [locksApiAvailable, setLocksApiAvailable] = useState(true);

  // VIP table offer
  const vipTableMode = Boolean(location.state?.vipTable) ||
    new URLSearchParams(location.search).get("vipTable") === "1";
  const [vipTables, setVipTables] = useState(new Set());

  // ✅ reserved tables computed from server: 10/10 seats locked
  const reservedFromServer = useMemo(()=>{
    const t = new Set();
    for (const [id, set] of Object.entries(serverLocks)) {
      if ((set?.size || 0) >= SEATS_PER_TABLE) t.add(id);
    }
    return t;
  }, [serverLocks]);

  // Fetch/poll locks so previously booked seats are red in modal for everyone.
  useEffect(() => {
    let cancelled = false;

    async function pull() {
      try {
        const r = await fetch(`${API_BASE}/api/locks`, { cache: "no-store" });
        const j = await r.json().catch(()=>null);
        if (!r.ok || !j?.ok) throw new Error("locks unavailable");

        const map = {};
        for (const s of j.locks || []) {
          const idx = (s.seatNo|0) - 1;
          if (idx >= 0) (map[s.tableId] ||= new Set()).add(idx);
        }
        if (!cancelled) {
          setServerLocks(map);
          setLocksApiAvailable(true);
        }
      } catch {
        if (!cancelled) setLocksApiAvailable(false);
      }
    }

    pull();
    const id = setInterval(pull, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  async function refreshLocksOnce() {
    try {
      const r = await fetch(`${API_BASE}/api/locks`, { cache: "no-store" });
      const j = await r.json().catch(()=>null);
      if (!j?.ok) return;
      const map = {};
      for (const s of j.locks || []) {
        const idx = (s.seatNo|0) - 1;
        if (idx >= 0) (map[s.tableId] ||= new Set()).add(idx);
      }
      setServerLocks(map);
    } catch {}
  }

  const openTable = (id,type,price)=> setSelectedTable({ id, type, price });
  const closeModal = ()=> setSelectedTable(null);

  // Confirm seats in modal: create/extend server hold (locks)
  const confirmSeats = async (tableId, seatIdxList) => {
    if (!Array.isArray(seatIdxList) || seatIdxList.length === 0) return;
    const payloadSeats = seatIdxList.map((i)=>({ tableId, seatNo: i + 1 }));

    try {
      const resp = await postJSON(`${API_BASE}/api/locks/hold`, {
        seats: payloadSeats,
        ttlSec: 600,
        holdId: holdId || undefined,
      });
      if (!holdId) setHoldId(resp.holdId);

      // Add to local selection (for checkout summary & orange state)
      setBookedSeats(curr=>({
        ...curr,
        [tableId]: [...new Set([...(curr[tableId]||[]), ...seatIdxList])]
      }));

      // Immediately reflect as locked in modal too
      setServerLocks(curr => {
        const next = { ...curr };
        const s = new Set(next[tableId] || []);
        seatIdxList.forEach(i => s.add(i));
        next[tableId] = s;
        return next;
      });
    } catch (e) {
      if (e?.status === 409) {
        await refreshLocksOnce();
        alert("One or more selected seats were just taken. Please choose different seats.");
      } else {
        alert("Couldn’t hold seats. Please try again.");
      }
    }
  };

  /* GRID: use server to mark a whole table reserved; orange only for local selection. */
  const statusFor = (id,type)=>{
    if (PERMA_LOCKED_TABLES.has(id)) return "locked";
    if (reservedFromServer.has(id)) return "locked";   // ← ✅ full table (10/10) booked
    const hasLocal = (bookedSeats[id]?.length || 0) > 0;
    if (hasLocal) return "partial";
    if (vipTableMode && (type === "vip") && new Set(vipTables).has(id)) return "partial";
    return type;
  };

  const onTableClick = (tableId, type) => {
    if (PERMA_LOCKED_TABLES.has(tableId) || reservedFromServer.has(tableId)) return; // ← ✅ block clicks

    if (vipTableMode) {
      if (type !== "vip") { alert("This offer is for VIP tables only. Please choose from rows A–E."); return; }
      setVipTables(prev => {
        const next = new Set(prev);
        if (next.has(tableId)) next.delete(tableId); else next.add(tableId);
        return next;
      });
      return;
    }

    openTable(tableId, type, type === "vip" ? layout.vip.price : layout.generalTop.price);
  };

  const renderSection = (section,type)=>(
    <div className="flex flex-col items_center gap-1 xs:gap-1.5 sm:gap-3">
      {section.rows.map((row,r)=>(
        <div key={r} className="flex items-center gap-1 xs:gap-1.5 sm:gap-3">
          {row.map((t,c)=>(
            <React.Fragment key={t||`${r}-${c}`}>
              {c===4 && <div className="w-2 xs:w-3 sm:w-6" />}
              {t ? (
                <Table label={t} status={statusFor(t,type)} onClick={()=> onTableClick(t, type)} />
              ) : (
                <div className="h-9 w-9 xs:h-10 xs:w-10 sm:h-12 sm:w-12 md:h-14 md:w-14" />
              )}
            </React.Fragment>
          ))}
        </div>
      ))}
    </div>
  );

  const totalSeatsSelected = useMemo(()=>Object.entries(bookedSeats)
    .filter(([k,v])=>!k.startsWith("__") && Array.isArray(v))
    .reduce((s,[,a])=>s+a.length,0),[bookedSeats]);
  const vipTablesCount = vipTables.size;

  // Proceed to checkout — clear local selections so orange disappears
  const goCheckout = ()=>{
    if (vipTableMode && vipTablesCount > 0) {
      const items = Array.from(vipTables).map(id => ({
        type: "vipTable", tableId: id, label: "VIP Table (10 seats)", price: VIP_TABLE_OFFER_PRICE, qty: 1,
      }));
      setVipTables(new Set()); // remove orange
      navigate("/checkout", { state: { items } });
      return;
    }

    const seatItems = buildSeatItems(bookedSeats);
    if (!seatItems.length) return;

    setBookedSeats({});
    setSelectedTable(null);

    navigate("/checkout", { state: { items: seatItems, holdId: holdId || null } });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 pb-16 sm:pb-0">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 md:px-8">
        <header className="mb-4 text-center sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-teal-400">Event Seating Plan</h1>
          <p className="mt-1 text-xs sm:text-base text-gray-400">
            {vipTableMode ? "Tap ANY VIP table(s) in rows A–E to add/remove them at the offer price."
                          : "Tap a table to book specific seats."}
          </p>
          <p className="mt-1 text-sm sm:text-lg font-bold text-amber-400">
            {vipTableMode ? `VIP tables selected: ${vipTablesCount}`
                          : `Total Seats Booked: ${totalSeatsSelected}`}
          </p>
          {!locksApiAvailable && (
            <p className="mt-2 text-xs text-yellow-300">
              Live seat hold service is unavailable. Seats are held only after payment.
            </p>
          )}
        </header>

        <div className="rounded-2xl border border-gray-700 bg-gray-800/50 p-2 sm:p-6">
          <div className="flex w-full items-center justify-center gap-3 sm:gap-8">
            <div className="flex flex-col items-center gap-0.5 text-yellow-400">
              <Volume2 size={18} className="sm:hidden"/><Volume2 size={22} className="hidden sm:block"/>
              <span className="text-[10px] sm:text-xs font-bold">SPEAKER</span>
            </div>
            <div className="rounded-lg bg-yellow-500 px-4 py-1.5 text-sm font-bold text-gray-900 shadow-lg sm:px-12 sm:py-3 sm:text-base">STAGE</div>
            <div className="flex flex-col items-center gap-0.5 text-yellow-400">
              <Volume2 size={18} className="sm:hidden"/><Volume2 size={22} className="hidden sm:block"/>
              <span className="text-[10px] sm:text-xs font-bold">SPEAKER</span>
            </div>
          </div>

          <div className="mx-auto mt-3 rounded-lg bg-yellow-400 px-8 py-2 text-center text-sm font-bold text-gray-800 shadow sm:mt-4 md:w-max md:px-20 md:py-4">
            DANCING FLOOR
          </div>

          <div className="my-3 flex flex-wrap items-center justify-center gap-3 rounded-lg border border-gray-700 bg-gray-900/50 p-2 text-[11px] sm:my-6 sm:gap-6 sm:p-3 sm:text-sm">
            <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-green-600" />VIP</div>
            <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-blue-600" />General</div>
            <div className="flex items_center gap-1.5"><span className="h-3 w-3 rounded-full bg-yellow-600" />Selected</div>
            <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-red-700" />Booked</div>
            <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-gray-700" />Reserved</div>
          </div>

          <div className="relative -mx-2 sm:mx-0">
            <div className="overflow-x-auto px-2 pb-2">
              <div className="min-w-[480px] sm:min-w-0">
                <div className="mt-2 flex w-full flex-col items-center gap-3 sm:gap-8">
                  {renderSection(layout.vip, "vip")}
                  <div className="my-1 h-px w-full bg-gray-600" />
                  {renderSection(layout.generalTop, "general")}
                  <div className="my-1 h-px w-full bg-gray-600" />
                  {renderSection(layout.generalBottom, "general")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {vipTableMode
          ? <VipOfferSummary tablesSelectedCount={vipTablesCount} onContinue={goCheckout} />
          : <TicketSummary bookedSeats={bookedSeats} onContinue={goCheckout} />}
      </div>

      <Footer />

      <StickyMobileBar
        totalUnits={vipTableMode ? vipTablesCount : totalSeatsSelected}
        label={vipTableMode ? (vipTablesCount===1 ? "table selected" : "tables selected")
                            : (totalSeatsSelected===1 ? "seat selected" : "seats selected")}
        onContinue={goCheckout}
        disabled={vipTableMode ? vipTablesCount===0 : totalSeatsSelected===0}
      />

      {!vipTableMode && selectedTable && (
        <SeatSelectionModal
          table={selectedTable}
          lockedFromServer={Array.from(serverLocks[selectedTable.id] || [])}
          onClose={closeModal}
          onConfirm={confirmSeats}
        />
      )}
    </div>
  );
}
