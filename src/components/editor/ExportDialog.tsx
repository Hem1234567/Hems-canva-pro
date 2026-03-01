import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Loader2, Upload, Eye } from 'lucide-react';
import { useEditor } from '@/contexts/EditorContext';
import { jsPDF } from 'jspdf';
import Konva from 'konva';
import { CanvasElement } from '@/types/editor';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface ExportDialogProps {
  stageRef: React.RefObject<Konva.Stage>;
}

const PAGE_SIZES = {
  'A4': { width: 210, height: 297 },
  'A5': { width: 148, height: 210 },
  'A3': { width: 297, height: 420 },
  'Letter': { width: 216, height: 279 },
  'Legal': { width: 216, height: 356 },
  '4x6': { width: 102, height: 152 },
  '4.5x4.5': { width: 114, height: 114 },
  '5x7': { width: 127, height: 178 },
  '3x5': { width: 76, height: 127 },
  '6x9': { width: 152, height: 229 },
  'CR80 Card': { width: 86, height: 54 },
  'Custom': { width: 210, height: 297 },
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
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');

  // Bulk serial state
  const [serialPrefix, setSerialPrefix] = useState('SN-');
  const [serialStart, setSerialStart] = useState(1);
  const [serialEnd, setSerialEnd] = useState(10);
  const [serialPadding, setSerialPadding] = useState(4);
  const [csvSerials, setCsvSerials] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [exportMode, setExportMode] = useState<'single' | 'bulk'>('bulk');

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        toast.error('CSV must have a header row and at least one data row');
        return;
      }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      // Check if it's a multi-column CSV with known fields
      const knownFields = ['serial', 'name', 'designation', 'empid', 'department', 'number', 'code'];
      const isMultiColumn = headers.some(h => knownFields.includes(h));

      if (isMultiColumn) {
        const rows: Record<string, string>[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const row: Record<string, string> = {};
          headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
          rows.push(row);
        }
        setCsvRows(rows);
        setCsvSerials([]);
        toast.success(`${rows.length} records loaded from CSV (columns: ${headers.join(', ')})`);
      } else {
        // Simple single-column CSV
        const data = lines[0]?.match(/serial|number|code/i) ? lines.slice(1) : lines;
        setCsvSerials(data);
        setCsvRows([]);
        toast.success(`${data.length} serials loaded from CSV`);
      }
    };
    reader.readAsText(file);
  };

  const generateSerials = (): string[] => {
    if (csvRows.length > 0) return csvRows.map(r => r.serial || r.empid || r.number || r.code || '');
    if (csvSerials.length > 0) return csvSerials;
    const serials: string[] = [];
    const seen = new Set<string>();
    for (let i = serialStart; i <= serialEnd; i++) {
      const s = `${serialPrefix}${String(i).padStart(serialPadding, '0')}`;
      if (!seen.has(s)) {
        seen.add(s);
        serials.push(s);
      }
    }
    return serials;
  };

  const renderLabelImage = async (serial: string, csvRow?: Record<string, string>): Promise<string> => {
    const pixelW = canvasWidth * 3;
    const pixelH = canvasHeight * 3;
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    const offStage = new Konva.Stage({ container, width: pixelW, height: pixelH });
    const layer = new Konva.Layer();
    offStage.add(layer);

    layer.add(new Konva.Rect({ x: 0, y: 0, width: pixelW, height: pixelH, fill: '#FFFFFF' }));

    for (const el of elements) {
      const rawText = el.text || '';
      const text = rawText.replace(/\{\{serial\}\}/g, serial)
        .replace(/\{\{date\}\}/g, new Date().toISOString().split('T')[0])
        .replace(/\{\{batch\}\}/g, 'BATCH-001')
        .replace(/\{\{prefix\}\}/g, serialPrefix)
        .replace(/\{\{name\}\}/g, csvRow?.name || serial)
        .replace(/\{\{designation\}\}/g, csvRow?.designation || '')
        .replace(/\{\{empId\}\}/g, csvRow?.empid || serial)
        .replace(/\{\{department\}\}/g, csvRow?.department || '');
      // For barcode/qrcode: use replaced text, or fall back to raw serial
      const barcodeValue = text.length > 0 ? text : serial;

      switch (el.type) {
        case 'text': {
          layer.add(new Konva.Text({
            x: el.x, y: el.y, text, fontSize: el.fontSize || 18,
            fontFamily: el.fontFamily || 'Inter', fontStyle: el.fontStyle || 'normal',
            fill: el.fill, width: el.width, rotation: el.rotation, opacity: el.opacity,
            letterSpacing: el.letterSpacing || 0, align: el.align || 'left',
            textDecoration: el.textDecoration || '',
          }));
          break;
        }
        case 'rect': {
          layer.add(new Konva.Rect({
            x: el.x, y: el.y, width: el.width, height: el.height,
            fill: el.fill, stroke: el.stroke, strokeWidth: el.strokeWidth,
            rotation: el.rotation, opacity: el.opacity, cornerRadius: el.cornerRadius || 0,
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
            JsBarcode(canvas, barcodeValue, {
              format: el.barcodeFormat || 'CODE128',
              width: 2, height: Math.max(30, el.height - 20), displayValue: false,
              margin: 2, background: '#FFFFFF', lineColor: el.fill || '#000000',
            });
            const img = new window.Image();
            img.src = canvas.toDataURL();
            await new Promise<void>(resolve => { img.onload = () => resolve(); });
            layer.add(new Konva.Image({
              x: el.x, y: el.y, width: el.width, height: el.height - 14,
              image: img, rotation: el.rotation, opacity: el.opacity,
            }));
            // Add serial number text below the barcode
            layer.add(new Konva.Text({
              x: el.x + 4, y: el.y + el.height - 13,
              text: barcodeValue,
              fontSize: 9,
              fontFamily: 'monospace',
              fill: el.fill || '#000000',
              rotation: el.rotation,
              opacity: el.opacity,
            }));
          } catch (err) { /* skip invalid barcodes */ }
          break;
        }
        case 'qrcode': {
          try {
            const qrDataUrl = await QRCode.toDataURL(barcodeValue, {
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

    layer.batchDraw();
    // Wait a tick to ensure canvas is fully rendered before capture
    await new Promise(r => setTimeout(r, 50));
    const dataUrl = offStage.toDataURL({ pixelRatio: 2 });
    offStage.destroy();
    document.body.removeChild(container);
    return dataUrl;
  };

  const handleExport = async () => {
    setExporting(true);
    setProgress(0);
    setProgressLabel('Preparing...');
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
        if (!stageRef.current) { setExporting(false); return; }
        setProgressLabel('Rendering label...');
        const dataUrl = stageRef.current.toDataURL({ pixelRatio: 3 });
        for (let i = 0; i < stickersPerPage; i++) {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x = marginX + col * (stickerW + gapX);
          const y = marginY + row * (stickerH + gapY);
          pdf.addImage(dataUrl, 'PNG', x, y, stickerW, stickerH);
        }
        setProgress(100);
      } else {
        const serials = generateSerials();
        const totalSerials = serials.length;
        let stickerIdx = 0;

        for (let s = 0; s < totalSerials; s++) {
          if (stickerIdx > 0 && stickerIdx % stickersPerPage === 0) {
            pdf.addPage([page.width, page.height]);
          }
          const posOnPage = stickerIdx % stickersPerPage;
          const col = posOnPage % cols;
          const row = Math.floor(posOnPage / cols);
          const x = marginX + col * (stickerW + gapX);
          const y = marginY + row * (stickerH + gapY);

          setProgressLabel(`Generating ${serials[s]} (${s + 1}/${totalSerials})`);
          const csvRow = csvRows.length > 0 ? csvRows[s] : undefined;
          const labelImage = await renderLabelImage(serials[s], csvRow);
          pdf.addImage(labelImage, 'PNG', x, y, stickerW, stickerH);
          stickerIdx++;
          setProgress(Math.round(((s + 1) / totalSerials) * 100));
        }
      }

      setProgressLabel('Saving PDF...');
      pdf.save(`${projectName || 'labels'}.pdf`);
      toast.success(`PDF exported with ${exportMode === 'bulk' ? generateSerials().length : stickersPerPage} labels`);
      setOpen(false);
    } catch (err) {
      console.error('PDF export failed:', err);
      toast.error('PDF export failed. Check console for details.');
    } finally {
      setExporting(false);
      setProgress(0);
      setProgressLabel('');
    }
  };

  const totalLabels = exportMode === 'bulk'
    ? (csvRows.length > 0 ? csvRows.length : csvSerials.length > 0 ? csvSerials.length : Math.max(0, serialEnd - serialStart + 1))
    : cols * rows;
  const totalPages = Math.ceil(totalLabels / (cols * rows));

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
            <p className="text-xs text-muted-foreground">
              All elements using <code className="bg-muted px-1 rounded font-mono text-[11px]">{'{{serial}}'}</code> (text, barcode, QR) will auto-update for each serial.
            </p>
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
            <div className="bg-muted rounded-lg p-3 text-xs space-y-1">
              <div>
                <span className="text-muted-foreground">First: </span>
                <span className="font-mono font-medium text-foreground">{serialPrefix}{String(serialStart).padStart(serialPadding, '0')}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Last: </span>
                <span className="font-mono font-medium text-foreground">{serialPrefix}{String(serialEnd).padStart(serialPadding, '0')}</span>
              </div>
              <div className="text-muted-foreground">
                {totalLabels} unique labels → {totalPages} page{totalPages !== 1 ? 's' : ''} ({cols}×{rows} per page)
              </div>
            </div>
            <div>
              <input type="file" accept=".csv,.txt" onChange={handleCSVUpload} className="hidden" id="csv-upload" />
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => document.getElementById('csv-upload')?.click()}>
                <Upload className="w-3.5 h-3.5" /> Upload CSV (serial or multi-column)
              </Button>
              {csvSerials.length > 0 && <p className="text-xs text-muted-foreground mt-1">{csvSerials.length} serials from CSV (overrides range)</p>}
              {csvRows.length > 0 && (
                <div className="mt-2 bg-muted rounded-lg p-2 text-xs space-y-1">
                  <p className="font-medium text-foreground">{csvRows.length} records from CSV</p>
                  <p className="text-muted-foreground">Columns: {Object.keys(csvRows[0]).join(', ')}</p>
                  <p className="text-muted-foreground">Sample: {Object.values(csvRows[0]).slice(0, 3).join(' | ')}</p>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mt-1.5">
                CSV columns: serial, name, designation, empid, department
              </p>
            </div>
          </TabsContent>

          <TabsContent value="single" className="mt-3">
            <p className="text-xs text-muted-foreground">Exports the current canvas design repeated across the page grid ({cols}×{rows} = {cols * rows} per page).</p>
          </TabsContent>
        </Tabs>

        <div className="space-y-4 mt-4">
          <div>
            <Label className="text-xs text-muted-foreground">Page Size</Label>
            <Select value={pageSize} onValueChange={setPageSize}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">A4 (210×297mm)</SelectItem>
                <SelectItem value="A5">A5 (148×210mm)</SelectItem>
                <SelectItem value="A3">A3 (297×420mm)</SelectItem>
                <SelectItem value="Letter">Letter (8.5×11")</SelectItem>
                <SelectItem value="Legal">Legal (8.5×14")</SelectItem>
                <SelectItem value="4x6">4×6" (102×152mm)</SelectItem>
                <SelectItem value="4.5x4.5">4.5×4.5" (114×114mm)</SelectItem>
                <SelectItem value="5x7">5×7" (127×178mm)</SelectItem>
                <SelectItem value="3x5">3×5" (76×127mm)</SelectItem>
                <SelectItem value="6x9">6×9" (152×229mm)</SelectItem>
                <SelectItem value="CR80 Card">CR80 ID Card (86×54mm)</SelectItem>
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

          {/* Progress bar during export */}
          {exporting && (
            <div className="space-y-2">
              <Progress value={progress} className="h-3" />
              <p className="text-xs text-muted-foreground text-center">{progressLabel}</p>
            </div>
          )}

          <Button onClick={handleExport} disabled={exporting} className="w-full">
            {exporting ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating {progress}%</>
            ) : (
              <><Download className="w-4 h-4 mr-2" /> Export {totalLabels} Label{totalLabels !== 1 ? 's' : ''} as PDF</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
