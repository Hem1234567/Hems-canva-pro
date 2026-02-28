import { useState, useEffect, useRef } from 'react';
import { useEditor } from '@/contexts/EditorContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash2, Copy, ChevronUp, ChevronDown, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Lock, Unlock, GripVertical } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CanvasElement } from '@/types/editor';
import AlignmentTools from './AlignmentTools';
import Minimap from './Minimap';

const GOOGLE_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Poppins',
  'Raleway', 'Nunito', 'Ubuntu', 'Playfair Display', 'Merriweather',
  'Source Code Pro', 'Fira Code', 'JetBrains Mono', 'PT Sans', 'Noto Sans',
  'Work Sans', 'Quicksand', 'Barlow', 'Rubik', 'Mulish', 'Karla',
  'Josefin Sans', 'Libre Baskerville', 'Crimson Text', 'DM Sans', 'Space Grotesk',
  'Archivo', 'Sora', 'Outfit', 'Plus Jakarta Sans',
];

const loadedFonts = new Set<string>(['Inter']);

const loadGoogleFont = (fontFamily: string) => {
  if (loadedFonts.has(fontFamily)) return;
  loadedFonts.add(fontFamily);
  const link = document.createElement('link');
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@300;400;500;600;700;800&display=swap`;
  link.rel = 'stylesheet';
  document.head.appendChild(link);
};

const RightPanel = () => {
  const { selectedElement, updateElement, deleteElement, duplicateElement, moveLayer, canvasWidth, canvasHeight, setCanvasSize, elements, selectElement, reorderElements } = useEditor();

  // Always call hooks before conditional returns
  useEffect(() => {
    if (selectedElement?.fontFamily) loadGoogleFont(selectedElement.fontFamily);
  }, [selectedElement?.fontFamily]);

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
        <Minimap />
        <Separator className="my-4" />
        <LayersList elements={elements} selectedId={null} onSelect={selectElement} onMove={moveLayer} onDelete={deleteElement} />
      </aside>
    );
  }

  const el = selectedElement;
  const update = (updates: Record<string, any>) => updateElement(el.id, updates);

  const isBold = el.fontStyle?.includes('bold') || false;
  const isItalic = el.fontStyle?.includes('italic') || false;
  const hasUnderline = el.textDecoration === 'underline';

  const toggleBold = () => {
    let style = el.fontStyle || 'normal';
    if (isBold) {
      style = style.replace('bold', '').trim() || 'normal';
    } else {
      style = style === 'normal' ? 'bold' : `bold ${style}`;
    }
    update({ fontStyle: style });
  };

  const toggleItalic = () => {
    let style = el.fontStyle || 'normal';
    if (isItalic) {
      style = style.replace('italic', '').trim() || 'normal';
    } else {
      style = style === 'normal' ? 'italic' : `${style} italic`;
    }
    update({ fontStyle: style });
  };

  const toggleUnderline = () => {
    update({ textDecoration: hasUnderline ? '' : 'underline' });
  };

  const handleFontChange = (font: string) => {
    loadGoogleFont(font);
    update({ fontFamily: font });
  };

  return (
    <aside className="w-[300px] border-l border-border bg-card p-4 shrink-0 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {el.type.charAt(0).toUpperCase() + el.type.slice(1)} Properties
        </h3>
        <div className="flex gap-1">
          <Button variant={el.locked ? 'default' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => update({ locked: !el.locked })} title={el.locked ? 'Unlock' : 'Lock'}>
            {el.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateElement(el.id)} title="Duplicate">
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteElement(el.id)} title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <Section title="Position & Size">
          <div className="grid grid-cols-2 gap-2">
            <Field label="X" value={Math.round(el.x)} onChange={v => update({ x: v })} />
            <Field label="Y" value={Math.round(el.y)} onChange={v => update({ y: v })} />
            <Field label="W" value={Math.round(el.width)} onChange={v => update({ width: v })} />
            <Field label="H" value={Math.round(el.height)} onChange={v => update({ height: v })} />
          </div>
          {(el.type === 'rect' || el.type === 'image') && (
            <div className="mt-2">
              <Field label="Corner Radius" value={el.cornerRadius || 0} onChange={v => update({ cornerRadius: Math.max(0, v) })} />
            </div>
          )}
        </Section>

        <AlignmentTools />

        <Section title="Rotation">
          <Field label="Angle" value={el.rotation} onChange={v => update({ rotation: v })} />
        </Section>

        {(el.type === 'text' || el.type === 'barcode') && (
          <Section title="Text Content">
            <div>
              <Label className="text-xs text-muted-foreground">Text</Label>
              <Input value={el.text || ''} onChange={e => update({ text: e.target.value })} className="mt-1 text-sm" />
            </div>
            {el.type === 'text' && (
              <>
                <div className="mt-2">
                  <Label className="text-xs text-muted-foreground">Font Family</Label>
                  <Select value={el.fontFamily || 'Inter'} onValueChange={handleFontChange}>
                    <SelectTrigger className="mt-1 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {GOOGLE_FONTS.map(f => (
                        <SelectItem key={f} value={f} className="text-xs">
                          <span style={{ fontFamily: f }}>{f}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Field label="Font Size" value={el.fontSize || 16} onChange={v => update({ fontSize: v })} />
                  <Field label="Spacing" value={el.letterSpacing || 0} onChange={v => update({ letterSpacing: v })} />
                </div>

                <div className="flex gap-1 mt-2">
                  <Button variant={isBold ? 'default' : 'outline'} size="icon" className="h-8 w-8" onClick={toggleBold} title="Bold">
                    <Bold className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant={isItalic ? 'default' : 'outline'} size="icon" className="h-8 w-8" onClick={toggleItalic} title="Italic">
                    <Italic className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant={hasUnderline ? 'default' : 'outline'} size="icon" className="h-8 w-8" onClick={toggleUnderline} title="Underline">
                    <Underline className="w-3.5 h-3.5" />
                  </Button>
                  <div className="border-l border-border mx-1" />
                  {['left', 'center', 'right'].map(a => (
                    <Button
                      key={a}
                      variant={el.align === a ? 'default' : 'outline'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => update({ align: a })}
                      title={`Align ${a}`}
                    >
                      {a === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                      {a === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                      {a === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </Section>
        )}

        {el.type === 'image' && (
          <Section title="Image Source">
            <div>
              <Label className="text-xs text-muted-foreground">URL</Label>
              <Input value={el.src || ''} onChange={e => update({ src: e.target.value })} className="mt-1 text-xs" placeholder="https://..." />
            </div>
          </Section>
        )}

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

        <Section title="Opacity">
          <input
            type="range" min={0} max={1} step={0.05} value={el.opacity}
            onChange={e => update({ opacity: parseFloat(e.target.value) })}
            className="w-full accent-primary"
          />
          <span className="text-xs text-muted-foreground">{Math.round(el.opacity * 100)}%</span>
        </Section>

        <Section title="Layers">
          <LayersList elements={elements} selectedId={el.id} onSelect={selectElement} onMove={moveLayer} onDelete={deleteElement} />
        </Section>

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


const LayersList = ({ elements, selectedId, onSelect, onMove, onDelete }: {
  elements: CanvasElement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, dir: 'up' | 'down') => void;
  onDelete: (id: string) => void;
}) => {
  const { updateElement, reorderElements } = useEditor();
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // We display reversed (top layer first), so indices map reversed
  const reversed = [...elements].reverse();

  const handleDragStart = (displayIdx: number) => {
    dragItem.current = displayIdx;
  };

  const handleDragEnter = (displayIdx: number) => {
    dragOverItem.current = displayIdx;
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
      dragItem.current = null;
      dragOverItem.current = null;
      return;
    }
    // Convert display indices (reversed) to actual element indices
    const fromActual = elements.length - 1 - dragItem.current;
    const toActual = elements.length - 1 - dragOverItem.current;
    reorderElements(fromActual, toActual);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Layers</p>
      {reversed.map((el, displayIdx) => {
        const label = el.type === 'text' ? (el.text?.slice(0, 16) || 'Text') : el.type;
        const isActive = el.id === selectedId;
        return (
          <div
            key={el.id}
            draggable
            onDragStart={() => handleDragStart(displayIdx)}
            onDragEnter={() => handleDragEnter(displayIdx)}
            onDragEnd={handleDragEnd}
            onDragOver={e => e.preventDefault()}
            onClick={() => onSelect(el.id)}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs cursor-grab active:cursor-grabbing transition-colors ${
              isActive ? 'bg-primary/10 text-primary border border-primary/30' : 'hover:bg-muted border border-transparent'
            }`}
          >
            <GripVertical className="w-3 h-3 text-muted-foreground shrink-0" />
            {el.locked && <Lock className="w-3 h-3 text-muted-foreground shrink-0" />}
            <span className="capitalize truncate flex-1">{label}</span>
            <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={e => { e.stopPropagation(); updateElement(el.id, { locked: !el.locked }); }} title={el.locked ? 'Unlock' : 'Lock'}>
              {el.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 text-destructive" onClick={e => { e.stopPropagation(); onDelete(el.id); }}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        );
      })}
      {elements.length === 0 && <p className="text-xs text-muted-foreground">No elements yet</p>}
    </div>
  );
};

export default RightPanel;
