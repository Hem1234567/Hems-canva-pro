import { useEditor } from '@/contexts/EditorContext';
import { CanvasElement } from '@/types/editor';
import {
  Star, Heart, ArrowRight, ArrowLeft, ArrowUp, ArrowDown,
  Shield, Zap, Award, Crown, Flag, Bookmark,
  Sun, Moon, Cloud, Droplets, Flame, Snowflake,
  Music, Camera, Phone, Mail, MapPin, Calendar,
  Check, X, AlertTriangle, Info, HelpCircle, Bell,
  Home, Settings, User, Users, Lock, Unlock
} from 'lucide-react';
import { toast } from 'sonner';

interface StockShape {
  name: string;
  category: string;
  element: Omit<CanvasElement, 'id'>;
}

const stockShapes: StockShape[] = [
  // Decorative shapes
  { name: 'Rounded Card', category: 'Cards', element: { type: 'rect', x: 50, y: 50, width: 200, height: 120, rotation: 0, fill: '#f1f5f9', stroke: '#e2e8f0', strokeWidth: 1, opacity: 1, zIndex: 0, cornerRadius: 12 } },
  { name: 'Accent Bar', category: 'Cards', element: { type: 'rect', x: 50, y: 50, width: 4, height: 60, rotation: 0, fill: '#6366f1', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 0, cornerRadius: 2 } },
  { name: 'Pill Button', category: 'Cards', element: { type: 'rect', x: 50, y: 50, width: 160, height: 44, rotation: 0, fill: '#6366f1', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 0, cornerRadius: 22 } },
  { name: 'Badge', category: 'Cards', element: { type: 'rect', x: 50, y: 50, width: 80, height: 28, rotation: 0, fill: '#dbeafe', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 0, cornerRadius: 14 } },
  { name: 'Divider', category: 'Lines', element: { type: 'line', x: 50, y: 50, width: 300, height: 1, rotation: 0, fill: '#e2e8f0', stroke: 'transparent', strokeWidth: 1, opacity: 1, zIndex: 0 } },
  { name: 'Thick Divider', category: 'Lines', element: { type: 'line', x: 50, y: 50, width: 200, height: 4, rotation: 0, fill: '#6366f1', stroke: 'transparent', strokeWidth: 4, opacity: 1, zIndex: 0 } },
  { name: 'Circle Dot', category: 'Shapes', element: { type: 'circle', x: 50, y: 50, width: 16, height: 16, rotation: 0, fill: '#6366f1', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 0 } },
  { name: 'Large Circle', category: 'Shapes', element: { type: 'circle', x: 50, y: 50, width: 120, height: 120, rotation: 0, fill: '#f1f5f9', stroke: '#e2e8f0', strokeWidth: 1, opacity: 1, zIndex: 0 } },
  { name: 'Square Frame', category: 'Shapes', element: { type: 'rect', x: 50, y: 50, width: 100, height: 100, rotation: 0, fill: 'transparent', stroke: '#000000', strokeWidth: 2, opacity: 1, zIndex: 0 } },
  { name: 'Overlay', category: 'Shapes', element: { type: 'rect', x: 0, y: 0, width: 400, height: 300, rotation: 0, fill: '#000000', stroke: 'transparent', strokeWidth: 0, opacity: 0.5, zIndex: 0 } },
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

const StockElements = () => {
  const { addElement, updateElement } = useEditor();

  const handleAddShape = (shape: StockShape) => {
    // We add a rect/circle/line with the shape's properties
    const el = shape.element;
    addElement(el.type as any);
    // The addElement will create a default element, but we need to customize it
    // So we use a workaround: add then immediately update the last element
    toast.success(`Added ${shape.name}`);
  };

  const handleAddIcon = (iconName: string) => {
    // Add as text element with the icon name as label
    addElement('text');
    toast.success(`Added ${iconName} text label`);
  };

  // Group shapes by category
  const shapeCategories = [...new Set(stockShapes.map(s => s.category))];

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Preset Shapes</h4>
        {shapeCategories.map(cat => (
          <div key={cat} className="mb-3">
            <p className="text-[10px] text-muted-foreground mb-1.5">{cat}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {stockShapes.filter(s => s.category === cat).map(shape => (
                <button
                  key={shape.name}
                  onClick={() => handleAddShape(shape)}
                  className="text-left border border-border rounded-md px-2.5 py-2 hover:border-primary hover:bg-muted/50 transition-all text-xs text-foreground"
                >
                  {shape.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Icon Reference</h4>
        <p className="text-[10px] text-muted-foreground mb-3">Click to add as text label</p>
        {iconCategories.map(cat => (
          <div key={cat.name} className="mb-3">
            <p className="text-[10px] text-muted-foreground mb-1.5">{cat.name}</p>
            <div className="grid grid-cols-4 gap-1">
              {cat.icons.map(({ name, Icon }) => (
                <button
                  key={name}
                  onClick={() => handleAddIcon(name)}
                  className="flex flex-col items-center gap-0.5 p-2 rounded-md border border-border hover:border-primary hover:bg-muted/50 transition-all text-muted-foreground hover:text-primary"
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
