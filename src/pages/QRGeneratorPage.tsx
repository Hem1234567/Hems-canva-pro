import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, RefreshCw, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import QRCode from 'qrcode';

// ── Types ────────────────────────────────────────────────────────────────────
type DotStyle = 'square' | 'rounded' | 'dots';
type BorderStyle = 'square' | 'rounded' | 'dot';
type CenterStyle = 'square' | 'dot';
type ExportFormat = 'png' | 'jpeg';

interface ColorSwatch {
  color: string;
  label: string;
}

// ── Constants ────────────────────────────────────────────────────────────────
const COLOR_SWATCHES: ColorSwatch[] = [
  { color: '#1e1b4b', label: 'Indigo Night' },
  { color: '#4f46e5', label: 'Primary' },
  { color: '#7c3aed', label: 'Violet' },
  { color: '#0891b2', label: 'Cyan' },
  { color: '#059669', label: 'Emerald' },
  { color: '#d97706', label: 'Amber' },
  { color: '#dc2626', label: 'Red' },
];

// ── Canvas Drawing Helpers ────────────────────────────────────────────────────
function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function drawModule(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  style: DotStyle
) {
  if (style === 'square') {
    ctx.fillRect(x, y, w, h);
  } else if (style === 'rounded') {
    roundedRect(ctx, x, y, w, h, Math.max(2, w * 0.25));
  } else {
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, w * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function isFinderArea(row: number, col: number, size: number) {
  return (
    (row <= 6 && col <= 6) ||
    (row <= 6 && col >= size - 7) ||
    (row >= size - 7 && col <= 6)
  );
}

function isFinderCenter(row: number, col: number, size: number) {
  return (
    (row >= 2 && row <= 4 && col >= 2 && col <= 4) ||
    (row >= 2 && row <= 4 && col >= size - 5 && col <= size - 3) ||
    (row >= size - 5 && row <= size - 3 && col >= 2 && col <= 4)
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function QRGeneratorPage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [text, setText] = useState('https://qrexample.com');
  const [color, setColor] = useState('#4f46e5');
  const [dotStyle, setDotStyle] = useState<DotStyle>('dots');
  const [borderStyle, setBorderStyle] = useState<BorderStyle>('dot');
  const [centerStyle, setCenterStyle] = useState<CenterStyle>('dot');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');

  // Store QR matrix so style changes don't require re-compute
  const matrixRef = useRef<boolean[][] | null>(null);
  const sizeRef = useRef(0);

  const drawCustomQR = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !matrixRef.current || !sizeRef.current) return;
    const ctx = canvas.getContext('2d')!;
    const canvasSize = 280;
    const matrix = matrixRef.current;
    const qrSize = sizeRef.current;
    const cellSize = canvasSize / qrSize;

    canvas.width = canvasSize;
    canvas.height = canvasSize;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    ctx.fillStyle = color;

    for (let row = 0; row < qrSize; row++) {
      for (let col = 0; col < qrSize; col++) {
        if (!matrix[row][col]) continue;
        const x = col * cellSize;
        const y = row * cellSize;
        const w = cellSize;
        const h = cellSize;

        ctx.fillStyle = color;

        if (isFinderArea(row, col, qrSize)) {
          if (isFinderCenter(row, col, qrSize)) {
            if (centerStyle === 'square') {
              ctx.fillRect(x, y, w, h);
            } else {
              ctx.beginPath();
              ctx.arc(x + w / 2, y + h / 2, w * 0.35, 0, Math.PI * 2);
              ctx.fill();
            }
          } else {
            if (borderStyle === 'square') {
              ctx.fillRect(x, y, w, h);
            } else if (borderStyle === 'rounded') {
              roundedRect(ctx, x, y, w, h, Math.max(1, w * 0.2));
            } else {
              ctx.beginPath();
              ctx.arc(x + w / 2, y + h / 2, w * 0.35, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        } else {
          drawModule(ctx, x, y, w, h, dotStyle);
        }
      }
    }
  }, [color, dotStyle, borderStyle, centerStyle]);

  const generateQR = useCallback(async () => {
    const input = text.trim() || 'Hello World!';
    try {
      const qrData = await (QRCode as any).create(input, {
        errorCorrectionLevel: 'M',
      });
      const modules = qrData.modules;
      const size = modules.size;
      const matrix: boolean[][] = [];
      for (let r = 0; r < size; r++) {
        matrix[r] = [];
        for (let c = 0; c < size; c++) {
          matrix[r][c] = modules.get(r, c);
        }
      }
      matrixRef.current = matrix;
      sizeRef.current = size;
      drawCustomQR();
    } catch {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d')!;
      canvas.width = 280;
      canvas.height = 280;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 280, 280);
      ctx.fillStyle = '#EF4444';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️ Error generating QR', 140, 140);
    }
  }, [text, drawCustomQR]);

  // Regenerate when text changes
  useEffect(() => { generateQR(); }, [generateQR]);

  // Redraw when only style/color changes (no re-compute needed)
  useEffect(() => { drawCustomQR(); }, [color, dotStyle, borderStyle, centerStyle, drawCustomQR]);

  const downloadQR = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let dataURL: string;
    if (exportFormat === 'png') {
      dataURL = canvas.toDataURL('image/png');
    } else {
      const tmp = document.createElement('canvas');
      tmp.width = canvas.width;
      tmp.height = canvas.height;
      const tctx = tmp.getContext('2d')!;
      tctx.fillStyle = '#FFFFFF';
      tctx.fillRect(0, 0, tmp.width, tmp.height);
      tctx.drawImage(canvas, 0, 0);
      dataURL = tmp.toDataURL('image/jpeg', 0.95);
    }
    const link = document.createElement('a');
    link.download = `qrcode_${Date.now()}.${exportFormat}`;
    link.href = dataURL;
    link.click();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md flex items-center gap-3 px-4 sm:px-6 h-14">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center">
            <QrCode className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-foreground text-sm leading-none" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              QR Canvas Studio
            </h1>
            <p className="text-[11px] text-muted-foreground leading-none mt-0.5">Professional QR Code Generator</p>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col lg:flex-row gap-6 lg:gap-8">

        {/* ── Controls Panel ── */}
        <section className="flex-[1.2] min-w-0 space-y-6">

          {/* Content input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              🔗 Content / URL
            </label>
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Enter text, URL, or any data…"
              className={cn(
                'w-full px-4 py-2.5 rounded-xl border-2 border-border bg-card text-foreground text-sm font-mono',
                'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
              )}
            />
          </div>

          {/* Color swatches */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              🎨 QR Color
            </label>
            <div className="flex gap-3 flex-wrap">
              {COLOR_SWATCHES.map(sw => (
                <button
                  key={sw.color}
                  title={sw.label}
                  onClick={() => setColor(sw.color)}
                  style={{ background: sw.color }}
                  className={cn(
                    'w-10 h-10 rounded-full transition-all border-2',
                    color === sw.color
                      ? 'border-primary scale-110 ring-2 ring-offset-2 ring-primary/60'
                      : 'border-transparent hover:scale-105'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Data modules style */}
          <StyleRow
            label="🔘 Data Modules Style"
            options={[
              { value: 'square', label: '◼ Square' },
              { value: 'rounded', label: '⬡ Rounded' },
              { value: 'dots', label: '● Dots' },
            ]}
            value={dotStyle}
            onChange={v => setDotStyle(v as DotStyle)}
          />

          {/* Finder border style */}
          <StyleRow
            label="📐 Finder Border Style"
            options={[
              { value: 'square', label: '⬛ Square' },
              { value: 'rounded', label: '🔘 Rounded' },
              { value: 'dot', label: '⚫ Dot' },
            ]}
            value={borderStyle}
            onChange={v => setBorderStyle(v as BorderStyle)}
          />

          {/* Finder center style */}
          <StyleRow
            label="🎯 Finder Center Style"
            options={[
              { value: 'square', label: '◻ Square' },
              { value: 'dot', label: '🔴 Dot' },
            ]}
            value={centerStyle}
            onChange={v => setCenterStyle(v as CenterStyle)}
          />

          <div className="border-t border-border pt-4">
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              📁 Export Format
            </label>
            <select
              value={exportFormat}
              onChange={e => setExportFormat(e.target.value as ExportFormat)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border-2 border-border bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-all"
            >
              <option value="png">📸 PNG (Transparent support)</option>
              <option value="jpeg">🖼️ JPEG (White background)</option>
            </select>
          </div>
        </section>

        {/* ── Preview Panel ── */}
        <section className="flex-1 min-w-0 flex flex-col items-center justify-start">
          <div className="w-full bg-muted/40 border border-border rounded-2xl p-6 flex flex-col items-center gap-5">
            {/* Canvas */}
            <div className="bg-white rounded-2xl shadow-lg p-4 inline-block">
              <canvas
                ref={canvasRef}
                width={280}
                height={280}
                className="rounded-lg block"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 flex-wrap justify-center">
              <Button
                onClick={downloadQR}
                className="gap-2 brand-gradient border-0 text-white hover:opacity-90 transition-opacity"
              >
                <Download className="w-4 h-4" />
                Download QR
              </Button>
              <Button
                variant="outline"
                onClick={generateQR}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Generate
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground text-center">
              Custom shapes applied automatically • Scan with any QR reader
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

// ── StyleRow helper ───────────────────────────────────────────────────────────
function StyleRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
        {label}
      </label>
      <div className="flex gap-2 flex-wrap">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-all',
              value === opt.value
                ? 'border-primary bg-primary text-white -translate-y-0.5 shadow-md'
                : 'border-border bg-card text-foreground hover:border-primary/50'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
