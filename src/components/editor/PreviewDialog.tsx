import { useState, useMemo, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEditor } from '@/contexts/EditorContext';
import Konva from 'konva';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PreviewDialog = ({ open, onOpenChange }: PreviewDialogProps) => {
  const { elements, canvasWidth, canvasHeight } = useEditor();
  const [serialPrefix, setSerialPrefix] = useState('SN-');
  const [serialStart, setSerialStart] = useState(1);
  const [serialPadding, setSerialPadding] = useState(4);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const totalPreview = 5; // Show up to 5 preview labels

  const currentSerial = useMemo(() => {
    const num = serialStart + currentIndex;
    return `${serialPrefix}${String(num).padStart(serialPadding, '0')}`;
  }, [serialPrefix, serialStart, serialPadding, currentIndex]);

  // Render preview
  useEffect(() => {
    if (!open) return;
    renderPreview(currentSerial);
  }, [open, currentSerial, elements]);

  const renderPreview = async (serial: string) => {
    const pixelW = canvasWidth;
    const pixelH = canvasHeight;
    const exportPixelRatio = 4;
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    const stage = new Konva.Stage({ container, width: pixelW, height: pixelH });
    const layer = new Konva.Layer();
    stage.add(layer);

    layer.add(new Konva.Rect({ x: 0, y: 0, width: pixelW, height: pixelH, fill: '#FFFFFF' }));

    for (const el of elements) {
      const rawText = el.text || '';
      const text = rawText.replace(/\{\{serial\}\}/g, serial)
        .replace(/\{\{date\}\}/g, new Date().toISOString().split('T')[0])
        .replace(/\{\{batch\}\}/g, 'BATCH-001')
        .replace(/\{\{prefix\}\}/g, serialPrefix);
      const barcodeValue = text.length > 0 ? text : serial;

      switch (el.type) {
        case 'text':
          layer.add(new Konva.Text({
            x: el.x, y: el.y, text, fontSize: el.fontSize || 18,
            fontFamily: el.fontFamily || 'Inter', fontStyle: el.fontStyle || 'normal',
            fill: el.fill, width: el.width, rotation: el.rotation, opacity: el.opacity,
            letterSpacing: el.letterSpacing || 0, align: el.align || 'left',
            textDecoration: el.textDecoration || '',
          }));
          break;
        case 'rect':
          layer.add(new Konva.Rect({
            x: el.x, y: el.y, width: el.width, height: el.height,
            fill: el.fill, stroke: el.stroke, strokeWidth: el.strokeWidth,
            rotation: el.rotation, opacity: el.opacity, cornerRadius: 2,
          }));
          break;
        case 'circle':
          layer.add(new Konva.Circle({
            x: el.x + el.width / 2, y: el.y + el.height / 2, radius: el.width / 2,
            fill: el.fill, stroke: el.stroke, strokeWidth: el.strokeWidth,
            rotation: el.rotation, opacity: el.opacity,
          }));
          break;
        case 'line':
          layer.add(new Konva.Line({
            x: el.x, y: el.y, points: [0, 0, el.width, 0],
            stroke: el.fill, strokeWidth: el.strokeWidth || 2,
            rotation: el.rotation, opacity: el.opacity,
          }));
          break;
        case 'barcode':
          try {
            const canvas = document.createElement('canvas');
            JsBarcode(canvas, barcodeValue, {
              format: el.barcodeFormat || 'CODE128',
              width: 2, height: 60, displayValue: false,
              background: 'transparent', lineColor: el.fill,
            });
            const img = new window.Image();
            img.src = canvas.toDataURL();
            await new Promise<void>(r => { img.onload = () => r(); });
            layer.add(new Konva.Image({
              x: el.x, y: el.y, width: el.width, height: el.height,
              image: img, rotation: el.rotation, opacity: el.opacity,
            }));
          } catch { /* skip */ }
          break;
        case 'qrcode':
          try {
            const qrSize = Math.max(el.width, el.height) * exportPixelRatio;
            const qrUrl = await QRCode.toDataURL(barcodeValue, {
              width: qrSize, margin: 2,
              errorCorrectionLevel: 'H',
              color: { dark: el.fill || '#000000', light: '#FFFFFF' },
            });
            const img = new window.Image();
            img.src = qrUrl;
            await new Promise<void>(r => { img.onload = () => r(); });
            layer.add(new Konva.Image({
              x: el.x, y: el.y, width: el.width, height: el.height,
              image: img, rotation: el.rotation, opacity: el.opacity,
            }));
          } catch { /* skip */ }
          break;
        case 'image':
          if (el.src) {
            try {
              const img = new window.Image();
              img.crossOrigin = 'anonymous';
              img.src = el.src;
              await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); });
              layer.add(new Konva.Image({
                x: el.x, y: el.y, width: el.width, height: el.height,
                image: img, rotation: el.rotation, opacity: el.opacity,
              }));
            } catch { /* skip */ }
          }
          break;
      }
    }

    layer.draw();
    const url = stage.toDataURL({ pixelRatio: exportPixelRatio });
    setPreviewUrl(url);
    stage.destroy();
    document.body.removeChild(container);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Label Preview</DialogTitle>
        </DialogHeader>

        {/* Serial config */}
        <div className="flex items-end gap-2 mb-4">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Prefix</Label>
            <Input value={serialPrefix} onChange={e => setSerialPrefix(e.target.value)} className="mt-1 h-8 text-sm" />
          </div>
          <div className="w-20">
            <Label className="text-xs text-muted-foreground">Start #</Label>
            <Input type="number" value={serialStart} onChange={e => setSerialStart(Number(e.target.value))} className="mt-1 h-8 text-sm" />
          </div>
          <div className="w-20">
            <Label className="text-xs text-muted-foreground">Padding</Label>
            <Input type="number" value={serialPadding} onChange={e => setSerialPadding(Number(e.target.value))} className="mt-1 h-8 text-sm" min={1} max={10} />
          </div>
        </div>

        {/* Preview image */}
        <div className="border border-border rounded-lg bg-muted p-4 flex items-center justify-center min-h-[300px]">
          {previewUrl ? (
            <img src={previewUrl} alt="Label preview" className="max-w-full max-h-[400px] object-contain shadow-md rounded" />
          ) : (
            <p className="text-muted-foreground text-sm">Generating preview...</p>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </Button>

          <div className="text-center">
            <p className="text-sm font-medium text-foreground font-mono">{currentSerial}</p>
            <p className="text-xs text-muted-foreground">Label {currentIndex + 1} of {totalPreview}</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentIndex(Math.min(totalPreview - 1, currentIndex + 1))}
            disabled={currentIndex >= totalPreview - 1}
            className="gap-1"
          >
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewDialog;
