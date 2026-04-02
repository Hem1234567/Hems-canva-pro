import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BarcodeGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BARCODE_TYPES = [
  'CODE128', 'EAN13', 'EAN8', 'UPC', 'CODE39', 'ITF14', 'MSI', 'pharmacode', 'codabar', 'qr'
];

export const BarcodeGeneratorDialog = ({ open, onOpenChange }: BarcodeGeneratorDialogProps) => {
  const navigate = useNavigate();
  
  const [barcodeType, setBarcodeType] = useState('CODE128');
  const [startVal, setStartVal] = useState('10000');
  const [endVal, setEndVal] = useState('10005');
  const [prefix, setPrefix] = useState('AB');
  const [suffix, setSuffix] = useState('-C');
  
  const [unit, setUnit] = useState('mm');
  const [fixedWidth, setFixedWidth] = useState(false);
  const [barWidth, setBarWidth] = useState('0.6');
  const [width, setWidth] = useState('50');
  const [height, setHeight] = useState('25');
  const [checkDigit, setCheckDigit] = useState(false);
  const [quietZone, setQuietZone] = useState(false);
  const [showText, setShowText] = useState(true);
  const [fontSize, setFontSize] = useState('6');
  const [dpi, setDpi] = useState('300');

  const handleGenerate = () => {
    onOpenChange(false);
    navigate('/barcode-print', {
      state: {
        barcodeType,
        startVal: parseInt(startVal) || 1,
        endVal: parseInt(endVal) || 5,
        prefix,
        suffix,
        unit,
        fixedWidth,
        barWidth: parseFloat(barWidth),
        width: parseFloat(width),
        height: parseFloat(height),
        checkDigit,
        quietZone,
        showText,
        fontSize: parseFloat(fontSize),
        dpi: parseInt(dpi)
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-space">Barcode Generator</DialogTitle>
          <DialogDescription>
            Create professional barcodes in just three steps with our generator.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          
          {/* Column 1: Choose Barcode & Serials */}
          <div className="border border-border rounded-xl p-4 bg-card/50 shadow-sm flex flex-col">
            <h3 className="font-semibold text-lg mb-4">1. Choose Barcode & Value</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Barcode Type</Label>
                <Select value={barcodeType} onValueChange={setBarcodeType}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select barcode..." />
                  </SelectTrigger>
                  <SelectContent>
                    {BARCODE_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2 border-t border-border">
                <Label className="font-medium mb-2 block">Enter the first and last number of your series:</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Start</Label>
                    <Input type="number" value={startVal} onChange={e => setStartVal(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">End</Label>
                    <Input type="number" value={endVal} onChange={e => setEndVal(e.target.value)} className="mt-1" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Prefix</Label>
                  <Input value={prefix} onChange={e => setPrefix(e.target.value)} className="mt-1" placeholder="AB" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Suffix</Label>
                  <Input value={suffix} onChange={e => setSuffix(e.target.value)} className="mt-1" placeholder="-C" />
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Value and Properties */}
          <div className="border border-border rounded-xl p-4 bg-card/50 shadow-sm flex flex-col">
            <h3 className="font-semibold text-lg mb-4">2. Value and Properties</h3>
            <div className="space-y-4">
              
              <div className="flex items-center gap-2">
                <Label className="w-32 text-sm text-muted-foreground">Unit of measure</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mm">mm</SelectItem>
                    <SelectItem value="inch">inch</SelectItem>
                    <SelectItem value="pixel">pixel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="w-32 text-sm text-muted-foreground">Fixed width</Label>
                <Switch checked={fixedWidth} onCheckedChange={setFixedWidth} />
              </div>

              {fixedWidth ? (
                <div className="flex items-center gap-2">
                  <Label className="w-32 text-sm text-muted-foreground">Width</Label>
                  <Input type="number" step="1" value={width} onChange={e => setWidth(e.target.value)} className="flex-1" />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Label className="w-32 text-sm text-muted-foreground">Bar width</Label>
                  <Input type="number" step="0.05" value={barWidth} onChange={e => setBarWidth(e.target.value)} className="flex-1" />
                </div>
              )}

              <div className="flex items-center gap-2">
                <Label className="w-32 text-sm text-muted-foreground">Height</Label>
                <Input type="number" step="1" value={height} onChange={e => setHeight(e.target.value)} className="flex-1" />
              </div>

              <div className="flex items-center gap-2">
                <Label className="w-32 text-sm text-muted-foreground">Check digit</Label>
                <Switch checked={checkDigit} onCheckedChange={setCheckDigit} />
              </div>

              <div className="flex items-center gap-2">
                <Label className="w-32 text-sm text-muted-foreground">Quiet zone</Label>
                <Switch checked={quietZone} onCheckedChange={setQuietZone} />
              </div>

              <div className="flex items-center gap-2">
                <Label className="w-32 text-sm text-muted-foreground">Show text</Label>
                <Switch checked={showText} onCheckedChange={setShowText} />
              </div>

              <div className="flex items-center gap-2">
                <Label className="w-32 text-sm text-muted-foreground">Font size</Label>
                <Input type="number" step="0.25" value={fontSize} onChange={e => setFontSize(e.target.value)} className="flex-1" />
              </div>

              <div className="flex items-center gap-2">
                <Label className="w-32 text-sm text-muted-foreground">DPI</Label>
                <Input type="number" step="50" value={dpi} onChange={e => setDpi(e.target.value)} className="flex-1" />
              </div>
            </div>
          </div>

          {/* Column 3: Generate Barcode */}
          <div className="border border-border rounded-xl p-4 bg-card/50 shadow-sm flex flex-col">
            <h3 className="font-semibold text-lg mb-4">3. Generate Barcode</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Generate your barcode and then select the output target (display, print directly, JPG, ZIP, PDF, Excel).
            </p>
            
            <div className="mt-auto">
              <Button 
                onClick={handleGenerate} 
                className="w-full bg-[#5cb85c] hover:bg-[#4cae4c] text-white font-bold h-12"
              >
                &gt;&gt; generate barcode &lt;&lt;
              </Button>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
};
