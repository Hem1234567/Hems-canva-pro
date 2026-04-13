import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Upload, Trash2, ChevronLeft, ChevronRight,
  Download, GripVertical, FilePlus, LayoutGrid, Sparkles,
  Loader2, FileText, RotateCw, Image as ImageIcon, Type, TableProperties, Presentation,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

// ── Types ─────────────────────────────────────────────────────────────────────
interface PageItem {
  id: string;
  name: string;
  src: string;
  rotation: number; // 0 | 90 | 180 | 270
}

// ── CDN loaders ───────────────────────────────────────────────────────────────
const PDFJS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
const MAMMOTH_CDN = 'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js';
const JSZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';

const scriptCache: Record<string, Promise<any>> = {};
function loadScript(src: string, key: string): Promise<any> {
  if ((window as any)[key]) return Promise.resolve((window as any)[key]);
  if (scriptCache[src]) return scriptCache[src];
  scriptCache[src] = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => res((window as any)[key]);
    s.onerror = rej;
    document.head.appendChild(s);
  });
  return scriptCache[src];
}

// ── Canvas helpers ────────────────────────────────────────────────────────────
function makeCanvas(w: number, h: number, bg = '#fff'): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  return [c, ctx];
}

function drawWrappedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number, maxLines: number): number {
  const words = text.split(' ');
  let line = '';
  let lines = 0;
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line.trim(), x, y);
      y += lineH; line = word + ' ';
      if (++lines >= maxLines) return y;
    } else line = test;
  }
  if (line.trim()) { ctx.fillText(line.trim(), x, y); y += lineH; }
  return y;
}

// ── File renderers ────────────────────────────────────────────────────────────
async function pdfToPages(buf: ArrayBuffer, name: string): Promise<string[]> {
  const lib = await loadScript(PDFJS_CDN, 'pdfjsLib');
  lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  const doc = await lib.getDocument({ data: buf }).promise;
  const out: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const vp = page.getViewport({ scale: 1.5 });
    const [c, ctx] = makeCanvas(vp.width, vp.height);
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    out.push(c.toDataURL('image/png'));
  }
  return out;
}

async function docxToPages(buf: ArrayBuffer, name: string): Promise<string[]> {
  const mammoth = await loadScript(MAMMOTH_CDN, 'mammoth');
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buf });
  const tmp = document.createElement('div'); tmp.innerHTML = html;
  const text = (tmp.innerText || '').replace(/\n{3,}/g, '\n\n');
  const paras = text.split('\n').filter(Boolean);
  const PER_PAGE = 32;
  const pages: string[] = [];
  for (let start = 0; start < Math.max(1, paras.length); start += PER_PAGE) {
    const [c, ctx] = makeCanvas(595, 842);
    ctx.fillStyle = '#4f46e5'; ctx.fillRect(0, 0, 595, 6);
    ctx.fillStyle = '#1e1b4b'; ctx.font = 'bold 15px sans-serif';
    ctx.fillText(name.replace(/\.[^.]+$/, ''), 50, 38);
    ctx.fillStyle = '#999'; ctx.font = '10px sans-serif';
    ctx.fillText(`Page ${Math.floor(start / PER_PAGE) + 1}`, 515, 38);
    ctx.fillStyle = '#e5e7eb'; ctx.fillRect(50, 48, 495, 1);
    ctx.fillStyle = '#374151'; let y = 70;
    for (const p of paras.slice(start, start + PER_PAGE)) {
      ctx.font = '12px sans-serif';
      y = drawWrappedText(ctx, p, 50, y, 495, 18, 40);
      y += 4; if (y > 800) break;
    }
    if (!paras.length) {
      ctx.fillStyle = '#9ca3af'; ctx.font = 'italic 13px sans-serif';
      ctx.textAlign = 'center'; ctx.fillText('(Empty document)', 297, 421); ctx.textAlign = 'left';
    }
    pages.push(c.toDataURL('image/png'));
  }
  return pages;
}

async function pptxToPages(buf: ArrayBuffer, name: string): Promise<string[]> {
  const JSZip = await loadScript(JSZIP_CDN, 'JSZip');
  const zip = await JSZip.loadAsync(buf);
  const slideFiles = Object.keys(zip.files)
    .filter((n: string) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a: string, b: string) => parseInt(a.match(/\d+/)![0]) - parseInt(b.match(/\d+/)![0]));
  const pages: string[] = [];
  for (let i = 0; i < (slideFiles.length || 1); i++) {
    const W = 800, H = 450;
    const [c, ctx] = makeCanvas(W, H);
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#1e1b4b'); grad.addColorStop(1, '#312e81');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#4f46e5'; ctx.fillRect(0, 0, W, 6);
    let texts: string[] = [];
    if (slideFiles[i]) {
      const xml = await zip.files[slideFiles[i]].async('string');
      const dom = new DOMParser().parseFromString(xml, 'text/xml');
      dom.querySelectorAll('t').forEach((t: Element) => { if (t.textContent?.trim()) texts.push(t.textContent.trim()); });
    }
    ctx.fillStyle = '#fff'; ctx.font = 'bold 26px sans-serif';
    ctx.fillText((texts[0] || `Slide ${i + 1}`).slice(0, 46), 50, 90);
    ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.font = '15px sans-serif';
    let y = 135;
    for (let t = 1; t < Math.min(texts.length, 12); t++) {
      if (texts[t] === texts[0]) continue;
      ctx.fillText('• ' + texts[t].slice(0, 65), 50, y); y += 26; if (y > H - 60) break;
    }
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(0, H - 38, W, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '10px sans-serif';
    ctx.fillText(name + `  •  ${i + 1} / ${slideFiles.length || 1}`, 50, H - 14);
    pages.push(c.toDataURL('image/png'));
  }
  return pages;
}

async function xlsxToPages(buf: ArrayBuffer, name: string): Promise<string[]> {
  const wb = XLSX.read(buf, { type: 'array' });
  return wb.SheetNames.map(sheetName => {
    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
    const W = 700, H = 520;
    const [c, ctx] = makeCanvas(W, H, '#f8fafc');
    ctx.fillStyle = '#217346'; ctx.fillRect(0, 0, W, 44);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`${name}`, 14, 22);
    ctx.font = '11px sans-serif'; ctx.fillText(`Sheet: ${sheetName}  •  ${data.length} rows`, 14, 38);
    const colW = Math.min(110, (W - 28) / Math.max(1, (data[0] || []).length));
    const rowH = 22;
    for (let r = 0; r < Math.min(data.length, 20); r++) {
      const row = (data[r] || []) as any[];
      const ry = 54 + r * rowH;
      ctx.fillStyle = r === 0 ? '#e6f4ea' : r % 2 === 0 ? '#f9fafb' : '#fff';
      ctx.fillRect(14, ry, W - 28, rowH);
      ctx.strokeStyle = '#d1d5db'; ctx.strokeRect(14, ry, W - 28, rowH);
      for (let col = 0; col < Math.min((row as any[]).length, 8); col++) {
        ctx.fillStyle = r === 0 ? '#166534' : '#374151';
        ctx.font = r === 0 ? 'bold 10px sans-serif' : '10px sans-serif';
        ctx.fillText(String(row[col] ?? '').slice(0, 14), 18 + col * colW, ry + 15);
      }
    }
    return c.toDataURL('image/png');
  });
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function OrganizePagesPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState('');

  useEffect(() => { loadScript(PDFJS_CDN, 'pdfjsLib').catch(() => {}); }, []);

  const uid = () => `${Date.now()}-${Math.random()}`;

  const addFiles = useCallback(async (files: File[]) => {
    const allowed = files.filter(f => {
      const n = f.name.toLowerCase();
      return f.type.startsWith('image/') ||
        n.endsWith('.pdf') || n.endsWith('.docx') || n.endsWith('.doc') ||
        n.endsWith('.pptx') || n.endsWith('.ppt') ||
        n.endsWith('.xlsx') || n.endsWith('.xls');
    });
    if (!allowed.length) { toast.error('Unsupported file type.'); return; }
    setProcessing(true);
    const newPages: PageItem[] = [];

    for (const file of allowed) {
      const n = file.name.toLowerCase();
      setProcessingLabel(`Processing "${file.name}"…`);
      try {
        const buf = await file.arrayBuffer();
        let srcs: string[] = [];

        if (file.type.startsWith('image/')) {
          srcs = await new Promise(res => {
            const r = new FileReader();
            r.onload = e => res([e.target?.result as string]);
            r.readAsDataURL(file);
          });
        } else if (n.endsWith('.pdf')) {
          srcs = await pdfToPages(buf, file.name);
        } else if (n.endsWith('.docx') || n.endsWith('.doc')) {
          srcs = await docxToPages(buf, file.name);
        } else if (n.endsWith('.pptx') || n.endsWith('.ppt')) {
          srcs = await pptxToPages(buf, file.name);
        } else if (n.endsWith('.xlsx') || n.endsWith('.xls')) {
          srcs = await xlsxToPages(buf, file.name);
        }

        srcs.forEach((src, i) => {
          newPages.push({
            id: uid(),
            name: srcs.length > 1 ? `${file.name} — p.${i + 1}` : file.name,
            src, rotation: 0,
          });
        });
      } catch (e) {
        console.error(e);
        toast.error(`Failed to process: ${file.name}`);
      }
    }

    setPages(prev => [...prev, ...newPages]);
    if (newPages.length) toast.success(`${newPages.length} page(s) added`);
    setProcessing(false);
    setProcessingLabel('');
  }, []);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) await addFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false);
    await addFiles(Array.from(e.dataTransfer.files));
  };

  const reorder = (from: string, to: string) => {
    if (from === to) return;
    setPages(prev => {
      const a = [...prev];
      const fi = a.findIndex(p => p.id === from);
      const ti = a.findIndex(p => p.id === to);
      const [item] = a.splice(fi, 1); a.splice(ti, 0, item);
      return a;
    });
  };

  const movePage = (id: string, dir: -1 | 1) => setPages(prev => {
    const a = [...prev];
    const i = a.findIndex(p => p.id === id);
    const t = i + dir;
    if (t < 0 || t >= a.length) return a;
    [a[i], a[t]] = [a[t], a[i]]; return a;
  });

  const rotatePage = (id: string) => setPages(prev =>
    prev.map(p => p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p)
  );

  const deletePage = (id: string) => { setPages(prev => prev.filter(p => p.id !== id)); toast.success('Page removed'); };

  const handleExport = () => {
    if (!pages.length) { toast.error('No pages to export'); return; }
    pages.forEach((p, i) => {
      const ext = p.name.includes('.') ? p.name.split('.').pop()! : 'png';
      const link = document.createElement('a');
      link.href = p.src;
      link.download = `page_${String(i + 1).padStart(2, '0')}.${ext === p.name ? 'png' : ext}`;
      link.click();
    });
    toast.success(`Downloading ${pages.length} page(s)…`);
  };

  const FORMATS = ['PDF', 'DOCX', 'PPTX', 'XLSX', 'PNG', 'JPG'];
  const ACCEPT = 'image/*,.pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md flex items-center gap-3 px-4 sm:px-6 h-14 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center">
            <LayoutGrid className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-foreground text-sm leading-none" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Organize Pages</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">Reorder · Delete · Rotate · Insert</p>
          </div>
        </div>
        <div className="flex-1" />
        {pages.length > 0 && (
          <Button onClick={handleExport} size="sm" className="gap-2 brand-gradient border-0 text-white" disabled={processing}>
            <Download className="w-4 h-4" /> Export All
          </Button>
        )}
      </header>

      <div className="flex-1 flex flex-col lg:flex-row max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 gap-6">
        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0 space-y-5">
          <div>
            <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Organize Pages</h2>
            <div className="mt-2 h-px bg-border" />
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-foreground/80 leading-relaxed">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>Upload any file — each page/slide/sheet becomes a card. Drag to reorder, rotate, or delete.</span>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Upload</p>
            <Button className="w-full gap-2 brand-gradient border-0 text-white" onClick={() => fileInputRef.current?.click()} disabled={processing}>
              {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : <><FilePlus className="w-4 h-4" /> Add Files</>}
            </Button>
            <input ref={fileInputRef} type="file" accept={ACCEPT} multiple className="hidden" onChange={handleFileInput} />
            {pages.length > 0 && (
              <Button variant="outline" size="sm" className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => { setPages([]); toast.success('Cleared'); }} disabled={processing}>
                <Trash2 className="w-4 h-4" /> Clear All
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FORMATS.map(f => (
              <span key={f} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{f}</span>
            ))}
          </div>
          {pages.length > 0 && (
            <div className="bg-muted/50 rounded-xl p-4 text-sm space-y-1">
              <div className="flex justify-between text-muted-foreground"><span>Total pages</span><span className="font-semibold text-foreground">{pages.length}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Status</span><span className="text-primary font-semibold">{processing ? 'Processing…' : 'Ready'}</span></div>
            </div>
          )}
        </aside>

        {/* Canvas */}
        <section className="flex-1 min-w-0">
          {processing && (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{processingLabel}</p>
            </div>
          )}

          {!processing && pages.length === 0 && (
            <div
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex flex-col items-center justify-center gap-5 border-2 border-dashed rounded-2xl cursor-pointer transition-all min-h-[420px] text-center px-6',
                isDragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/5'
              )}
            >
              <div className={cn('w-20 h-20 rounded-2xl flex items-center justify-center', isDragOver ? 'brand-gradient' : 'bg-muted')}>
                <Upload className={cn('w-9 h-9', isDragOver ? 'text-white' : 'text-muted-foreground')} />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Drop files here</p>
                <p className="text-sm text-muted-foreground mt-1">PDF · Word · PowerPoint · Excel · PNG · JPG</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { icon: FileText, label: 'PDF' },
                  { icon: Type, label: 'Word' },
                  { icon: TableProperties, label: 'Excel' },
                  { icon: Presentation, label: 'PowerPoint' },
                  { icon: ImageIcon, label: 'Images' }
                ].map(t => (
                  <span key={t.label} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full text-xs text-muted-foreground">
                    <t.icon className="w-3.5 h-3.5" /> {t.label}
                  </span>
                ))}
              </div>
              <Button className="gap-2 brand-gradient border-0 text-white pointer-events-none" tabIndex={-1}>
                <FilePlus className="w-4 h-4" /> Browse Files
              </Button>
            </div>
          )}

          {!processing && pages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {pages.map((page, idx) => (
                <PageCard
                  key={page.id} page={page} index={idx} total={pages.length}
                  isDragging={draggingId === page.id} isDragOver={dragOverId === page.id}
                  onDragStart={() => setDraggingId(page.id)}
                  onDragOver={e => { e.preventDefault(); setDragOverId(page.id); }}
                  onDragEnd={() => { reorder(draggingId!, dragOverId!); setDraggingId(null); setDragOverId(null); }}
                  onMoveLeft={() => movePage(page.id, -1)}
                  onMoveRight={() => movePage(page.id, 1)}
                  onRotate={() => rotatePage(page.id)}
                  onDelete={() => deletePage(page.id)}
                />
              ))}
              <button onClick={() => fileInputRef.current?.click()}
                className="aspect-[3/4] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all">
                <FilePlus className="w-7 h-7" />
                <span className="text-xs font-medium">Add more</span>
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ── PageCard ──────────────────────────────────────────────────────────────────
function PageCard({ page, index, total, isDragging, isDragOver, onDragStart, onDragOver, onDragEnd, onMoveLeft, onMoveRight, onRotate, onDelete }:
  { page: PageItem; index: number; total: number; isDragging: boolean; isDragOver: boolean; onDragStart: () => void; onDragOver: (e: React.DragEvent) => void; onDragEnd: () => void; onMoveLeft: () => void; onMoveRight: () => void; onRotate: () => void; onDelete: () => void; }) {
  return (
    <div draggable onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}
      className={cn('group relative bg-card border rounded-xl overflow-hidden transition-all select-none',
        isDragging && 'opacity-40 scale-95',
        isDragOver && !isDragging ? 'border-primary ring-2 ring-primary/40 scale-[1.02]' : 'border-border hover:border-primary/40 hover:shadow-lg')}>

      {/* Drag handle */}
      <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-md p-1 cursor-grab">
        <GripVertical className="w-3.5 h-3.5 text-white" />
      </div>

      {/* Action buttons */}
      <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onRotate} className="bg-primary rounded-md p-1" title="Rotate 90°">
          <RotateCw className="w-3.5 h-3.5 text-white" />
        </button>
        <button onClick={onDelete} className="bg-destructive rounded-md p-1" title="Delete">
          <Trash2 className="w-3.5 h-3.5 text-white" />
        </button>
      </div>

      {/* Thumbnail */}
      <div className="aspect-[3/4] bg-muted overflow-hidden flex items-center justify-center">
        <img src={page.src} alt={page.name} draggable={false}
          className="w-full h-full object-contain transition-transform duration-300"
          style={{ transform: `rotate(${page.rotation}deg)` }} />
      </div>

      {/* Footer */}
      <div className="px-2 py-2 border-t border-border bg-card">
        <p className="text-[11px] text-muted-foreground truncate mb-1.5">{page.name}</p>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">{index + 1} / {total}</span>
          <div className="flex gap-1">
            <button onClick={onMoveLeft} disabled={index === 0} className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>
            <button onClick={onMoveRight} disabled={index === total - 1} className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
