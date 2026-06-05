import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, RefreshCw, QrCode, Link as LinkIcon, Palette, Square, LayoutTemplate, Target, FolderDown, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import QRCodeStyling, { DotType, CornerSquareType, CornerDotType, FileExtension } from 'qr-code-styling';

export default function QRGeneratorPage() {
  const navigate = useNavigate();
  const qrRef = useRef<HTMLDivElement>(null);
  
  const [qrCode] = useState(() => new QRCodeStyling({
    width: 280,
    height: 280,
    data: "https://example.com",
    dotsOptions: { type: "rounded", color: "#000000" },
    cornersSquareOptions: { type: "extra-rounded", color: "#000000" },
    cornersDotOptions: { type: "dot", color: "#000000" },
    backgroundOptions: { color: "#ffffff" },
    imageOptions: { crossOrigin: "anonymous", margin: 10 }
  }));

  const [qrType, setQrType] = useState<'url' | 'email' | 'phone' | 'whatsapp'>('url');
  
  const [url, setUrl] = useState('https://example.com');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [dotStyle, setDotStyle] = useState<DotType>('rounded');
  const [cornerSquare, setCornerSquare] = useState<CornerSquareType>('extra-rounded');
  const [cornerDot, setCornerDot] = useState<CornerDotType>('dot');
  const [logoData, setLogoData] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<FileExtension>('png');

  useEffect(() => {
    if (qrRef.current) {
      qrRef.current.innerHTML = '';
      qrCode.append(qrRef.current);
    }
  }, [qrCode]);

  const generateQR = useCallback(() => {
    let data = '';

    if (qrType === 'email') {
      data = email ? `mailto:${email}` : 'mailto:';
    } else if (qrType === 'url') {
      data = url.trim() || 'https://example.com';
    } else if (qrType === 'phone') {
      data = `tel:${phone.trim()}`;
    } else if (qrType === 'whatsapp') {
      data = `https://wa.me/${whatsapp.trim()}`;
    }

    qrCode.update({
      data: data,
      image: logoData,
      dotsOptions: {
        type: dotStyle,
        color: fgColor
      },
      cornersSquareOptions: {
        type: cornerSquare,
        color: fgColor
      },
      cornersDotOptions: {
        type: cornerDot,
        color: fgColor
      },
      backgroundOptions: {
        color: bgColor
      }
    });
  }, [qrCode, qrType, url, email, phone, whatsapp, fgColor, bgColor, dotStyle, cornerSquare, cornerDot, logoData]);

  // Update when any option changes
  useEffect(() => {
    generateQR();
  }, [generateQR]);

  const downloadQR = () => {
    qrCode.download({ name: 'qr-code', extension: exportFormat });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setLogoData(evt.target.result as string);
      }
    };
    reader.readAsDataURL(file);
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
              Advanced QR Generator
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
                <LayoutTemplate className="w-3.5 h-3.5" /> Type
              </label>
              <div className="relative">
                <select
                  value={qrType}
                  onChange={e => setQrType(e.target.value as 'url' | 'email' | 'phone' | 'whatsapp')}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border-2 border-border bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-all appearance-none"
                >
                  <option value="url">URL</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Dynamic Inputs based on type */}
            {qrType === 'url' && (
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  <LinkIcon className="w-3.5 h-3.5" /> Value
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="Enter URL..."
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border-2 border-border bg-card text-foreground text-sm font-mono',
                    'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
                  )}
                />
              </div>
            )}

            {qrType === 'email' && (
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter email..."
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-border bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-all"
                />
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
                  placeholder="Enter phone..."
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-border bg-card text-foreground text-sm font-mono focus:outline-none focus:border-primary transition-all"
                />
              </div>
            )}

            {qrType === 'whatsapp' && (
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  placeholder="Enter WhatsApp number..."
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-border bg-card text-foreground text-sm font-mono focus:outline-none focus:border-primary transition-all"
                />
              </div>
            )}

            <div>
               <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                 <ImageIcon className="w-3.5 h-3.5" /> Logo
               </label>
               <input
                 type="file"
                 accept="image/*"
                 onChange={handleLogoUpload}
                 className="w-full px-4 py-2.5 rounded-xl border-2 border-border bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-all"
               />
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                <Palette className="w-3.5 h-3.5" /> Foreground Color
              </label>
              <div className="flex items-center gap-2 border-2 border-border p-1.5 rounded-xl bg-card">
                <input
                  type="color"
                  value={fgColor}
                  onChange={e => setFgColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
                <input
                  type="text"
                  value={fgColor}
                  onChange={e => setFgColor(e.target.value)}
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
            label="Dot Style"
            options={[
              { value: 'square', label: 'Square' },
              { value: 'dots', label: 'Dots' },
              { value: 'rounded', label: 'Rounded' },
              { value: 'classy', label: 'Classy' },
              { value: 'classy-rounded', label: 'Classy Rounded' },
              { value: 'extra-rounded', label: 'Extra Rounded' },
            ]}
            value={dotStyle}
            onChange={v => setDotStyle(v as DotType)}
          />

          {/* Finder border style */}
          <StyleRow
            icon={Square}
            label="Corner Square Style"
            options={[
              { value: 'square', label: 'Square' },
              { value: 'dot', label: 'Dot' },
              { value: 'extra-rounded', label: 'Extra Rounded' },
            ]}
            value={cornerSquare}
            onChange={v => setCornerSquare(v as CornerSquareType)}
          />

          {/* Finder center style */}
          <StyleRow
            icon={Target}
            label="Corner Dot Style"
            options={[
              { value: 'square', label: 'Square' },
              { value: 'dot', label: 'Dot' },
            ]}
            value={cornerDot}
            onChange={v => setCornerDot(v as CornerDotType)}
          />

          <div className="border-t border-border pt-4">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              <FolderDown className="w-3.5 h-3.5" /> Export Format
            </label>
            <div className="relative inline-block w-full sm:w-auto">
              <select
                value={exportFormat}
                onChange={e => setExportFormat(e.target.value as FileExtension)}
                className="w-full px-4 py-2 pr-10 rounded-xl border-2 border-border bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-all appearance-none"
              >
                <option value="png">PNG</option>
                <option value="svg">SVG</option>
                <option value="webp">WebP</option>
                <option value="jpeg">JPEG</option>
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
              <div
                ref={qrRef}
                className="rounded-lg block overflow-hidden"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 flex-wrap justify-center">
              <Button
                onClick={downloadQR}
                className="gap-2 brand-gradient border-0 text-white hover:opacity-90 transition-opacity"
              >
                <Download className="w-4 h-4" />
                Download {exportFormat.toUpperCase()}
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
              'px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all',
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
