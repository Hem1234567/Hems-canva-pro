import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, Download } from 'lucide-react';

interface SerialConfig {
  prefix: string;
  start: number;
  end: number;
  padding: number;
  suffix: string;
}

interface SerialGeneratorProps {
  onGenerate: (serials: string[]) => void;
}

const SerialGenerator = ({ onGenerate }: SerialGeneratorProps) => {
  const [config, setConfig] = useState<SerialConfig>({
    prefix: 'SN-',
    start: 1,
    end: 100,
    padding: 4,
    suffix: '',
  });
  const [csvSerials, setCsvSerials] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateSerials = () => {
    const serials: string[] = [];
    for (let i = config.start; i <= config.end; i++) {
      const num = String(i).padStart(config.padding, '0');
      serials.push(`${config.prefix}${num}${config.suffix}`);
    }
    onGenerate(serials);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      // Skip header if it looks like one
      const data = lines[0]?.match(/serial|number|code/i) ? lines.slice(1) : lines;
      setCsvSerials(data);
      onGenerate(data);
    };
    reader.readAsText(file);
  };

  const preview = () => {
    const num = String(config.start).padStart(config.padding, '0');
    return `${config.prefix}${num}${config.suffix}`;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground">Prefix</Label>
          <Input value={config.prefix} onChange={e => setConfig(c => ({ ...c, prefix: e.target.value }))} className="mt-1 h-8 text-sm" placeholder="SN-" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">Start</Label>
            <Input type="number" value={config.start} onChange={e => setConfig(c => ({ ...c, start: Number(e.target.value) }))} className="mt-1 h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">End</Label>
            <Input type="number" value={config.end} onChange={e => setConfig(c => ({ ...c, end: Number(e.target.value) }))} className="mt-1 h-8 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">Padding</Label>
            <Input type="number" value={config.padding} onChange={e => setConfig(c => ({ ...c, padding: Number(e.target.value) }))} className="mt-1 h-8 text-sm" min={1} max={10} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Suffix</Label>
            <Input value={config.suffix} onChange={e => setConfig(c => ({ ...c, suffix: e.target.value }))} className="mt-1 h-8 text-sm" />
          </div>
        </div>

        <div className="bg-muted rounded-md p-2 text-xs">
          <span className="text-muted-foreground">Preview: </span>
          <span className="font-mono text-foreground">{preview()}</span>
          <span className="text-muted-foreground ml-1">... ({config.end - config.start + 1} labels)</span>
        </div>

        <Button onClick={generateSerials} className="w-full gap-2" size="sm">
          <Download className="w-3.5 h-3.5" /> Generate Serials
        </Button>
      </div>

      <div className="border-t border-border pt-3">
        <p className="text-xs font-medium text-muted-foreground mb-2">Or upload CSV</p>
        <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleCSVUpload} className="hidden" />
        <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => fileInputRef.current?.click()}>
          <Upload className="w-3.5 h-3.5" /> Upload CSV File
        </Button>
        {csvSerials.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">{csvSerials.length} serials loaded from CSV</p>
        )}
      </div>
    </div>
  );
};

export default SerialGenerator;
