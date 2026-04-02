import { useState, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Loader2, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { useEditor } from '@/contexts/EditorContext';
import { jsPDF } from 'jspdf';
import Konva from 'konva';
import { CanvasElement } from '@/types/editor';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

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
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'png'>('pdf');
  const [bleedMm, setBleedMm] = useState(0);
  const [showCropMarks, setShowCropMarks] = useState(false);

  // Auto-detect variables used in the design
  const detectedVariables = useMemo(() => {
    const vars = new Set<string>();
    const regex = /\{\{(\w+)\}\}/g;
    for (const el of elements) {
      if (el.text) {
        let match;
        while ((match = regex.exec(el.text)) !== null) {
          vars.add(match[1]);
        }
      }
    }
    return Array.from(vars);
  }, [elements]);

  // Auto-map file columns to detected variables
  const autoMapColumns = (headers: string[], variables: string[]) => {
    const mapping: Record<string, string> = {};
    const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    for (const varName of variables) {
      const normalizedVar = varName.toLowerCase().replace(/[^a-z0-9]/g, '');
      // Exact match
      let idx = normalizedHeaders.indexOf(normalizedVar);
      if (idx === -1) {
        // Partial match
        idx = normalizedHeaders.findIndex(h => h.includes(normalizedVar) || normalizedVar.includes(h));
      }
      if (idx === -1) {
        // Common aliases
        const aliases: Record<string, string[]> = {
          'serial': ['sn', 'serialno', 'serialnumber', 'slno', 'sr', 'srno'],
          'name': ['fullname', 'employeename', 'empname', 'staffname'],
          'empid': ['employeeid', 'empno', 'employeeno', 'id', 'staffid', 'badgeid'],
          'designation': ['title', 'jobtitle', 'position', 'role'],
          'department': ['dept', 'division', 'section', 'unit'],
          'date': ['issuedate', 'startdate', 'joindate', 'doj'],
          'batch': ['batchno', 'batchnumber', 'lot', 'lotno'],
        };
        const varAliases = aliases[normalizedVar] || [];
        idx = normalizedHeaders.findIndex(h => varAliases.includes(h));
      }
      if (idx !== -1) {
        mapping[varName] = headers[idx];
      }
    }
    return mapping;
  };

  const parseFileData = (headers: string[], dataRows: string[][]) => {
    const rows: Record<string, string>[] = [];
    for (const values of dataRows) {
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
      rows.push(row);
    }
    return rows;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    setUploadedFileName(file.name);

    if (ext === 'xlsx' || ext === 'xls') {
      // Excel file
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = new Uint8Array(ev.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
          
          if (jsonData.length < 2) {
            toast.error('File must have a header row and at least one data row');
            return;
          }
          
          const headers = (jsonData[0] as string[]).map(h => String(h).trim());
          const dataRows = jsonData.slice(1).filter((r: any) => r.length > 0).map((r: any) => r.map((c: any) => String(c ?? '').trim()));
          
          setFileHeaders(headers);
          const rows = parseFileData(headers, dataRows);
          setCsvRows(rows);
          setCsvSerials([]);
          
          // Auto-map columns
          const mapping = autoMapColumns(headers, detectedVariables);
          setColumnMapping(mapping);
          
          toast.success(`${rows.length} records loaded from Excel (${headers.length} columns)`);
        } catch (err) {
          toast.error('Failed to parse Excel file');
          console.error(err);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // CSV/TXT file
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          toast.error('File must have a header row and at least one data row');
          return;
        }
        const headers = lines[0].split(',').map(h => h.trim());
        const dataRows = lines.slice(1).map(l => l.split(',').map(v => v.trim()));
        
        setFileHeaders(headers);
        const rows = parseFileData(headers, dataRows);
        setCsvRows(rows);
        setCsvSerials([]);
        
        // Auto-map columns
        const mapping = autoMapColumns(headers, detectedVariables);
        setColumnMapping(mapping);
        
        toast.success(`${rows.length} records loaded (${headers.length} columns)`);
      };
      reader.readAsText(file);
    }
  };

  // Resolve a variable value from a CSV row using column mapping
  const resolveVar = (varName: string, csvRow?: Record<string, string>, serial?: string): string => {
    const mappedCol = columnMapping[varName];
    if (mappedCol && csvRow && csvRow[mappedCol] !== undefined) {
      return csvRow[mappedCol];
    }
    // Fallbacks
    switch (varName) {
      case 'serial': return serial || '';
      case 'prefixOnly': return serialPrefix;
      case 'date': return new Date().toISOString().split('T')[0];
      case 'batch': return 'BATCH-001';
      case 'prefix': return serial || serialPrefix;
      case 'name': return csvRow?.name || serial || '';
      case 'designation': return csvRow?.designation || '';
      case 'empId': return csvRow?.empid || serial || '';
      case 'department': return csvRow?.department || '';
      default: return '';
    }
  };

  const generateSerials = (): string[] => {
    if (csvRows.length > 0) {
      const serialCol = columnMapping['serial'];
      return csvRows.map(r => (serialCol ? r[serialCol] : r.serial || r.empid || r.number || r.code) || '');
    }
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

  const renderLabelImage = async (serial: string, csvRow?: Record<string, string>, skipVariableReplace = false, toJpeg = false): Promise<string> => {
    // Keep the same coordinate system as DesignCanvas (mm -> px scale factor 3)
    const renderScale = 3;
    const pixelW = canvasWidth * renderScale;
    const pixelH = canvasHeight * renderScale;
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
      const text = skipVariableReplace ? rawText : rawText.replace(/\{\{(\w+)\}\}/g, (_match, varName) => {
        return resolveVar(varName, csvRow, serial);
      });
      const barcodeValue = skipVariableReplace ? (rawText || 'SAMPLE') : (text.length > 0 ? text : serial);

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
              width: 2,
              height: Math.max(30, el.height - 20),
              displayValue: false,
              margin: 3,
              background: '#FFFFFF',
              lineColor: el.fill || '#000000',
            });
            const img = new window.Image();
            img.src = canvas.toDataURL();
            await new Promise<void>(resolve => { img.onload = () => resolve(); });
            layer.add(new Konva.Image({
              x: el.x, y: el.y, width: el.width, height: el.height - 14,
              image: img, rotation: el.rotation, opacity: el.opacity,
            }));
            layer.add(new Konva.Text({
              x: el.x + 4, y: el.y + el.height - 13,
              text: barcodeValue,
              fontSize: 9,
              fontFamily: 'monospace',
              fill: el.fill || '#000000',
              rotation: el.rotation,
              opacity: el.opacity,
            }));
          } catch {
            // skip invalid barcodes
          }
          break;
        }
        case 'qrcode': {
          try {
            // Quiet zone + high resolution for reliable scan
            const qrDataUrl = await QRCode.toDataURL(barcodeValue, {
              width: Math.max(el.width, el.height) * 2,
              margin: 2,
              errorCorrectionLevel: 'H',
              color: { dark: el.fill || '#000000', light: '#FFFFFF' },
            });
            const img = new window.Image();
            img.src = qrDataUrl;
            await new Promise<void>(resolve => { img.onload = () => resolve(); });
            layer.add(new Konva.Image({
              x: el.x, y: el.y, width: el.width, height: el.height,
              image: img, rotation: el.rotation, opacity: el.opacity,
            }));
          } catch {
            // skip
          }
          break;
        }
        case 'image': {
          if (el.src) {
            try {
              const img = new window.Image();
              img.crossOrigin = 'anonymous';
              img.src = el.src;
              await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject();
              });
              layer.add(new Konva.Image({
                x: el.x, y: el.y, width: el.width, height: el.height,
                image: img, rotation: el.rotation, opacity: el.opacity,
              }));
            } catch {
              // skip
            }
          }
          break;
        }
      }
    }

    layer.batchDraw();
    await new Promise(r => setTimeout(r, 50));
    const dataUrl = offStage.toDataURL({ 
      pixelRatio: 2,
      ...(toJpeg ? { mimeType: 'image/jpeg', quality: 0.95 } : {})
    });
    offStage.destroy();
    document.body.removeChild(container);
    return dataUrl;
  };

  const sanitizeFilePart = (value: string) => value.replace(/[^a-zA-Z0-9-_]/g, '_');

  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const drawCropMarks = (pdf: jsPDF, x: number, y: number, w: number, h: number, bleed: number) => {
    const markLen = 3;
    const gap = Math.max(0.8, bleed);
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);

    // Top-left
    pdf.line(x - gap - markLen, y, x - gap, y);
    pdf.line(x, y - gap - markLen, x, y - gap);
    // Top-right
    pdf.line(x + w + gap, y, x + w + gap + markLen, y);
    pdf.line(x + w, y - gap - markLen, x + w, y - gap);
    // Bottom-left
    pdf.line(x - gap - markLen, y + h, x - gap, y + h);
    pdf.line(x, y + h + gap, x, y + h + gap + markLen);
    // Bottom-right
    pdf.line(x + w + gap, y + h, x + w + gap + markLen, y + h);
    pdf.line(x + w, y + h + gap, x + w, y + h + gap + markLen);
  };

  const handleExport = async () => {
    setExporting(true);
    setProgress(0);
    setProgressLabel('Preparing...');
    try {
      if (exportFormat === 'png') {
        if (exportMode === 'single') {
          setProgressLabel('Rendering PNG...');
          const pngUrl = await renderLabelImage('', undefined, true);
          downloadDataUrl(pngUrl, `${sanitizeFilePart(projectName || 'label')}.png`);
          setProgress(100);
          toast.success('PNG exported');
        } else {
          const serials = generateSerials();
          const totalSerials = serials.length;
          for (let s = 0; s < totalSerials; s++) {
            setProgressLabel(`Generating PNG ${s + 1}/${totalSerials}`);
            const csvRow = csvRows.length > 0 ? csvRows[s] : undefined;
            const pngUrl = await renderLabelImage(serials[s], csvRow);
            const serialLabel = sanitizeFilePart(serials[s] || `label-${s + 1}`);
            downloadDataUrl(pngUrl, `${sanitizeFilePart(projectName || 'label')}-${serialLabel}.png`);
            setProgress(Math.round(((s + 1) / totalSerials) * 100));
          }
          toast.success(`${totalSerials} PNG label${totalSerials !== 1 ? 's' : ''} exported`);
        }
        setOpen(false);
        return;
      }

      const page = pageSize === 'Custom'
        ? { width: customW, height: customH }
        : PAGE_SIZES[pageSize as keyof typeof PAGE_SIZES];

      const stickerW = (page.width - marginX * 2 - gapX * (cols - 1)) / cols;
      const stickerH = (page.height - marginY * 2 - gapY * (rows - 1)) / rows;
      const stickersPerPage = cols * rows;
      const appliedBleed = Math.max(0, bleedMm);

      const pdf = new jsPDF({
        orientation: page.width > page.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [page.width, page.height],
      });

      if (exportMode === 'single') {
        setProgressLabel('Rendering label...');
        const dataUrl = await renderLabelImage('', undefined, true, true);
        for (let i = 0; i < stickersPerPage; i++) {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x = marginX + col * (stickerW + gapX);
          const y = marginY + row * (stickerH + gapY);
          pdf.addImage(dataUrl, 'JPEG', x - appliedBleed, y - appliedBleed, stickerW + appliedBleed * 2, stickerH + appliedBleed * 2);
          if (showCropMarks) drawCropMarks(pdf, x, y, stickerW, stickerH, appliedBleed);
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
          const labelImage = await renderLabelImage(serials[s], csvRow, false, true);
          pdf.addImage(labelImage, 'JPEG', x - appliedBleed, y - appliedBleed, stickerW + appliedBleed * 2, stickerH + appliedBleed * 2);
          if (showCropMarks) drawCropMarks(pdf, x, y, stickerW, stickerH, appliedBleed);
          stickerIdx++;
          setProgress(Math.round(((s + 1) / totalSerials) * 100));
        }
      }

      setProgressLabel('Saving PDF...');
      pdf.save(`${projectName || 'labels'}.pdf`);
      toast.success(`PDF exported with ${exportMode === 'bulk' ? generateSerials().length : stickersPerPage} labels`);
      setOpen(false);
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Export failed. Check console for details.');
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
          <DialogTitle>Export Labels</DialogTitle>
          <DialogDescription className="sr-only">Configure export options for your labels.</DialogDescription>
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
            <div className="space-y-2">
              <input type="file" accept=".csv,.txt,.xlsx,.xls" onChange={handleFileUpload} className="hidden" id="data-upload" />
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => document.getElementById('data-upload')?.click()}>
                <FileSpreadsheet className="w-3.5 h-3.5" /> Upload Excel / CSV
              </Button>

              {uploadedFileName && (
                <div className="bg-muted rounded-lg p-2 text-xs space-y-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    <span className="font-medium text-foreground">{uploadedFileName}</span>
                  </div>
                  <p className="text-muted-foreground">{csvRows.length} records · {fileHeaders.length} columns</p>
                </div>
              )}

              {detectedVariables.length > 0 && fileHeaders.length > 0 && (
                <div className="bg-muted/50 border border-border rounded-lg p-3 space-y-2">
                  <p className="text-xs font-medium text-foreground">Field Mapping</p>
                  <p className="text-[10px] text-muted-foreground">Variables detected in your design are auto-mapped to file columns. Adjust if needed.</p>
                  {detectedVariables.map(varName => (
                    <div key={varName} className="flex items-center gap-2">
                      <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded font-mono text-foreground min-w-[100px]">{`{{${varName}}}`}</code>
                      <span className="text-muted-foreground text-[10px]">→</span>
                      <Select
                        value={columnMapping[varName] || '__none__'}
                        onValueChange={v => setColumnMapping(prev => ({ ...prev, [varName]: v === '__none__' ? '' : v }))}
                      >
                        <SelectTrigger className="h-7 text-xs flex-1">
                          <SelectValue placeholder="Not mapped" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Not mapped</SelectItem>
                          {fileHeaders.map(h => (
                            <SelectItem key={h} value={h}>{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {columnMapping[varName] && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      )}
                    </div>
                  ))}
                  {csvRows.length > 0 && (
                    <div className="pt-1 border-t border-border">
                      <p className="text-[10px] text-muted-foreground">Preview (Row 1): {detectedVariables.filter(v => columnMapping[v]).map(v => `${v}="${csvRows[0]?.[columnMapping[v]] || ''}"`).join(', ')}</p>
                    </div>
                  )}
                </div>
              )}

              {detectedVariables.length === 0 && (
                <p className="text-[10px] text-muted-foreground">No <code className="bg-muted px-1 rounded">{`{{variables}}`}</code> detected in your design. Add variables like {`{{name}}, {{serial}}`} to your text elements.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="single" className="mt-3">
            <p className="text-xs text-muted-foreground">Exports one designed label (or a page grid if rows/columns are more than 1).</p>
          </TabsContent>
        </Tabs>

        <div className="space-y-4 mt-4">
          <div>
            <Label className="text-xs text-muted-foreground">Export Format</Label>
            <Select value={exportFormat} onValueChange={v => setExportFormat(v as 'pdf' | 'png')}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF (print layout)</SelectItem>
                <SelectItem value="png">PNG (individual labels)</SelectItem>
              </SelectContent>
            </Select>
          </div>

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

          {exportFormat === 'pdf' && (
            <div className="space-y-2 rounded-md border border-border bg-muted/40 p-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Print Options</Label>
              <div>
                <Label className="text-[10px] text-muted-foreground">Bleed (mm)</Label>
                <Input type="number" min={0} max={5} step={0.1} value={bleedMm} onChange={e => setBleedMm(Number(e.target.value))} className="mt-1 h-8 text-xs" />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={showCropMarks} onCheckedChange={checked => setShowCropMarks(checked === true)} id="crop-marks" />
                <Label htmlFor="crop-marks" className="text-xs text-foreground">Show crop marks</Label>
              </div>
            </div>
          )}

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
              <><Download className="w-4 h-4 mr-2" /> Export {totalLabels} Label{totalLabels !== 1 ? 's' : ''} as {exportFormat.toUpperCase()}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
