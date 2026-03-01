import { useState } from 'react';
import { useEditor } from '@/contexts/EditorContext';
import { CanvasElement } from '@/types/editor';
import {
  Star, Heart, ArrowRight, ArrowLeft, ArrowUp, ArrowDown,
  Shield, Zap, Award, Crown, Flag, Bookmark,
  Sun, Moon, Cloud, Droplets, Flame, Snowflake,
  Music, Camera, Phone, Mail, MapPin, Calendar,
  Check, X, AlertTriangle, Info, HelpCircle, Bell,
  Home, Settings, User, Users, Lock, Unlock,
  Palette
} from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface StockShape {
  name: string;
  category: string;
  element: Partial<CanvasElement> & { type: CanvasElement['type'] };
}

const stockShapes: StockShape[] = [
  // Cards & Containers
  { name: 'Rounded Card', category: 'Cards', element: { type: 'rect', width: 200, height: 120, fill: '#f1f5f9', stroke: '#e2e8f0', strokeWidth: 1, opacity: 1, cornerRadius: 12 } },
  { name: 'Accent Bar', category: 'Cards', element: { type: 'rect', width: 4, height: 60, fill: '#6366f1', stroke: 'transparent', strokeWidth: 0, opacity: 1, cornerRadius: 2 } },
  { name: 'Pill Button', category: 'Cards', element: { type: 'rect', width: 160, height: 44, fill: '#6366f1', stroke: 'transparent', strokeWidth: 0, opacity: 1, cornerRadius: 22 } },
  { name: 'Badge', category: 'Cards', element: { type: 'rect', width: 80, height: 28, fill: '#dbeafe', stroke: 'transparent', strokeWidth: 0, opacity: 1, cornerRadius: 14 } },
  { name: 'Tag', category: 'Cards', element: { type: 'rect', width: 90, height: 32, fill: '#fef3c7', stroke: '#f59e0b', strokeWidth: 1, opacity: 1, cornerRadius: 6 } },
  { name: 'Toast Card', category: 'Cards', element: { type: 'rect', width: 280, height: 64, fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1, opacity: 1, cornerRadius: 10 } },

  // Gradient Backgrounds
  { name: 'Purple Gradient', category: 'Backgrounds', element: { type: 'rect', width: 400, height: 300, fill: '#7c3aed', stroke: 'transparent', strokeWidth: 0, opacity: 1, cornerRadius: 0 } },
  { name: 'Ocean Blue', category: 'Backgrounds', element: { type: 'rect', width: 400, height: 300, fill: '#0ea5e9', stroke: 'transparent', strokeWidth: 0, opacity: 1, cornerRadius: 0 } },
  { name: 'Sunset Orange', category: 'Backgrounds', element: { type: 'rect', width: 400, height: 300, fill: '#f97316', stroke: 'transparent', strokeWidth: 0, opacity: 1, cornerRadius: 0 } },
  { name: 'Forest Green', category: 'Backgrounds', element: { type: 'rect', width: 400, height: 300, fill: '#059669', stroke: 'transparent', strokeWidth: 0, opacity: 1, cornerRadius: 0 } },
  { name: 'Rose Pink', category: 'Backgrounds', element: { type: 'rect', width: 400, height: 300, fill: '#e11d48', stroke: 'transparent', strokeWidth: 0, opacity: 1, cornerRadius: 0 } },
  { name: 'Charcoal Dark', category: 'Backgrounds', element: { type: 'rect', width: 400, height: 300, fill: '#1e293b', stroke: 'transparent', strokeWidth: 0, opacity: 1, cornerRadius: 0 } },
  { name: 'Warm Beige', category: 'Backgrounds', element: { type: 'rect', width: 400, height: 300, fill: '#fef3c7', stroke: 'transparent', strokeWidth: 0, opacity: 1, cornerRadius: 0 } },
  { name: 'Soft Lavender', category: 'Backgrounds', element: { type: 'rect', width: 400, height: 300, fill: '#ede9fe', stroke: 'transparent', strokeWidth: 0, opacity: 1, cornerRadius: 0 } },
  { name: 'Dark Overlay', category: 'Backgrounds', element: { type: 'rect', width: 400, height: 300, fill: '#000000', stroke: 'transparent', strokeWidth: 0, opacity: 0.5, cornerRadius: 0 } },
  { name: 'Light Overlay', category: 'Backgrounds', element: { type: 'rect', width: 400, height: 300, fill: '#ffffff', stroke: 'transparent', strokeWidth: 0, opacity: 0.6, cornerRadius: 0 } },

  // Image Placeholders
  { name: 'Photo Square', category: 'Placeholders', element: { type: 'image', width: 200, height: 200, fill: 'transparent', stroke: '#d1d5db', strokeWidth: 2, opacity: 1, cornerRadius: 0, src: '' } },
  { name: 'Photo Landscape', category: 'Placeholders', element: { type: 'image', width: 300, height: 200, fill: 'transparent', stroke: '#d1d5db', strokeWidth: 2, opacity: 1, cornerRadius: 0, src: '' } },
  { name: 'Photo Portrait', category: 'Placeholders', element: { type: 'image', width: 200, height: 280, fill: 'transparent', stroke: '#d1d5db', strokeWidth: 2, opacity: 1, cornerRadius: 0, src: '' } },
  { name: 'Avatar Circle', category: 'Placeholders', element: { type: 'image', width: 100, height: 100, fill: 'transparent', stroke: '#d1d5db', strokeWidth: 2, opacity: 1, cornerRadius: 50, src: '' } },
  { name: 'Hero Banner', category: 'Placeholders', element: { type: 'image', width: 500, height: 180, fill: 'transparent', stroke: '#d1d5db', strokeWidth: 1, opacity: 1, cornerRadius: 8, src: '' } },
  { name: 'Thumbnail', category: 'Placeholders', element: { type: 'image', width: 120, height: 90, fill: 'transparent', stroke: '#d1d5db', strokeWidth: 1, opacity: 1, cornerRadius: 6, src: '' } },

  // Decorative Frames
  { name: 'Thin Frame', category: 'Frames', element: { type: 'rect', width: 240, height: 180, fill: 'transparent', stroke: '#000000', strokeWidth: 1, opacity: 1, cornerRadius: 0 } },
  { name: 'Bold Frame', category: 'Frames', element: { type: 'rect', width: 240, height: 180, fill: 'transparent', stroke: '#000000', strokeWidth: 4, opacity: 1, cornerRadius: 0 } },
  { name: 'Rounded Frame', category: 'Frames', element: { type: 'rect', width: 240, height: 180, fill: 'transparent', stroke: '#6366f1', strokeWidth: 2, opacity: 1, cornerRadius: 16 } },
  { name: 'Double Frame', category: 'Frames', element: { type: 'rect', width: 220, height: 160, fill: 'transparent', stroke: '#d4af37', strokeWidth: 3, opacity: 1, cornerRadius: 4 } },
  { name: 'Circle Frame', category: 'Frames', element: { type: 'circle', width: 160, height: 160, fill: 'transparent', stroke: '#000000', strokeWidth: 2, opacity: 1 } },
  { name: 'Gold Frame', category: 'Frames', element: { type: 'rect', width: 260, height: 200, fill: 'transparent', stroke: '#d4af37', strokeWidth: 4, opacity: 1, cornerRadius: 0 } },
  { name: 'Shadow Frame', category: 'Frames', element: { type: 'rect', width: 240, height: 180, fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1, opacity: 1, cornerRadius: 8 } },
  { name: 'Accent Frame', category: 'Frames', element: { type: 'rect', width: 240, height: 180, fill: 'transparent', stroke: '#e11d48', strokeWidth: 3, opacity: 1, cornerRadius: 12 } },

  // Lines & Dividers
  { name: 'Divider', category: 'Lines', element: { type: 'line', width: 300, height: 1, fill: '#e2e8f0', strokeWidth: 1, opacity: 1 } },
  { name: 'Thick Divider', category: 'Lines', element: { type: 'line', width: 200, height: 4, fill: '#6366f1', strokeWidth: 4, opacity: 1 } },
  { name: 'Gold Line', category: 'Lines', element: { type: 'line', width: 250, height: 2, fill: '#d4af37', strokeWidth: 2, opacity: 1 } },
  { name: 'Dotted Line', category: 'Lines', element: { type: 'line', width: 300, height: 1, fill: '#9ca3af', strokeWidth: 1, opacity: 1 } },
  { name: 'Short Accent', category: 'Lines', element: { type: 'line', width: 60, height: 3, fill: '#6366f1', strokeWidth: 3, opacity: 1 } },

  // Basic Shapes
  { name: 'Circle Dot', category: 'Shapes', element: { type: 'circle', width: 16, height: 16, fill: '#6366f1', stroke: 'transparent', strokeWidth: 0, opacity: 1 } },
  { name: 'Large Circle', category: 'Shapes', element: { type: 'circle', width: 120, height: 120, fill: '#f1f5f9', stroke: '#e2e8f0', strokeWidth: 1, opacity: 1 } },
  { name: 'Square Frame', category: 'Shapes', element: { type: 'rect', width: 100, height: 100, fill: 'transparent', stroke: '#000000', strokeWidth: 2, opacity: 1 } },
  { name: 'Filled Square', category: 'Shapes', element: { type: 'rect', width: 80, height: 80, fill: '#6366f1', stroke: 'transparent', strokeWidth: 0, opacity: 1, cornerRadius: 4 } },
  { name: 'Small Circle', category: 'Shapes', element: { type: 'circle', width: 40, height: 40, fill: '#f59e0b', stroke: 'transparent', strokeWidth: 0, opacity: 1 } },
  { name: 'Diamond', category: 'Shapes', element: { type: 'rect', width: 60, height: 60, fill: '#7c3aed', stroke: 'transparent', strokeWidth: 0, opacity: 1, rotation: 45 } },

  // Text Blocks
  { name: 'Heading', category: 'Text Blocks', element: { type: 'text', width: 300, height: 50, text: 'Your Heading Here', fontSize: 36, fontFamily: 'Space Grotesk', fontStyle: 'bold', fill: '#0f172a', opacity: 1 } },
  { name: 'Subheading', category: 'Text Blocks', element: { type: 'text', width: 280, height: 36, text: 'Subheading text goes here', fontSize: 20, fontFamily: 'Inter', fontStyle: 'normal', fill: '#475569', opacity: 1 } },
  { name: 'Body Copy', category: 'Text Blocks', element: { type: 'text', width: 260, height: 80, text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor.', fontSize: 14, fontFamily: 'Inter', fontStyle: 'normal', fill: '#64748b', opacity: 1 } },
  { name: 'Caption', category: 'Text Blocks', element: { type: 'text', width: 200, height: 24, text: 'Caption or fine print', fontSize: 11, fontFamily: 'Inter', fontStyle: 'normal', fill: '#94a3b8', opacity: 1 } },
  { name: 'CTA Button Text', category: 'Text Blocks', element: { type: 'text', width: 140, height: 30, text: 'Get Started', fontSize: 16, fontFamily: 'Inter', fontStyle: 'bold', fill: '#ffffff', opacity: 1, align: 'center' } },
  { name: 'Monospace Code', category: 'Text Blocks', element: { type: 'text', width: 240, height: 28, text: 'const design = "awesome"', fontSize: 13, fontFamily: 'Fira Code', fontStyle: 'normal', fill: '#22c55e', opacity: 1 } },
];

const iconCategories = [
  {
    name: 'Arrows',
    icons: [
      { name: 'Arrow Right', Icon: ArrowRight },
      { name: 'Arrow Left', Icon: ArrowLeft },
      { name: 'Arrow Up', Icon: ArrowUp },
      { name: 'Arrow Down', Icon: ArrowDown },
    ],
  },
  {
    name: 'Symbols',
    icons: [
      { name: 'Star', Icon: Star },
      { name: 'Heart', Icon: Heart },
      { name: 'Shield', Icon: Shield },
      { name: 'Zap', Icon: Zap },
      { name: 'Award', Icon: Award },
      { name: 'Crown', Icon: Crown },
      { name: 'Flag', Icon: Flag },
      { name: 'Bookmark', Icon: Bookmark },
    ],
  },
  {
    name: 'Nature',
    icons: [
      { name: 'Sun', Icon: Sun },
      { name: 'Moon', Icon: Moon },
      { name: 'Cloud', Icon: Cloud },
      { name: 'Water', Icon: Droplets },
      { name: 'Fire', Icon: Flame },
      { name: 'Snow', Icon: Snowflake },
    ],
  },
  {
    name: 'Objects',
    icons: [
      { name: 'Music', Icon: Music },
      { name: 'Camera', Icon: Camera },
      { name: 'Phone', Icon: Phone },
      { name: 'Mail', Icon: Mail },
      { name: 'Location', Icon: MapPin },
      { name: 'Calendar', Icon: Calendar },
    ],
  },
  {
    name: 'UI',
    icons: [
      { name: 'Check', Icon: Check },
      { name: 'Close', Icon: X },
      { name: 'Warning', Icon: AlertTriangle },
      { name: 'Info', Icon: Info },
      { name: 'Help', Icon: HelpCircle },
      { name: 'Bell', Icon: Bell },
      { name: 'Home', Icon: Home },
      { name: 'Settings', Icon: Settings },
      { name: 'User', Icon: User },
      { name: 'Users', Icon: Users },
      { name: 'Lock', Icon: Lock },
      { name: 'Unlock', Icon: Unlock },
    ],
  },
];

const quickColors = [
  '#000000', '#ffffff', '#6366f1', '#ec4899', '#f59e0b',
  '#22c55e', '#0ea5e9', '#e11d48', '#7c3aed', '#d4af37',
  '#1e293b', '#f1f5f9', '#059669', '#f97316', '#64748b',
];

const StockElements = () => {
  const { addCustomElement } = useEditor();
  const [customFill, setCustomFill] = useState('#6366f1');
  const [customStroke, setCustomStroke] = useState('#000000');

  const handleAddShape = (shape: StockShape, overrideColor?: { fill?: string; stroke?: string }) => {
    const el = { ...shape.element };
    if (overrideColor?.fill) el.fill = overrideColor.fill;
    if (overrideColor?.stroke) el.stroke = overrideColor.stroke;
    addCustomElement(el as any);
    toast.success(`Added ${shape.name}`);
  };

  const handleDragStart = (e: React.DragEvent, shape: StockShape) => {
    e.dataTransfer.setData('application/designflow-element', JSON.stringify({
      ...shape.element,
      fill: customFill,
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleIconDragStart = (e: React.DragEvent, iconName: string) => {
    e.dataTransfer.setData('application/designflow-element', JSON.stringify({
      type: 'text',
      text: iconName,
      fontSize: 24,
      fontFamily: 'Inter',
      fontStyle: 'bold',
      fill: customFill,
      width: 120,
      height: 40,
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleAddIcon = (iconName: string) => {
    addCustomElement({
      type: 'text',
      text: iconName,
      fontSize: 24,
      fontFamily: 'Inter',
      fontStyle: 'bold',
      fill: customFill,
      width: 120,
      height: 40,
    });
    toast.success(`Added ${iconName}`);
  };

  const shapeCategories = [...new Set(stockShapes.map(s => s.category))];

  return (
    <div className="space-y-4">
      {/* Color Picker Section */}
      <div className="border border-border rounded-lg p-2.5 bg-muted/30">
        <div className="flex items-center gap-1.5 mb-2">
          <Palette className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Custom Colors</span>
        </div>
        <div className="flex items-center gap-2 mb-1.5">
          <div>
            <Label className="text-[9px] text-muted-foreground">Fill</Label>
            <div className="flex items-center gap-1 mt-0.5">
              <input
                type="color"
                value={customFill}
                onChange={e => setCustomFill(e.target.value)}
                className="w-6 h-6 rounded border border-border cursor-pointer"
              />
              <span className="text-[9px] text-muted-foreground font-mono">{customFill}</span>
            </div>
          </div>
          <div>
            <Label className="text-[9px] text-muted-foreground">Stroke</Label>
            <div className="flex items-center gap-1 mt-0.5">
              <input
                type="color"
                value={customStroke}
                onChange={e => setCustomStroke(e.target.value)}
                className="w-6 h-6 rounded border border-border cursor-pointer"
              />
              <span className="text-[9px] text-muted-foreground font-mono">{customStroke}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {quickColors.map(c => (
            <button
              key={c}
              onClick={() => setCustomFill(c)}
              className="w-5 h-5 rounded-sm border border-border hover:scale-110 transition-transform"
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      </div>

      {/* Drag hint */}
      <p className="text-[9px] text-muted-foreground bg-muted/50 rounded px-2 py-1">
        💡 Drag elements onto the canvas, or click to add at center
      </p>

      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Preset Elements</h4>
        {shapeCategories.map(cat => (
          <div key={cat} className="mb-3">
            <p className="text-[10px] text-muted-foreground mb-1.5">{cat}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {stockShapes.filter(s => s.category === cat).map(shape => {
                const previewColor = shape.element.fill && shape.element.fill !== 'transparent'
                  ? shape.element.fill
                  : shape.element.stroke || '#6366f1';
                return (
                  <button
                    key={shape.name}
                    draggable
                    onDragStart={e => handleDragStart(e, shape)}
                    onClick={() => handleAddShape(shape, { fill: customFill, stroke: customStroke })}
                    className="flex items-center gap-1.5 text-left border border-border rounded-md px-2 py-1.5 hover:border-primary hover:bg-muted/50 transition-all text-xs text-foreground cursor-grab active:cursor-grabbing"
                  >
                    <span
                      className="w-3 h-3 rounded-sm shrink-0 border border-border"
                      style={{ backgroundColor: previewColor }}
                    />
                    <span className="truncate">{shape.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Icons</h4>
        <p className="text-[10px] text-muted-foreground mb-3">Click or drag to add as styled text</p>
        {iconCategories.map(cat => (
          <div key={cat.name} className="mb-3">
            <p className="text-[10px] text-muted-foreground mb-1.5">{cat.name}</p>
            <div className="grid grid-cols-4 gap-1">
              {cat.icons.map(({ name, Icon }) => (
                <button
                  key={name}
                  draggable
                  onDragStart={e => handleIconDragStart(e, name)}
                  onClick={() => handleAddIcon(name)}
                  className="flex flex-col items-center gap-0.5 p-2 rounded-md border border-border hover:border-primary hover:bg-muted/50 transition-all text-muted-foreground hover:text-primary cursor-grab active:cursor-grabbing"
                  title={name}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[8px] leading-none truncate w-full text-center">{name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockElements;
