import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BARCODE_TYPES = [
  'CODE128', 'EAN13', 'EAN8', 'UPC', 'CODE39', 'ITF14', 'MSI', 'pharmacode', 'codabar', 'qr'
];

export default function BarcodeGeneratorPage() {
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
    navigate('/barcode-gen-print', {
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
    <div className="min-h-screen bg-background">
      {/* Top Navbar */}
      <div className="h-14 border-b border-border bg-card flex items-center px-4 md:px-8 sticky top-0 z-10">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Button>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
        <div className="mb-6 md:mb-10 text-center md:text-left">
          <h1 className="text-2xl md:text-4xl font-bold text-foreground">Barcode Generator</h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-lg">
            Create professional barcodes in just three steps with our generator.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Column 1: Choose Barcode & Serials */}
          <div className="border border-border rounded-xl p-5 md:p-6 bg-card shadow-sm flex flex-col">
            <h3 className="font-semibold text-lg md:text-xl mb-5">1. Choose Barcode & Value</h3>
            <div className="space-y-5">
              <div>
                <Label className="text-sm font-medium text-muted-foreground block mb-2">Barcode Type</Label>
                <Select value={barcodeType} onValueChange={setBarcodeType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select barcode..." />
                  </SelectTrigger>
                  <SelectContent>
                    {BARCODE_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-5 border-t border-border">
                <Label className="font-medium text-sm md:text-base mb-3 block">Enter the first and last number of your series:</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Start</Label>
                    <Input type="number" value={startVal} onChange={e => setStartVal(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">End</Label>
                    <Input type="number" value={endVal} onChange={e => setEndVal(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Prefix</Label>
                  <Input value={prefix} onChange={e => setPrefix(e.target.value)} placeholder="AB" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Suffix</Label>
                  <Input value={suffix} onChange={e => setSuffix(e.target.value)} placeholder="-C" />
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Value and Properties */}
          <div className="border border-border rounded-xl p-5 md:p-6 bg-card shadow-sm flex flex-col">
            <h3 className="font-semibold text-lg md:text-xl mb-5">2. Value and Properties</h3>
            <div className="space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                <Label className="text-sm font-medium text-muted-foreground sm:w-1/3">Unit</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="w-full sm:w-2/3">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mm">mm</SelectItem>
                    <SelectItem value="inch">inch</SelectItem>
                    <SelectItem value="pixel">pixel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between gap-4">
                <Label className="text-sm font-medium text-muted-foreground w-1/2 sm:w-1/3">Fixed width</Label>
                <div className="w-1/2 sm:w-2/3 flex justify-end sm:justify-start">
                  <Switch checked={fixedWidth} onCheckedChange={setFixedWidth} />
                </div>
              </div>

              {fixedWidth ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                  <Label className="text-sm font-medium text-muted-foreground sm:w-1/3">Width</Label>
                  <Input type="number" step="1" value={width} onChange={e => setWidth(e.target.value)} className="w-full sm:w-2/3" />
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                  <Label className="text-sm font-medium text-muted-foreground sm:w-1/3">Bar width</Label>
                  <Input type="number" step="0.05" value={barWidth} onChange={e => setBarWidth(e.target.value)} className="w-full sm:w-2/3" />
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                <Label className="text-sm font-medium text-muted-foreground sm:w-1/3">Height</Label>
                <Input type="number" step="1" value={height} onChange={e => setHeight(e.target.value)} className="w-full sm:w-2/3" />
              </div>

              <div className="flex items-center justify-between gap-4">
                <Label className="text-sm font-medium text-muted-foreground w-1/2 sm:w-1/3">Check digit</Label>
                <div className="w-1/2 sm:w-2/3 flex justify-end sm:justify-start">
                  <Switch checked={checkDigit} onCheckedChange={setCheckDigit} />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <Label className="text-sm font-medium text-muted-foreground w-1/2 sm:w-1/3">Quiet zone</Label>
                <div className="w-1/2 sm:w-2/3 flex justify-end sm:justify-start">
                  <Switch checked={quietZone} onCheckedChange={setQuietZone} />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <Label className="text-sm font-medium text-muted-foreground w-1/2 sm:w-1/3">Show text</Label>
                <div className="w-1/2 sm:w-2/3 flex justify-end sm:justify-start">
                  <Switch checked={showText} onCheckedChange={setShowText} />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                <Label className="text-sm font-medium text-muted-foreground sm:w-1/3">Font size</Label>
                <Input type="number" step="0.25" value={fontSize} onChange={e => setFontSize(e.target.value)} className="w-full sm:w-2/3" />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                <Label className="text-sm font-medium text-muted-foreground sm:w-1/3">DPI</Label>
                <Input type="number" step="50" value={dpi} onChange={e => setDpi(e.target.value)} className="w-full sm:w-2/3" />
              </div>
            </div>
          </div>

          {/* Column 3: Generate Barcode */}
          <div className="border border-border rounded-xl p-5 md:p-6 bg-card shadow-sm flex flex-col md:col-span-2 lg:col-span-1">
            <h3 className="font-semibold text-lg md:text-xl mb-4">3. Generate Barcode</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Generate your barcode and then select the output target (display, print directly, JPG, ZIP, PDF, Excel).
            </p>
            
            <div className="mt-auto">
              <Button 
                onClick={handleGenerate} 
                className="w-full bg-[#5cb85c] hover:bg-[#4cae4c] text-white font-bold h-12 md:h-14 text-base md:text-lg transition-colors"
              >
                &gt;&gt; generate barcode &lt;&lt;
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
