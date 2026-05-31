import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, RefreshCw, QrCode, Link as LinkIcon, Palette, Square, LayoutTemplate, Target, FolderDown, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import QRCode from 'qrcode';

// ── Types ────────────────────────────────────────────────────────────────────
type DotStyle = 'square' | 'rounded' | 'dots';
type BorderStyle = 'square' | 'rounded' | 'dot';
type CenterStyle = 'square' | 'dot';
type ExportFormat = 'png' | 'jpeg';



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

  const [qrType, setQrType] = useState<'url' | 'email' | 'phone'>('url');
  const [url, setUrl] = useState('https://qrexample.com');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');

  const [color, setColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [dotStyle, setDotStyle] = useState<DotStyle>('square');
  const [borderStyle, setBorderStyle] = useState<BorderStyle>('square');
  const [centerStyle, setCenterStyle] = useState<CenterStyle>('square');
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

    ctx.fillStyle = bgColor;
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
  }, [color, bgColor, dotStyle, borderStyle, centerStyle]);

  const generateQR = useCallback(async () => {
    let input = '';
    if (qrType === 'email') {
      const subj = encodeURIComponent(subject);
      const msg = encodeURIComponent(message);
      input = `mailto:${email}?subject=${subj}&body=${msg}`;
    } else if (qrType === 'url') {
      input = url.trim() || 'https://example.com';
    } else if (qrType === 'phone') {
      input = `tel:${phone.trim()}`;
    }

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
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, 280, 280);
      ctx.fillStyle = '#EF4444';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️ Error generating QR', 140, 140);
    }
  }, [qrType, url, email, subject, message, phone, drawCustomQR]);

  // Regenerate when input changes
  useEffect(() => { generateQR(); }, [generateQR]);

  // Redraw when only style/color changes (no re-compute needed)
  useEffect(() => { drawCustomQR(); }, [color, bgColor, dotStyle, borderStyle, centerStyle, drawCustomQR]);

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
      tctx.fillStyle = bgColor;
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

          {/* QR Type Selection */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                <LayoutTemplate className="w-3.5 h-3.5" /> QR Type
              </label>
              <div className="relative">
                <select
                  value={qrType}
                  onChange={e => setQrType(e.target.value as 'url' | 'email' | 'phone')}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border-2 border-border bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-all appearance-none"
                >
                  <option value="url">Website URL</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone Number</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Dynamic Inputs based on type */}
            {qrType === 'url' && (
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  <LinkIcon className="w-3.5 h-3.5" /> Website URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border-2 border-border bg-card text-foreground text-sm font-mono',
                    'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
                  )}
                />
              </div>
            )}

            {qrType === 'email' && (
              <div className="space-y-3">
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-border bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Enter Subject"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-border bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Enter Message"
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-border bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-all resize-y"
                  />
                </div>
              </div>
            )}

            {qrType === 'phone' && (
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91XXXXXXXXXX"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-border bg-card text-foreground text-sm font-mono focus:outline-none focus:border-primary transition-all"
                />
              </div>
            )}
          </div>

          {/* Colors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                <Palette className="w-3.5 h-3.5" /> QR Color
              </label>
              <div className="flex items-center gap-2 border-2 border-border p-1.5 rounded-xl bg-card">
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
                <input
                  type="text"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="flex-1 bg-transparent text-sm font-mono focus:outline-none uppercase"
                />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                <Palette className="w-3.5 h-3.5" /> Background Color
              </label>
              <div className="flex items-center gap-2 border-2 border-border p-1.5 rounded-xl bg-card">
                <input
                  type="color"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                  className="flex-1 bg-transparent text-sm font-mono focus:outline-none uppercase"
                />
              </div>
            </div>
          </div>

          {/* Data modules style */}
          <StyleRow
            icon={LayoutTemplate}
            label="Data Modules Style"
            options={[
              { value: 'square', label: 'Square' },
              { value: 'rounded', label: 'Rounded' },
              { value: 'dots', label: 'Dots' },
            ]}
            value={dotStyle}
            onChange={v => setDotStyle(v as DotStyle)}
          />

          {/* Finder border style */}
          <StyleRow
            icon={Square}
            label="Finder Border Style"
            options={[
              { value: 'square', label: 'Square' },
              { value: 'rounded', label: 'Rounded' },
              { value: 'dot', label: 'Dot' },
            ]}
            value={borderStyle}
            onChange={v => setBorderStyle(v as BorderStyle)}
          />

          {/* Finder center style */}
          <StyleRow
            icon={Target}
            label="Finder Center Style"
            options={[
              { value: 'square', label: 'Square' },
              { value: 'dot', label: 'Dot' },
            ]}
            value={centerStyle}
            onChange={v => setCenterStyle(v as CenterStyle)}
          />

          <div className="border-t border-border pt-4">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              <FolderDown className="w-3.5 h-3.5" /> Export Format
            </label>
            <div className="relative inline-block w-full sm:w-auto">
              <select
                value={exportFormat}
                onChange={e => setExportFormat(e.target.value as ExportFormat)}
                className="w-full px-4 py-2 pr-10 rounded-xl border-2 border-border bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-all appearance-none"
              >
                <option value="png">PNG (Transparent support)</option>
                <option value="jpeg">JPEG (White background)</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
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
  icon: Icon,
  label,
  options,
  value,
  onChange,
}: {
  icon: any;
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
        <Icon className="w-3.5 h-3.5" /> {label}
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
