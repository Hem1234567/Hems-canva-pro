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
  element: Partial<CanvasElement> & { type: CanvasElement['type'] };
}

const stockShapes: StockShape[] = [
  { name: 'Rounded Card', category: 'Cards', element: { type: 'rect', width: 200, height: 120, fill: '#f1f5f9', stroke: '#e2e8f0', strokeWidth: 1, opacity: 1, cornerRadius: 12 } },
  { name: 'Accent Bar', category: 'Cards', element: { type: 'rect', width: 4, height: 60, fill: '#6366f1', stroke: 'transparent', strokeWidth: 0, opacity: 1, cornerRadius: 2 } },
  { name: 'Pill Button', category: 'Cards', element: { type: 'rect', width: 160, height: 44, fill: '#6366f1', stroke: 'transparent', strokeWidth: 0, opacity: 1, cornerRadius: 22 } },
  { name: 'Badge', category: 'Cards', element: { type: 'rect', width: 80, height: 28, fill: '#dbeafe', stroke: 'transparent', strokeWidth: 0, opacity: 1, cornerRadius: 14 } },
  { name: 'Divider', category: 'Lines', element: { type: 'line', width: 300, height: 1, fill: '#e2e8f0', strokeWidth: 1, opacity: 1 } },
  { name: 'Thick Divider', category: 'Lines', element: { type: 'line', width: 200, height: 4, fill: '#6366f1', strokeWidth: 4, opacity: 1 } },
  { name: 'Circle Dot', category: 'Shapes', element: { type: 'circle', width: 16, height: 16, fill: '#6366f1', stroke: 'transparent', strokeWidth: 0, opacity: 1 } },
  { name: 'Large Circle', category: 'Shapes', element: { type: 'circle', width: 120, height: 120, fill: '#f1f5f9', stroke: '#e2e8f0', strokeWidth: 1, opacity: 1 } },
  { name: 'Square Frame', category: 'Shapes', element: { type: 'rect', width: 100, height: 100, fill: 'transparent', stroke: '#000000', strokeWidth: 2, opacity: 1 } },
  { name: 'Overlay', category: 'Shapes', element: { type: 'rect', width: 400, height: 300, fill: '#000000', stroke: 'transparent', strokeWidth: 0, opacity: 0.5 } },
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
  const { addCustomElement } = useEditor();

  const handleAddShape = (shape: StockShape) => {
    addCustomElement(shape.element as any);
    toast.success(`Added ${shape.name}`);
  };

  const handleAddIcon = (iconName: string) => {
    // Add as a text element displaying the icon name as styled text
    addCustomElement({
      type: 'text',
      text: iconName,
      fontSize: 24,
      fontFamily: 'Inter',
      fontStyle: 'bold',
      fill: '#6366f1',
      width: 120,
      height: 40,
    });
    toast.success(`Added ${iconName}`);
  };

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
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Icons</h4>
        <p className="text-[10px] text-muted-foreground mb-3">Click to add as styled text element</p>
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
