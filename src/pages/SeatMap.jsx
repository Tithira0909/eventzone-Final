import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, MapPin, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Minus, Plus } from "lucide-react";

const ROWS = 15, COLS = 8, SEATS_PER_TABLE = 10;
const STATUS = { AVAILABLE: "available", SOLD: "sold", LOCKED: "locked", NFS: "not-for-sale" };
const isVIPRow = (r) => r < 5;
function statusFor(tableIdx, seatIdx) {
  const n = (tableIdx * 31 + seatIdx * 17) % 100;
  if (n < 6) return STATUS.NFS;
  if (n < 18) return STATUS.LOCKED;
  if (n < 48) return STATUS.SOLD;
  return STATUS.AVAILABLE;
}
function LegendDot({ className = "" }) { return <span className={`inline-block h-3 w-3 rounded-full ${className}`} /> }
function seatFill(status, selected) {
  if (selected) return "#14B8A6";
  switch (status) {
    case STATUS.AVAILABLE: return "#0ea5e9";
    case STATUS.SOLD: return "#ef4444";
    case STATUS.LOCKED: return "#000000";
    case STATUS.NFS: return "#9CA3AF";
    default: return "#64748b";
  }
}

export default function SeatMap() {
  const [scale, setScale] = useState(1); const [tx, setTx] = useState(0); const [ty, setTy] = useState(0);
  const drag = useRef(false); const last = useRef({ x: 0, y: 0 });
  const [selected, setSelected] = useState([]);
  const cellW = 240, cellH = 200, tableR = 46, stageH = 120;
  const width = COLS * cellW, height = stageH + ROWS * cellH;

  function toggleSeat(t, s) {
    if (s.status !== STATUS.AVAILABLE) return;
    const key = `${t.idx}-${s.s}`;
    const ex = selected.find(x => x.key === key);
    setSelected(ex ? selected.filter(x => x.key !== key) : [...selected, { key, table: t.idx, seat: s.s, price: t.price, vip: t.vip }]);
  }
  function onWheel(e) { e.preventDefault(); const dir = e.deltaY > 0 ? -1 : 1; setScale(s => Number(Math.min(2.2, Math.max(0.6, s + dir * 0.1)).toFixed(2))); }
  function onMouseDown(e) { drag.current = true; last.current = { x: e.clientX, y: e.clientY }; }
  function onMouseMove(e) { if (!drag.current) return; const dx = e.clientX - last.current.x, dy = e.clientY - last.current.y; last.current = { x: e.clientX, y: e.clientY }; setTx(v => v + dx); setTy(v => v + dy); }
  function onMouseUp() { drag.current = false; }

  // render
  return (
    <div className="min-h-screen bg-gray-950 text-teal-100">
      <header className="sticky top-0 z-40 bg-[#071225] text-teal-50">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link to="/events/sanda-ek-dinak" className="text-teal-100/80 hover:text-amber-300">← Back</Link>
          <h1 className="text-lg sm:text-xl font-semibold">Sanda Ek Dinak</h1>
          <div className="ml-auto flex flex-wrap items-center gap-4 text-teal-100/80">
            <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" /> Sat, Nov 30</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" /> 07:00 PM</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> Wave N' Lake Navy Hall, Welisara</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-3 py-2">
        <div className="mb-2 flex flex-wrap items-center gap-2 sm:justify-center">
          <div className="rounded-xl border border-teal-800/40 bg-gray-900/60 p-1">
            <button className="rounded-lg px-2 py-1 hover:bg-gray-800" onClick={() => setTx(v => v - 80)}><ArrowLeft className="h-4 w-4" /></button>
            <button className="rounded-lg px-2 py-1 hover:bg-gray-800" onClick={() => setTx(v => v + 80)}><ArrowRight className="h-4 w-4" /></button>
            <button className="rounded-lg px-2 py-1 hover:bg-gray-800" onClick={() => setTy(v => v - 80)}><ArrowUp className="h-4 w-4" /></button>
            <button className="rounded-lg px-2 py-1 hover:bg-gray-800" onClick={() => setTy(v => v + 80)}><ArrowDown className="h-4 w-4" /></button>
            <span className="mx-2 inline-block h-6 w-px bg-teal-800/40 align-middle" />
            <button className="rounded-lg px-2 py-1 hover:bg-gray-800" onClick={() => setScale(s => Math.max(0.6, Number((s - 0.1).toFixed(2))))}><Minus className="h-4 w-4" /></button>
            <button className="rounded-lg px-2 py-1 hover:bg-gray-800" onClick={() => setScale(s => Math.min(2.2, Number((s + 0.1).toFixed(2))))}><Plus className="h-4 w-4" /></button>
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-teal-800/40 bg-gray-900/60 px-3 py-2">
            <LegendDot className="bg-amber-300" /> <span>7,500 LKR (VIP)</span>
            <LegendDot className="bg-blue-300" /> <span>5,000 LKR (General)</span>
            <LegendDot className="bg-red-500" /> <span>Sold</span>
            <LegendDot className="bg-black" /> <span>Locked</span>
            <LegendDot className="bg-gray-400" /> <span>Not for sale</span>
          </div>
          <div className="ml-auto text-sm text-teal-200/70">Zoom: {Math.round(scale * 100)}%</div>
        </div>
      </div>

      <div
        className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl border border-teal-800/40 bg-gray-900/40"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseUp}
        onMouseUp={onMouseUp}
        style={{ cursor: "grab" }}
      >
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="block">
          <g transform={`translate(${tx} ${ty}) scale(${scale})`}>
            <rect x={width / 2 - 260} y={20} width={520} height={80} rx="10" fill="#374151" />
            <text x={width / 2} y={70} textAnchor="middle" fill="#E5E7EB" fontSize="24" fontWeight="600">STAGE</text>

            {(() => {
              const els = [];
              let idx = 0;
              for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                  const x = c * 240 + 120;
                  const y = 120 + r * 200 + 100;
                  const vip = isVIPRow(r);
                  const price = vip ? 7500 : 5000;
                  const tableR = 46;
                  const label = `${vip ? "VIP" : "GEN"} · T${String(idx + 1).padStart(3, "0")}`;

                  els.push(
                    <g key={`t-${idx}`}>
                      <circle cx={x} cy={y} r={tableR} fill="#0b1220" stroke="rgba(45,212,191,0.35)" strokeWidth="2" />
                      <circle cx={x} cy={y} r={8} fill={vip ? "#FDE68A" : "#93C5FD"} />
                      <text x={x} y={y + tableR + 20} textAnchor="middle" fill="#9CA3AF" fontSize="10">{label}</text>

                      {Array.from({ length: SEATS_PER_TABLE }).map((_, s) => {
                        const ang = (2 * Math.PI * s) / SEATS_PER_TABLE - Math.PI / 2;
                        const cx = x + (tableR + 16) * Math.cos(ang);
                        const cy = y + (tableR + 16) * Math.sin(ang);
                        const status = statusFor(idx, s);
                        const key = `${idx}-${s}`;
                        const selectedSeat = !!selected.find(ss => ss.key === key);
                        const fill = seatFill(status, selectedSeat);
                        const stroke = selectedSeat ? "#FDE68A" : "rgba(20,184,166,0.6)";
                        return (
                          <circle
                            key={key}
                            cx={cx}
                            cy={cy}
                            r={7}
                            fill={fill}
                            stroke={stroke}
                            strokeWidth={1}
                            onClick={() => toggleSeat({ idx, price, vip }, { s, status })}
                            style={{ cursor: status === STATUS.AVAILABLE ? "pointer" : "not-allowed" }}
                          />
                        );
                      })}
                    </g>
                  );
                  idx++;
                }
              }
              return els;
            })()}
          </g>
        </svg>
      </div>

      <div className="sticky bottom-0 z-40 mx-auto mt-3 max-w-7xl px-3 pb-4">
        <div className="rounded-xl bg-red-600 text-white px-4 py-3 text-center font-semibold">
          {selected.length ? `${selected.length} seat(s) selected` : "No seats selected yet"}
        </div>
      </div>
    </div>
  );

  function onWheel(e) { e.preventDefault(); const dir = e.deltaY > 0 ? -1 : 1; setScale(s => Number(Math.min(2.2, Math.max(0.6, s + dir * 0.1)).toFixed(2))); }
}
