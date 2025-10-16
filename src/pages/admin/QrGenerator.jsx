import React, { useMemo, useState } from "react";
import { Download, QrCode, Printer } from "lucide-react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";

/** CONFIG ************************************************************/

// Tables to generate (all seats in each)
const TABLES_TO_PRINT = [
  "A-1", "A-2",
  "B-1", "B-2", "B-3",
  "C-6", "C-7", "C-9",
  "D-9",
  "E-1",
];

// How many seats per table in your venue
const SEATS_PER_TABLE = 10;

// The exact printed QR size you need
const QR_SIZE_CM = 2.0;

// PDF page config (A4 with centimeter units)
const PAGE_UNIT = "cm";
const PAGE_FORMAT = "a4";
const PAGE_MARGIN_CM = 1.0;

// Space for the label under the QR (printed)
const LABEL_HEIGHT_CM = 0.5;

// Horizontal/vertical gap between cells
const CELL_GAP_CM = 0.3;

/** Helper: build all seat entries from table list *********************************/
function buildSeatList(tableIds, seatsPerTable) {
  const list = [];
  for (const tableId of tableIds) {
    for (let i = 1; i <= seatsPerTable; i++) {
      list.push({ tableId, seatNo: i, id: `${tableId}-S${i}` });
    }
  }
  return list;
}

/**
 * Payload schema encoded inside each QR.
 * If you want these to be accepted by your current admin scanner,
 * you can extend this to match your "ticket book" schema.
 */
function packSeatPayload({ tableId, seatNo }) {
  return JSON.stringify({
    seatTag: true,      // lets your scanner branch on "seat tag" vs ticket
    tableId,
    seatNo,
    ts: new Date().toISOString(),
  });
}

/** MAIN COMPONENT *****************************************************/
export default function QrBatchGenerator() {
  const [tablesText, setTablesText] = useState(TABLES_TO_PRINT.join(","));
  const [seatsPerTable, setSeatsPerTable] = useState(SEATS_PER_TABLE);
  const [busy, setBusy] = useState(false);

  const seats = useMemo(() => {
    const cleaned = tablesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return buildSeatList(cleaned, Math.max(1, Number(seatsPerTable) || 1));
  }, [tablesText, seatsPerTable]);

  async function generatePdf() {
    try {
      setBusy(true);

      // 1) Pre-generate all QR images as data URLs
      const qrDataUrls = await Promise.all(
        seats.map(async (seat) => {
          const payload = packSeatPayload(seat);
          return QRCode.toDataURL(payload, {
            errorCorrectionLevel: "M",
            margin: 0, // no built-in quiet-zone; we control padding in layout
            scale: 8,
          });
        })
      );

      // 2) Create a PDF in centimeters
      const doc = new jsPDF({ unit: PAGE_UNIT, format: PAGE_FORMAT });

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      // Layout math
      const usableW = pageW - PAGE_MARGIN_CM * 2;
      const usableH = pageH - PAGE_MARGIN_CM * 2;

      // Each cell is: QR + label height
      const cellW = QR_SIZE_CM; // we keep width = QR size
      const cellH = QR_SIZE_CM + LABEL_HEIGHT_CM;

      // We also add gaps between cells
      const stepX = cellW + CELL_GAP_CM;
      const stepY = cellH + CELL_GAP_CM;

      const cols = Math.max(1, Math.floor((usableW + CELL_GAP_CM) / stepX));
      const rows = Math.max(1, Math.floor((usableH + CELL_GAP_CM) / stepY));

      if (cols <= 0 || rows <= 0) {
        alert("QR size + spacing too large to fit on A4. Reduce size or gaps.");
        setBusy(false);
        return;
      }

      let x0 = PAGE_MARGIN_CM;
      let y0 = PAGE_MARGIN_CM;

      let col = 0;
      let row = 0;

      seats.forEach((seat, idx) => {
        // Add new page when the current is full
        if (idx > 0 && col === 0 && row === 0) {
          doc.addPage();
        }

        const img = qrDataUrls[idx];

        const x = x0 + col * stepX;
        const y = y0 + row * stepY;

        // 3) Draw the QR image with the EXACT requested size: 2cm x 2cm
        doc.addImage(img, "PNG", x, y, QR_SIZE_CM, QR_SIZE_CM);

        // 4) Draw the label (tiny, centered below QR)
        const label = `${seat.tableId} • S${seat.seatNo}`;
        doc.setFontSize(8); // small readable
        doc.text(label, x + QR_SIZE_CM / 2, y + QR_SIZE_CM + LABEL_HEIGHT_CM * 0.7, {
          align: "center",
          baseline: "middle",
        });

        // advance grid
        col++;
        if (col >= cols) {
          col = 0;
          row++;
          if (row >= rows) {
            row = 0; // next iteration triggers a new page
          }
        }
      });

      doc.save(`Seat_QRs_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Failed to generate PDF. See console for details.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-teal-100">
      <div className="mx-auto max-w-4xl p-4 sm:p-6">
        <header className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <QrCode className="h-6 w-6" />
            Batch QR Generator (2 cm × 2 cm)
          </h1>
          <p className="text-teal-200/75 mt-1">
            Generates one QR per seat for the tables you specify, and exports a
            print-ready PDF with each QR sized exactly <b>2 cm × 2 cm</b>.
          </p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-gray-900/60 p-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <div className="mb-1 text-sm text-teal-200/80">Tables (comma-separated)</div>
              <input
                className="w-full rounded-lg border border-white/10 bg-gray-900 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-600"
                value={tablesText}
                onChange={(e) => setTablesText(e.target.value)}
                placeholder='e.g. A-1,A-2,B-1,B-2,B-3,C-6,C-7,C-9,D-9,E-1'
              />
            </label>

            <label className="block">
              <div className="mb-1 text-sm text-teal-200/80">Seats per table</div>
              <input
                type="number"
                min={1}
                className="w-full rounded-lg border border-white/10 bg-gray-900 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-600"
                value={seatsPerTable}
                onChange={(e) => setSeatsPerTable(e.target.value)}
              />
            </label>
          </div>

          <div className="text-sm text-teal-200/80">
            Total seats: <b>{seats.length}</b>
          </div>

          <button
            onClick={generatePdf}
            disabled={busy || seats.length === 0}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 font-semibold ${
              busy || seats.length === 0
                ? "cursor-not-allowed bg-gray-800 text-teal-300/60"
                : "bg-amber-300 text-gray-900 hover:bg-amber-200"
            }`}
          >
            {busy ? (
              <>
                <Printer className="h-4 w-4" />
                Preparing PDF…
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF (2 cm QR)
              </>
            )}
          </button>

          <div className="text-xs text-teal-200/60">
            Tip: For best results, print at <b>100% scale</b> (no “fit to page”)
            and disable printer margins if possible. Each QR image itself is exactly
            2 cm × 2 cm; extra spacing is for readability and labels.
          </div>
        </section>
      </div>
    </div>
  );
}
