import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Loader2, Upload } from 'lucide-react';
import { useEditor } from '@/contexts/EditorContext';
import { jsPDF } from 'jspdf';
import Konva from 'konva';
import { CanvasElement } from '@/types/editor';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

interface ExportDialogProps {
  stageRef: React.RefObject<Konva.Stage>;
}

const PAGE_SIZES = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  Custom: { width: 210, height: 297 },
};

const ExportDialog = ({ stageRef }: ExportDialogProps) => {
  const { projectName, canvasWidth, canvasHeight, elements } = useEditor();
  const [pageSize, setPageSize] = useState<string>('A4');
  const [customW, setCustomW] = useState(210);
  const [customH, setCustomH] = useState(297);
  const [cols, setCols] = useState(2);
  const [rows, setRows] = useState(5);
  const [marginX, setMarginX] = useState(10);
  const [marginY, setMarginY] = useState(10);
  const [gapX, setGapX] = useState(5);
  const [gapY, setGapY] = useState(5);
  const [exporting, setExporting] = useState(false);
  const [open, setOpen] = useState(false);

  // Bulk serial state
  const [serialPrefix, setSerialPrefix] = useState('SN-');
  const [serialStart, setSerialStart] = useState(1);
  const [serialEnd, setSerialEnd] = useState(10);
  const [serialPadding, setSerialPadding] = useState(4);
  const [csvSerials, setCsvSerials] = useState<string[]>([]);
  const [exportMode, setExportMode] = useState<'single' | 'bulk'>('single');

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const data = lines[0]?.match(/serial|number|code/i) ? lines.slice(1) : lines;
      setCsvSerials(data);
    };
    reader.readAsText(file);
  };

  const generateSerials = (): string[] => {
    if (csvSerials.length > 0) return csvSerials;
    const serials: string[] = [];
    for (let i = serialStart; i <= serialEnd; i++) {
      serials.push(`${serialPrefix}${String(i).padStart(serialPadding, '0')}`);
    }
    return serials;
  };

  // Render elements to an offscreen canvas with serial replacement
  const renderLabelImage = async (serial: string): Promise<string> => {
    // Create an offscreen Konva stage
    const pixelW = canvasWidth * 3;
    const pixelH = canvasHeight * 3;
    const container = document.createElement('div');
    container.style.display = 'none';
    document.body.appendChild(container);

    const offStage = new Konva.Stage({ container, width: pixelW, height: pixelH });
    const layer = new Konva.Layer();
    offStage.add(layer);

    // Render background
    const bg = new Konva.Rect({ x: 0, y: 0, width: pixelW, height: pixelH, fill: '#FFFFFF' });
    layer.add(bg);

    for (const el of elements) {
      const text = el.text?.replace(/\{\{serial\}\}/g, serial)
        .replace(/\{\{date\}\}/g, new Date().toISOString().split('T')[0])
        .replace(/\{\{batch\}\}/g, 'BATCH-001')
        .replace(/\{\{prefix\}\}/g, serialPrefix) || '';

      switch (el.type) {
        case 'text': {
          const t = new Konva.Text({
            x: el.x, y: el.y, text, fontSize: el.fontSize || 18,
            fontFamily: el.fontFamily || 'Inter', fontStyle: el.fontStyle || 'normal',
            fill: el.fill, width: el.width, rotation: el.rotation, opacity: el.opacity,
            letterSpacing: el.letterSpacing || 0,
          });
          layer.add(t);
          break;
        }
        case 'rect': {
          layer.add(new Konva.Rect({
            x: el.x, y: el.y, width: el.width, height: el.height,
            fill: el.fill, stroke: el.stroke, strokeWidth: el.strokeWidth,
            rotation: el.rotation, opacity: el.opacity, cornerRadius: 2,
          }));
          break;
        }
        case 'circle': {
          layer.add(new Konva.Circle({
            x: el.x + el.width / 2, y: el.y + el.height / 2, radius: el.width / 2,
            fill: el.fill, stroke: el.stroke, strokeWidth: el.strokeWidth,
            rotation: el.rotation, opacity: el.opacity,
          }));
          break;
        }
        case 'line': {
          layer.add(new Konva.Line({
            x: el.x, y: el.y, points: [0, 0, el.width, 0],
            stroke: el.fill, strokeWidth: el.strokeWidth || 2,
            rotation: el.rotation, opacity: el.opacity,
          }));
          break;
        }
        case 'barcode': {
          try {
            const canvas = document.createElement('canvas');
            JsBarcode(canvas, text || serial, {
              format: el.barcodeFormat || 'CODE128',
              width: 2, height: 60, displayValue: false,
              background: 'transparent', lineColor: el.fill,
            });
            const img = new window.Image();
            img.src = canvas.toDataURL();
            await new Promise<void>(resolve => { img.onload = () => resolve(); });
            layer.add(new Konva.Image({
              x: el.x, y: el.y, width: el.width, height: el.height,
              image: img, rotation: el.rotation, opacity: el.opacity,
            }));
          } catch (err) { /* skip invalid barcodes */ }
          break;
        }
        case 'qrcode': {
          try {
            const qrDataUrl = await QRCode.toDataURL(text || serial, {
              width: el.width, margin: 0,
              color: { dark: el.fill, light: '#FFFFFF00' },
            });
            const img = new window.Image();
            img.src = qrDataUrl;
            await new Promise<void>(resolve => { img.onload = () => resolve(); });
            layer.add(new Konva.Image({
              x: el.x, y: el.y, width: el.width, height: el.height,
              image: img, rotation: el.rotation, opacity: el.opacity,
            }));
          } catch (err) { /* skip */ }
          break;
        }
        case 'image': {
          if (el.src) {
            try {
              const img = new window.Image();
              img.crossOrigin = 'anonymous';
              img.src = el.src;
              await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(); });
              layer.add(new Konva.Image({
                x: el.x, y: el.y, width: el.width, height: el.height,
                image: img, rotation: el.rotation, opacity: el.opacity,
              }));
            } catch { /* skip */ }
          }
          break;
        }
      }
    }

    layer.draw();
    const dataUrl = offStage.toDataURL({ pixelRatio: 2 });
    offStage.destroy();
    document.body.removeChild(container);
    return dataUrl;
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const page = pageSize === 'Custom'
        ? { width: customW, height: customH }
        : PAGE_SIZES[pageSize as keyof typeof PAGE_SIZES];

      const stickerW = (page.width - marginX * 2 - gapX * (cols - 1)) / cols;
      const stickerH = (page.height - marginY * 2 - gapY * (rows - 1)) / rows;
      const stickersPerPage = cols * rows;

      const pdf = new jsPDF({
        orientation: page.width > page.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [page.width, page.height],
      });

      if (exportMode === 'single') {
        // Single mode: use live stage snapshot
        if (!stageRef.current) { setExporting(false); return; }
        const dataUrl = stageRef.current.toDataURL({ pixelRatio: 3 });
        for (let i = 0; i < stickersPerPage; i++) {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x = marginX + col * (stickerW + gapX);
          const y = marginY + row * (stickerH + gapY);
          pdf.addImage(dataUrl, 'PNG', x, y, stickerW, stickerH);
        }
      } else {
        // Bulk mode: one label per serial
        const serials = generateSerials();
        let stickerIdx = 0;

        for (let s = 0; s < serials.length; s++) {
          if (stickerIdx > 0 && stickerIdx % stickersPerPage === 0) {
            pdf.addPage([page.width, page.height]);
          }
          const posOnPage = stickerIdx % stickersPerPage;
          const col = posOnPage % cols;
          const row = Math.floor(posOnPage / cols);
          const x = marginX + col * (stickerW + gapX);
          const y = marginY + row * (stickerH + gapY);

          const labelImage = await renderLabelImage(serials[s]);
          pdf.addImage(labelImage, 'PNG', x, y, stickerW, stickerH);
          stickerIdx++;
        }
      }

      pdf.save(`${projectName || 'labels'}.pdf`);
      setOpen(false);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export PDF</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export PDF</DialogTitle>
        </DialogHeader>

        <Tabs value={exportMode} onValueChange={v => setExportMode(v as 'single' | 'bulk')}>
          <TabsList className="w-full">
            <TabsTrigger value="single" className="flex-1">Single Label</TabsTrigger>
            <TabsTrigger value="bulk" className="flex-1">Bulk Serial Export</TabsTrigger>
          </TabsList>

          <TabsContent value="bulk" className="space-y-3 mt-3">
            <div>
              <Label className="text-xs text-muted-foreground">Prefix</Label>
              <Input value={serialPrefix} onChange={e => setSerialPrefix(e.target.value)} className="mt-1 h-8 text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Start</Label>
                <Input type="number" value={serialStart} onChange={e => setSerialStart(Number(e.target.value))} className="mt-1 h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">End</Label>
                <Input type="number" value={serialEnd} onChange={e => setSerialEnd(Number(e.target.value))} className="mt-1 h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Padding</Label>
                <Input type="number" value={serialPadding} onChange={e => setSerialPadding(Number(e.target.value))} className="mt-1 h-8 text-sm" min={1} max={10} />
              </div>
            </div>
            <div className="bg-muted rounded p-2 text-xs">
              Preview: <span className="font-mono">{serialPrefix}{String(serialStart).padStart(serialPadding, '0')}</span> → <span className="font-mono">{serialPrefix}{String(serialEnd).padStart(serialPadding, '0')}</span> ({serialEnd - serialStart + 1} labels)
            </div>
            <div>
              <input type="file" accept=".csv,.txt" onChange={handleCSVUpload} className="hidden" id="csv-upload" />
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => document.getElementById('csv-upload')?.click()}>
                <Upload className="w-3.5 h-3.5" /> Or Upload CSV
              </Button>
              {csvSerials.length > 0 && <p className="text-xs text-muted-foreground mt-1">{csvSerials.length} serials from CSV (overrides range)</p>}
            </div>
          </TabsContent>

          <TabsContent value="single" className="mt-3">
            <p className="text-xs text-muted-foreground">Exports the current canvas design repeated across the page grid.</p>
          </TabsContent>
        </Tabs>

        <div className="space-y-4 mt-4">
          {/* Page Size */}
          <div>
            <Label className="text-xs text-muted-foreground">Page Size</Label>
            <Select value={pageSize} onValueChange={setPageSize}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">A4 (210×297mm)</SelectItem>
                <SelectItem value="A5">A5 (148×210mm)</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {pageSize === 'Custom' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Width (mm)</Label>
                <Input type="number" value={customW} onChange={e => setCustomW(Number(e.target.value))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Height (mm)</Label>
                <Input type="number" value={customH} onChange={e => setCustomH(Number(e.target.value))} className="mt-1" />
              </div>
            </div>
          )}

          {/* Grid */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sticker Grid</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <Label className="text-xs text-muted-foreground">Columns</Label>
                <Input type="number" min={1} max={10} value={cols} onChange={e => setCols(Number(e.target.value))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Rows</Label>
                <Input type="number" min={1} max={20} value={rows} onChange={e => setRows(Number(e.target.value))} className="mt-1" />
              </div>
            </div>
          </div>

          {/* Margins */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Margins & Gaps (mm)</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">Margin X</Label>
                <Input type="number" min={0} value={marginX} onChange={e => setMarginX(Number(e.target.value))} className="mt-1 h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Margin Y</Label>
                <Input type="number" min={0} value={marginY} onChange={e => setMarginY(Number(e.target.value))} className="mt-1 h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Gap X</Label>
                <Input type="number" min={0} value={gapX} onChange={e => setGapX(Number(e.target.value))} className="mt-1 h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Gap Y</Label>
                <Input type="number" min={0} value={gapY} onChange={e => setGapY(Number(e.target.value))} className="mt-1 h-8 text-xs" />
              </div>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground">
            <p>Sticker size: {canvasWidth}×{canvasHeight}mm</p>
            <p>Per page: {cols * rows} stickers</p>
            {exportMode === 'bulk' && <p>Total labels: {csvSerials.length > 0 ? csvSerials.length : serialEnd - serialStart + 1}</p>}
          </div>

          <Button onClick={handleExport} disabled={exporting} className="w-full">
            {exporting ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</>
            ) : (
              <><Download className="w-4 h-4 mr-2" /> Export PDF</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
