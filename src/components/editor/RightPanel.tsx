import { useEditor } from '@/contexts/EditorContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash2, Copy, ChevronUp, ChevronDown } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const RightPanel = () => {
  const { selectedElement, updateElement, deleteElement, duplicateElement, moveLayer, canvasWidth, canvasHeight, setCanvasSize } = useEditor();

  if (!selectedElement) {
    return (
      <aside className="w-[300px] border-l border-border bg-card p-4 shrink-0 overflow-y-auto">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Canvas Settings</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Width (mm)</Label>
            <Input type="number" value={canvasWidth} onChange={e => setCanvasSize(Number(e.target.value), canvasHeight)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Height (mm)</Label>
            <Input type="number" value={canvasHeight} onChange={e => setCanvasSize(canvasWidth, Number(e.target.value))} className="mt-1" />
          </div>
        </div>
        <Separator className="my-4" />
        <p className="text-xs text-muted-foreground">Select an element on the canvas to edit its properties.</p>
      </aside>
    );
  }

  const el = selectedElement;
  const update = (updates: Record<string, any>) => updateElement(el.id, updates);

  return (
    <aside className="w-[300px] border-l border-border bg-card p-4 shrink-0 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {el.type.charAt(0).toUpperCase() + el.type.slice(1)} Properties
        </h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateElement(el.id)} title="Duplicate">
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteElement(el.id)} title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Position & Size */}
        <Section title="Position & Size">
          <div className="grid grid-cols-2 gap-2">
            <Field label="X" value={Math.round(el.x)} onChange={v => update({ x: v })} />
            <Field label="Y" value={Math.round(el.y)} onChange={v => update({ y: v })} />
            <Field label="W" value={Math.round(el.width)} onChange={v => update({ width: v })} />
            <Field label="H" value={Math.round(el.height)} onChange={v => update({ height: v })} />
          </div>
        </Section>

        {/* Rotation */}
        <Section title="Rotation">
          <Field label="Angle" value={el.rotation} onChange={v => update({ rotation: v })} />
        </Section>

        {/* Text Properties */}
        {(el.type === 'text' || el.type === 'barcode') && (
          <Section title="Text Content">
            <div>
              <Label className="text-xs text-muted-foreground">Text</Label>
              <Input value={el.text || ''} onChange={e => update({ text: e.target.value })} className="mt-1 text-sm" />
            </div>
            {el.type === 'text' && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Field label="Font Size" value={el.fontSize || 16} onChange={v => update({ fontSize: v })} />
                <Field label="Spacing" value={el.letterSpacing || 0} onChange={v => update({ letterSpacing: v })} />
              </div>
            )}
          </Section>
        )}

        {/* Colors */}
        <Section title="Colors">
          <div className="flex items-center gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Fill</Label>
              <input type="color" value={el.fill} onChange={e => update({ fill: e.target.value })} className="w-8 h-8 rounded border border-border cursor-pointer mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Stroke</Label>
              <input type="color" value={el.stroke || '#000000'} onChange={e => update({ stroke: e.target.value })} className="w-8 h-8 rounded border border-border cursor-pointer mt-1" />
            </div>
            <div className="flex-1">
              <Field label="Stroke W" value={el.strokeWidth} onChange={v => update({ strokeWidth: v })} />
            </div>
          </div>
        </Section>

        {/* Opacity */}
        <Section title="Opacity">
          <input
            type="range" min={0} max={1} step={0.05} value={el.opacity}
            onChange={e => update({ opacity: parseFloat(e.target.value) })}
            className="w-full accent-primary"
          />
          <span className="text-xs text-muted-foreground">{Math.round(el.opacity * 100)}%</span>
        </Section>

        {/* Layer */}
        <Section title="Layer Order">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => moveLayer(el.id, 'up')}>
              <ChevronUp className="w-3 h-3" /> Forward
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => moveLayer(el.id, 'down')}>
              <ChevronDown className="w-3 h-3" /> Back
            </Button>
          </div>
        </Section>

        {/* Variable binding */}
        {(el.type === 'text' || el.type === 'barcode' || el.type === 'qrcode') && (
          <Section title="Variable Binding">
            <div className="flex flex-wrap gap-1.5">
              {['{{serial}}', '{{date}}', '{{batch}}', '{{prefix}}'].map(v => (
                <button
                  key={v}
                  onClick={() => update({ text: v })}
                  className="text-xs font-mono border border-border rounded px-2 py-1 hover:border-primary hover:text-primary transition-colors"
                >
                  {v}
                </button>
              ))}
            </div>
          </Section>
        )}
      </div>
    </aside>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <Separator className="mb-3" />
    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{title}</p>
    {children}
  </div>
);

const Field = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <div>
    <Label className="text-[10px] text-muted-foreground">{label}</Label>
    <Input type="number" value={value} onChange={e => onChange(Number(e.target.value))} className="mt-0.5 h-8 text-xs" />
  </div>
);

export default RightPanel;
