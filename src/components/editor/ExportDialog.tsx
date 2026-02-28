import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Loader2 } from 'lucide-react';
import { useEditor } from '@/contexts/EditorContext';
import { jsPDF } from 'jspdf';
import Konva from 'konva';

interface ExportDialogProps {
  stageRef: React.RefObject<Konva.Stage>;
}

const PAGE_SIZES = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  Custom: { width: 210, height: 297 },
};

const ExportDialog = ({ stageRef }: ExportDialogProps) => {
  const { projectName, canvasWidth, canvasHeight } = useEditor();
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

  const handleExport = async () => {
    if (!stageRef.current) return;
    setExporting(true);

    try {
      const page = pageSize === 'Custom'
        ? { width: customW, height: customH }
        : PAGE_SIZES[pageSize as keyof typeof PAGE_SIZES];

      // Render the Konva stage to an image
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 3 });

      const stickerW = (page.width - marginX * 2 - gapX * (cols - 1)) / cols;
      const stickerH = (page.height - marginY * 2 - gapY * (rows - 1)) / rows;

      const pdf = new jsPDF({
        orientation: page.width > page.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [page.width, page.height],
      });

      const totalStickers = cols * rows;

      for (let i = 0; i < totalStickers; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = marginX + col * (stickerW + gapX);
        const y = marginY + row * (stickerH + gapY);
        pdf.addImage(dataUrl, 'PNG', x, y, stickerW, stickerH);
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
        <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-gold-hover gold-glow-hover">
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export PDF</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export PDF</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Page Size */}
          <div>
            <Label className="text-xs text-muted-foreground">Page Size</Label>
            <Select value={pageSize} onValueChange={setPageSize}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
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

          {/* Grid Layout */}
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

          {/* Margins & Gaps */}
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

          {/* Preview info */}
          <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground">
            <p>Sticker size: {canvasWidth}×{canvasHeight}mm</p>
            <p>Total stickers per page: {cols * rows}</p>
          </div>

          <Button onClick={handleExport} disabled={exporting} className="w-full bg-primary text-primary-foreground hover:bg-gold-hover">
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
