import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import JsBarcode from 'jsbarcode';

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

function BarcodeImage({
  value,
  barcodeType,
  showText,
  height,
}: {
  value: string;
  barcodeType: string;
  showText: boolean;
  height: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = () => {
    if (!canvasRef.current) return;
    try {
      JsBarcode(canvasRef.current, value, {
        format: barcodeType,
        displayValue: showText,
        height: Math.max(height * 3, 60),
        margin: 8,
        fontSize: 14,
        valid: () => {},
      });
    } catch {
      /* invalid barcode value – canvas stays blank */
    }
  };

  return (
    <div className="barcode-item" id="paddingchanging">
      <canvas ref={canvasRef} style={{ maxWidth: '100%' }} onLoad={draw} ref={(el) => { if (el) { (canvasRef as any).current = el; draw(); } }} />
    </div>
  );
}

/* ── main page ── */
export default function BarcodePrintPage() {
  const { state } = useLocation() as { state: any };
  const navigate = useNavigate();
  const [columns, setColumns] = useState(3);
  const [padding, setPadding] = useState(25);
  const [pageBreak, setPageBreak] = useState(false);
  const [showNav, setShowNav] = useState(true);

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg mb-4">No barcode data found.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const {
    barcodeType = 'CODE128',
    startVal = 10000,
    endVal = 10005,
    prefix = '',
    suffix = '',
    showText = true,
    height = 25,
  } = state;

  const values = generateValues(startVal, endVal, prefix, suffix);
  const columnWidth = columns === 1 ? '100%' : columns === 2 ? '50%' : '33.333%';

  const handlePrint = () => window.print();
  const handleReturn = () => navigate('/dashboard');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body { font-family: 'Inter', sans-serif; background: #f5f5f5; }

        .print-layout {
          display: flex;
          min-height: 100vh;
        }

        /* ── left sidebar ── */
        .sidebar {
          width: 280px;
          min-width: 280px;
          background: #fff;
          border-right: 1px solid #e5e7eb;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          overflow-y: auto;
        }

        .sidebar-title {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #111827;
        }

        .sidebar-btn {
          display: block;
          width: 100%;
          padding: 10px 14px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          text-align: left;
          transition: opacity .15s, background .15s;
        }

        .btn-primary   { background: #2563eb; color: #fff; }
        .btn-primary:hover   { opacity: .88; }
        .btn-warning   { background: #f59e0b; color: #fff; }
        .btn-warning:hover   { opacity: .88; }
        .btn-ghost     { background: transparent; color: #374151; border: 1px solid #e5e7eb; }
        .btn-ghost:hover     { background: #f3f4f6; }
        .btn-toggle    { background: transparent; color: #374151; font-weight: 600; border: none; cursor: pointer; width: 100%; text-align: left; padding: 8px 0; font-size: 13px; }

        .section-group { margin-top: 8px; border-top: 1px solid #e5e7eb; padding-top: 8px; }
        .section-label { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; margin-bottom: 6px; }

        .link-item {
          display: block;
          padding: 5px 8px;
          border-radius: 6px;
          font-size: 13px;
          color: #374151;
          text-decoration: none;
          cursor: pointer;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
        }
        .link-item:hover { background: #f3f4f6; }

        .checkbox-row { display: flex; align-items: center; gap: 8px; padding: 4px 8px; }
        .checkbox-row input { accent-color: #2563eb; }
        .checkbox-row label { font-size: 13px; color: #374151; cursor: pointer; }

        /* ── main content ── */
        .barcode-main {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
          background: #fff;
        }

        .barcode-main h1 { font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 4px; }
        .barcode-main h5 { font-size: 14px; color: #6b7280; margin-bottom: 16px; }

        .barcodes-grid {
          display: grid;
          gap: 20px;
        }

        .barcode-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #fff;
        }

        .barcode-value {
          font-size: 11px;
          color: #374151;
          margin-top: 4px;
          text-align: center;
        }

        /* ── print ── */
        @page {
          margin: 0;
        }
        @media print {
          .sidebar { display: none !important; }
          .barcode-main { padding: 8mm; }
          body { background: #fff; }
        }
      `}</style>

      <div className="print-layout">
        {/* ── Sidebar (not printed) ── */}
        <nav className="sidebar d-print-none">
          <div className="sidebar-title">
            <span>⚙</span> Menu
          </div>

          <button className="sidebar-btn btn-primary" onClick={handlePrint}>
            🖨 Print directly
          </button>

          <button className="sidebar-btn btn-warning" onClick={handleReturn}>
            ← Return to input
          </button>

          {/* Columns */}
          <div className="section-group">
            <div className="section-label">Change display</div>
            <button className="link-item" onClick={() => setColumns(1)}>to 1 column</button>
            <button className="link-item" onClick={() => setColumns(2)}>to 2 columns</button>
            <button className="link-item" onClick={() => setColumns(3)}>to 3 columns</button>
          </div>

          {/* Padding */}
          <div className="section-group">
            <div className="section-label">Padding</div>
            <button className="link-item" onClick={() => setPadding(5)}>small padding</button>
            <button className="link-item" onClick={() => setPadding(25)}>medium padding</button>
            <button className="link-item" onClick={() => setPadding(50)}>big padding</button>
            <button className="link-item" onClick={() => setPadding(0)}>no padding</button>
          </div>

          {/* Print options */}
          <div className="section-group">
            <div className="section-label">Print options</div>
            <div className="checkbox-row">
              <input
                type="checkbox"
                id="pagebreak"
                checked={pageBreak}
                onChange={e => setPageBreak(e.target.checked)}
              />
              <label htmlFor="pagebreak">one page per barcode</label>
            </div>
          </div>

          {/* Download ZIP */}
          <div className="section-group">
            <div className="section-label">Download ZIP with…</div>
            {['PNG files', 'JPG files', 'GIF files', 'SVG files', 'EPS files'].map(f => (
              <button key={f} className="link-item" onClick={() => alert('Download functionality requires server-side processing.')}>
                … {f}
              </button>
            ))}
          </div>

          {/* Download PDF */}
          <div className="section-group">
            <div className="section-label">Download PDF with…</div>
            {['2 column PDF', 'All barcodes in one file', 'One page per barcode', 'Zipped – one PDF per barcode'].map(f => (
              <button key={f} className="link-item" onClick={() => alert('Download functionality requires server-side processing.')}>
                {f}
              </button>
            ))}
          </div>

          {/* summary */}
          <div className="section-group" style={{ fontSize: 12, color: '#9ca3af' }}>
            {values.length} barcode{values.length !== 1 ? 's' : ''} generated
            <br />Type: {barcodeType}
          </div>
        </nav>

        {/* ── Main barcode area ── */}
        <main className="barcode-main">

          <div
            className="barcodes-grid"
            style={{
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gap: padding,
            }}
          >
            {values.map((val) => (
              <div
                key={val}
                style={{
                  pageBreakAfter: pageBreak ? 'always' : 'unset',
                  textAlign: 'center',
                }}
              >
                <BarcodeImage
                  value={val}
                  barcodeType={barcodeType}
                  showText={showText}
                  height={height}
                />
              </div>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
