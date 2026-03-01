import { useState } from 'react';
import { useEditor } from '@/contexts/EditorContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Wand2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface FilterState {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  grayscale: number;
  sepia: number;
}

const defaultFilters: FilterState = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  grayscale: 0,
  sepia: 0,
};

const presets = [
  { name: 'Vivid', filters: { brightness: 110, contrast: 120, saturation: 140, blur: 0, grayscale: 0, sepia: 0 } },
  { name: 'B&W', filters: { brightness: 100, contrast: 110, saturation: 0, blur: 0, grayscale: 100, sepia: 0 } },
  { name: 'Warm', filters: { brightness: 105, contrast: 105, saturation: 110, blur: 0, grayscale: 0, sepia: 30 } },
  { name: 'Cool', filters: { brightness: 100, contrast: 110, saturation: 90, blur: 0, grayscale: 10, sepia: 0 } },
  { name: 'Vintage', filters: { brightness: 95, contrast: 90, saturation: 70, blur: 0, grayscale: 20, sepia: 40 } },
  { name: 'Dreamy', filters: { brightness: 115, contrast: 85, saturation: 80, blur: 1, grayscale: 0, sepia: 10 } },
];

const ImageFilters = () => {
  const { selectedElement, updateElement } = useEditor();
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  if (!selectedElement || selectedElement.type !== 'image') return null;

  const applyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    // Store filter string in element for rendering
    const filterStr = `brightness(${newFilters.brightness}%) contrast(${newFilters.contrast}%) saturate(${newFilters.saturation}%) blur(${newFilters.blur}px) grayscale(${newFilters.grayscale}%) sepia(${newFilters.sepia}%)`;
    updateElement(selectedElement.id, { filter: filterStr } as any);
  };

  const resetFilters = () => {
    applyFilters(defaultFilters);
    toast.success('Filters reset');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Filters & Adjustments</h4>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={resetFilters} title="Reset">
          <RotateCcw className="w-3 h-3" />
        </Button>
      </div>

      <div>
        <p className="text-[10px] text-muted-foreground mb-1.5">Presets</p>
        <div className="grid grid-cols-3 gap-1">
          {presets.map(p => (
            <button
              key={p.name}
              onClick={() => applyFilters(p.filters)}
              className="px-2 py-1.5 text-[10px] font-medium border border-border rounded hover:border-primary hover:text-primary transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <FilterSlider label="Brightness" value={filters.brightness} min={0} max={200} onChange={v => applyFilters({ ...filters, brightness: v })} />
        <FilterSlider label="Contrast" value={filters.contrast} min={0} max={200} onChange={v => applyFilters({ ...filters, contrast: v })} />
        <FilterSlider label="Saturation" value={filters.saturation} min={0} max={200} onChange={v => applyFilters({ ...filters, saturation: v })} />
        <FilterSlider label="Blur" value={filters.blur} min={0} max={20} onChange={v => applyFilters({ ...filters, blur: v })} />
        <FilterSlider label="Grayscale" value={filters.grayscale} min={0} max={100} onChange={v => applyFilters({ ...filters, grayscale: v })} />
        <FilterSlider label="Sepia" value={filters.sepia} min={0} max={100} onChange={v => applyFilters({ ...filters, sepia: v })} />
      </div>
    </div>
  );
};

const FilterSlider = ({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) => (
  <div>
    <div className="flex justify-between items-center mb-0.5">
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <span className="text-[10px] text-muted-foreground">{value}{label === 'Blur' ? 'px' : '%'}</span>
    </div>
    <Slider
      min={min}
      max={max}
      step={1}
      value={[value]}
      onValueChange={([v]) => onChange(v)}
      className="w-full"
    />
  </div>
);

export default ImageFilters;
