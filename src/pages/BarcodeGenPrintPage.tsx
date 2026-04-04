import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import { Menu, X } from 'lucide-react';

/* ── helpers ── */
function generateValues(
  start: number,
  end: number,
  prefix: string,
  suffix: string
): string[] {
  const vals: string[] = [];
  for (let i = start; i <= end; i++) {
    vals.push(`${prefix}${i}${suffix}`);
  }
  return vals;
}

/* ── Convert value to CSS unit string for physical sizing ── */
function toCss(value: number, unit: string): string {
  if (unit === 'inch') return `${value}in`;
  if (unit === 'mm')   return `${value}mm`;
  return `${value}px`;
}

/* ── Convert mm/inch to screen pixels (96 DPI) for JsBarcode internal rendering ── */
function toScreenPx(value: number, unit: string): number {
  if (unit === 'mm')   return Math.round(value * (96 / 25.4));
  if (unit === 'inch') return Math.round(value * 96);
  return Math.round(value);
}

function BarcodeItem({
  value,
  barcodeType,
  showText,
  height,
  width,
  fixedWidth,
  fontSize,
  quietZone,
  unit,
  itemPadding,
}: {
  value: string;
  barcodeType: string;
  showText: boolean;
  height: number;
  width: number;
  fixedWidth: boolean;
  fontSize: number;
  quietZone: boolean;
  unit: string;
  itemPadding: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    try {
      // Always render at a fixed good quality (2px bar, 80px height base).
      // The container CSS handles the physical print size via mm/in units.
      JsBarcode(canvasRef.current, value, {
        format: barcodeType === 'qr' ? 'CODE128' : barcodeType,
        displayValue: showText,
        height: 80,
        width: 2,
        margin: quietZone ? 10 : 4,
        fontSize: showText ? 14 : 0,
        valid: () => {},
      });
      // Reset any inline sizing so canvas renders at its natural pixel size
      canvasRef.current.style.width  = '';
      canvasRef.current.style.height = '';
    } catch (e) {
      console.error('BarcodeItem render error:', e, 'value:', value);
    }
  }, [value, barcodeType, showText, quietZone]);

  // Physical CSS dimensions — browser maps mm/in → exact paper size on print
  const cssW = fixedWidth && width > 0 ? toCss(width, unit) : '100%';
  const cssH = toCss(Math.max(height, 10), unit);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${itemPadding}px`,
        border: '1px dashed #d1d5db',
        background: '#fff',
        breakInside: 'avoid',
        width: cssW,
        minHeight: cssH,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* maxWidth keeps the barcode inside the cell; no stretching */}
      <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%' }} />
    </div>
  );
}

/* ── main page ── */
export default function BarcodeGenPrintPage() {
  const { state } = useLocation() as { state: any };
  const navigate = useNavigate();
  const [columns, setColumns] = useState(3);
  const [padding, setPadding] = useState(25);
  const [rowsPerPage, setRowsPerPage] = useState(6);
  const [showPageNo, setShowPageNo] = useState(true);
  const [duplicateCopies, setDuplicateCopies] = useState(1);
  const [pageBreakPerBarcode, setPageBreakPerBarcode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!state) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '18px', marginBottom: '16px' }}>No barcode data found.</p>
          <button
            onClick={() => navigate('/barcode-generator')}
            style={{ padding: '8px 20px', background: '#0d6efd', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '15px' }}
          >
            Go to Barcode Generator
          </button>
        </div>
      </div>
    );
  }

  const {
    barcodeType = 'CODE128',
    startVal    = 10000,
    endVal      = 10005,
    prefix      = '',
    suffix      = '',
    showText    = true,
    height      = 25,
    barWidth    = 0.6,
    fontSize    = 6,
    quietZone   = false,
    unit        = 'mm',
    dpi         = 300,
    fixedWidth  = false,
    width       = 50,
  } = state;

  const allValues = generateValues(startVal, endVal, prefix, suffix);
  // expand by duplicate copies
  const values = allValues.flatMap(v => Array.from({ length: duplicateCopies }, () => v));

  const itemsPerPage = columns * rowsPerPage;
  const pages: string[][] = [];
  for (let i = 0; i < values.length; i += itemsPerPage) {
    pages.push(values.slice(i, i + itemsPerPage));
  }
  const totalPages = pages.length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: #f5f5f5; }
        .print-layout { display: flex; min-height: 100vh; }

        /* Sidebar */
        .sidebar {
          width: 280px; min-width: 280px;
          background: #f8f9fa;
          border-right: 1px solid #dee2e6;
          padding: 1rem;
          overflow-y: auto;
        }
        .btn {
          display: block; width: 100%; padding: .4rem .75rem;
          font-size: .95rem; font-weight: 400; text-align: center;
          border-radius: .3rem; border: 1px solid transparent;
          cursor: pointer; transition: background .15s, color .15s;
          line-height: 1.3;
        }
        .btn-primary  { color: #fff; background: #0d6efd; border-color: #0d6efd; }
        .btn-primary:hover  { background: #0b5ed7; }
        .btn-warning  { color: #000; background: #ffc107; border-color: #ffc107; }
        .btn-warning:hover  { background: #ffca2c; }
        .btn-toggle {
          display: block; width: 100%; padding: .3rem .5rem;
          font-weight: 600; font-size: .85rem; text-align: left;
          background: transparent; border: none; cursor: pointer; color: #333;
          border-radius: 4px;
        }
        .btn-toggle:hover { background: #e2e3e5; }
        .section-title { font-size: .65rem; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; padding: .5rem .5rem .15rem; }
        .section-group { border-top: 1px solid #dee2e6; margin-top: 8px; padding-top: 6px; }
        .link-btn {
          display: block; width: 100%; padding: .2rem .5rem;
          font-size: .82rem; text-align: left; background: none; border: none;
          cursor: pointer; color: #212529; border-radius: 4px;
        }
        .link-btn:hover { background: #e2e3e5; }
        .link-btn.active { background: #dbeafe; color: #1d4ed8; font-weight: 600; }
        .check-row { display: flex; align-items: center; gap: 8px; padding: 4px 8px; font-size: .82rem; cursor: pointer; }
        .collapse-inner { padding-left: .5rem; margin-top: 2px; }
        .quick-chips { display: flex; gap: 5px; flex-wrap: wrap; padding: 4px 8px 6px; }
        .chip {
          padding: 3px 10px; border-radius: 6px; border: 1px solid #ced4da;
          background: #fff; color: #212529; cursor: pointer; font-size: 12px; font-weight: 500;
        }
        .chip.active { background: #0d6efd; color: #fff; border-color: #0d6efd; }
        .num-input { width: 58px; padding: 2px 6px; border: 1px solid #ced4da; border-radius: 4px; font-size: 12px; }

        /* Main */
        .barcode-main { flex: 1; padding: 24px; overflow-y: auto; background: #fff; }
        .page-block {
          background: #fff;
          padding: 20px 20px 10px;
          margin-bottom: 32px;
        }
        .page-block + .page-block {
          border-top: 2px dashed #d1d5db;
          margin-top: 0;
          padding-top: 20px;
        }
        .barcodes-grid { display: grid; }
        .page-footer {
          margin-top: 12px; padding: 8px 0;
          text-align: center; font-size: 13px; font-weight: 600; color: #374151;
          border-top: 1px solid #d1d5db; letter-spacing: .04em;
        }

        @page { margin: 0; }
        @media print {
          .d-print-none { display: none !important; }
          .barcode-main { padding: 0 !important; }
          body { background: #fff; }
          .page-block { padding: 6mm 6mm 4mm; page-break-after: always; margin: 0; }
          .page-block:last-child { page-break-after: auto; }
          .page-block + .page-block { border-top: none; padding-top: 6mm; }
          .page-footer { display: block !important; font-size: 10pt; font-weight: 700; color: #000 !important; }
        }
      `}</style>

      <div className="print-layout flex-col md:flex-row min-h-screen relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-200 p-4 d-print-none sticky top-0 z-[40] shadow-sm w-full">
          <div className="font-semibold text-lg flex items-center gap-2">⚙ Menu</div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-gray-100 rounded-md">
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black/50 z-[45] d-print-none transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)} 
          />
        )}

        {/* ── Sidebar ── */}
        <nav className={`sidebar d-print-none fixed md:relative inset-y-0 left-0 z-[50] transition-transform duration-300 shadow-xl md:shadow-none bg-[#f8f9fa] ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, paddingBottom: '.75rem', marginBottom: '.75rem', borderBottom: '1px solid #dee2e6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{display: 'flex', alignItems: 'center', gap: 6}}>⚙ Menu</div>
            <button className="md:hidden p-1 bg-gray-200 hover:bg-gray-300 rounded border-0" onClick={() => setIsMobileMenuOpen(false)}>
               <X size={20} />
            </button>
          </div>

          <button className="btn btn-primary" style={{ marginBottom: '8px' }} onClick={() => window.print()}>
            🖨 Print directly
          </button>
          <button className="btn btn-warning" style={{ marginBottom: '16px' }} onClick={() => navigate('/barcode-generator')}>
            ← Return to input
          </button>

          {/* Change display */}
          <div className="section-group">
            <div className="section-title">Change display</div>
            <button className={`link-btn ${columns === 1 ? 'active' : ''}`} onClick={() => setColumns(1)}>to 1 column</button>
            <button className={`link-btn ${columns === 2 ? 'active' : ''}`} onClick={() => setColumns(2)}>to 2 columns</button>
            <button className={`link-btn ${columns === 3 ? 'active' : ''}`} onClick={() => setColumns(3)}>to 3 columns</button>
          </div>

          {/* Padding */}
          <div className="section-group">
            <div className="section-title">Padding</div>
            <button className={`link-btn ${padding === 5  ? 'active' : ''}`} onClick={() => setPadding(5)}>small padding</button>
            <button className={`link-btn ${padding === 25 ? 'active' : ''}`} onClick={() => setPadding(25)}>medium padding</button>
            <button className={`link-btn ${padding === 50 ? 'active' : ''}`} onClick={() => setPadding(50)}>big padding</button>
            <button className={`link-btn ${padding === 0  ? 'active' : ''}`} onClick={() => setPadding(0)}>w/o padding</button>
          </div>

          {/* Rows per page */}
          <div className="section-group">
            <div className="section-title">Rows per page</div>
            {[3, 4, 5, 6, 7, 8].map(r => (
              <button key={r} className={`link-btn ${rowsPerPage === r ? 'active' : ''}`} onClick={() => setRowsPerPage(r)}>{r} rows</button>
            ))}
          </div>

          {/* Duplicate copies */}
          <div className="section-group">
            <div className="section-title">Duplicate copies</div>
            <div className="quick-chips">
              {[1, 2, 3, 4].map(n => (
                <button key={n} className={`chip ${duplicateCopies === n ? 'active' : ''}`} onClick={() => setDuplicateCopies(n)}>{n}×</button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 8px 6px' }}>
              <span style={{ fontSize: 11, color: '#6c757d' }}>Custom:</span>
              <input className="num-input" type="number" min={1} max={50} value={duplicateCopies}
                onChange={e => setDuplicateCopies(Math.max(1, parseInt(e.target.value) || 1))} />
              <span style={{ fontSize: 11, color: '#6c757d' }}>copies each</span>
            </div>
          </div>

          {/* Print options */}
          <div className="section-group">
            <div className="section-title">Print options</div>
            <label className="check-row">
              <input type="checkbox" checked={pageBreakPerBarcode} onChange={e => setPageBreakPerBarcode(e.target.checked)} />
              one page per barcode
            </label>
            <label className="check-row">
              <input type="checkbox" checked={showPageNo} onChange={e => setShowPageNo(e.target.checked)} />
              show page numbers
            </label>
          </div>

          {/* Summary */}
          <div className="section-group" style={{ fontSize: 11, color: '#9ca3af', padding: '8px' }}>
            {allValues.length} barcode{allValues.length !== 1 ? 's' : ''} × {duplicateCopies} = {values.length} total
            <br />Type: {barcodeType}
          </div>
        </nav>

        {/* ── Main area ── */}
        <main className="barcode-main">
          {pageBreakPerBarcode ? (
            // One barcode per page (ignores columns/rows)
            values.map((val, i) => (
              <div key={i} className="page-block" style={{ pageBreakAfter: i < values.length - 1 ? 'always' : 'auto' }}>
                <BarcodeItem
                  value={val} barcodeType={barcodeType} showText={showText}
                  height={height} width={width} fixedWidth={fixedWidth}
                  fontSize={fontSize} unit={unit}
                  quietZone={quietZone} itemPadding={padding}
                />
                {showPageNo && (
                  <div className="page-footer">Barcode {i + 1} of {values.length}</div>
                )}
              </div>
            ))
          ) : (
            pages.map((pageItems, pageIndex) => (
              <div key={pageIndex} className="page-block">
                <div
                  className="barcodes-grid"
                  style={{ gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: `${padding}px` }}
                >
                  {pageItems.map((val, idx) => (
                    <BarcodeItem
                      key={idx} value={val} barcodeType={barcodeType} showText={showText}
                      height={height} width={width} fixedWidth={fixedWidth}
                      fontSize={fontSize} unit={unit}
                      quietZone={quietZone} itemPadding={padding}
                    />
                  ))}
                </div>
                {showPageNo && (
                  <div className="page-footer">Page {pageIndex + 1} of {totalPages}</div>
                )}
              </div>
            ))
          )}
        </main>
      </div>
    </>
  );
}
