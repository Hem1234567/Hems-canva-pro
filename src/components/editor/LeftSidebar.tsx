import { useState } from 'react';
import { Type, BarChart3, QrCode, Square, Circle, Minus, Image, Upload, Variable, LayoutTemplate } from 'lucide-react';
import { useEditor } from '@/contexts/EditorContext';
import { ElementType } from '@/types/editor';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'barcode', label: 'Barcode', icon: BarChart3 },
  { id: 'qrcode', label: 'QR Code', icon: QrCode },
  { id: 'shapes', label: 'Shapes', icon: Square },
  { id: 'images', label: 'Images', icon: Image },
  { id: 'variables', label: 'Variables', icon: Variable },
  { id: 'uploads', label: 'Uploads', icon: Upload },
] as const;

type TabId = typeof tabs[number]['id'];

const LeftSidebar = () => {
  const [activeTab, setActiveTab] = useState<TabId>('text');
  const { addElement } = useEditor();

  const handleAdd = (type: ElementType) => addElement(type);

  return (
    <aside className="w-[280px] bg-surface border-r border-border flex shrink-0 h-full">
      {/* Tab icons */}
      <div className="w-14 border-r border-border bg-card flex flex-col items-center py-3 gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "w-10 h-10 rounded-md flex flex-col items-center justify-center gap-0.5 transition-colors text-muted-foreground hover:text-foreground hover:bg-muted",
              activeTab === tab.id && "bg-muted text-primary"
            )}
            title={tab.label}
          >
            <tab.icon className="w-4 h-4" />
            <span className="text-[9px] leading-none">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {tabs.find(t => t.id === activeTab)?.label}
        </h3>

        {activeTab === 'text' && (
          <div className="space-y-2">
            <ToolButton label="Add Heading" onClick={() => handleAdd('text')} description="Large label text" />
            <ToolButton label="Add Body Text" onClick={() => handleAdd('text')} description="Smaller body text" />
            <ToolButton label="Serial Text {{serial}}" onClick={() => handleAdd('text')} description="Dynamic serial variable" />
          </div>
        )}

        {activeTab === 'barcode' && (
          <div className="space-y-2">
            <ToolButton label="CODE128 Barcode" onClick={() => handleAdd('barcode')} description="Standard linear barcode" />
            <ToolButton label="CODE39 Barcode" onClick={() => handleAdd('barcode')} description="Alphanumeric barcode" />
            <ToolButton label="EAN13 Barcode" onClick={() => handleAdd('barcode')} description="Retail product barcode" />
          </div>
        )}

        {activeTab === 'qrcode' && (
          <div className="space-y-2">
            <ToolButton label="QR Code" onClick={() => handleAdd('qrcode')} description="2D matrix barcode" />
            <ToolButton label="Serial QR Code" onClick={() => handleAdd('qrcode')} description="Bound to {{serial}}" />
          </div>
        )}

        {activeTab === 'shapes' && (
          <div className="grid grid-cols-3 gap-2">
            <ShapeButton icon={<Square className="w-6 h-6" />} label="Rectangle" onClick={() => handleAdd('rect')} />
            <ShapeButton icon={<Circle className="w-6 h-6" />} label="Circle" onClick={() => handleAdd('circle')} />
            <ShapeButton icon={<Minus className="w-6 h-6" />} label="Line" onClick={() => handleAdd('line')} />
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-3">
            <div className="border border-border rounded-lg p-3 hover:border-primary cursor-pointer transition-colors">
              <div className="w-full h-20 bg-muted rounded mb-2 flex items-center justify-center text-muted-foreground text-xs">
                Product Label
              </div>
              <p className="text-xs font-medium">Basic Product Label</p>
            </div>
            <div className="border border-border rounded-lg p-3 hover:border-primary cursor-pointer transition-colors">
              <div className="w-full h-20 bg-muted rounded mb-2 flex items-center justify-center text-muted-foreground text-xs">
                Serial Sticker
              </div>
              <p className="text-xs font-medium">Serial Number Sticker</p>
            </div>
          </div>
        )}

        {activeTab === 'variables' && (
          <div className="space-y-2">
            {['{{serial}}', '{{date}}', '{{batch}}', '{{prefix}}'].map(v => (
              <div key={v} className="border border-border rounded px-3 py-2 text-sm font-mono bg-card hover:border-primary cursor-pointer transition-colors">
                {v}
              </div>
            ))}
          </div>
        )}

        {(activeTab === 'images' || activeTab === 'uploads') && (
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground text-sm">
            <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Drag & drop or click to upload</p>
          </div>
        )}
      </div>
    </aside>
  );
};

const ToolButton = ({ label, onClick, description }: { label: string; onClick: () => void; description: string }) => (
  <button
    onClick={onClick}
    className="w-full text-left border border-border rounded-lg px-3 py-2.5 hover:border-primary hover:bg-muted/50 transition-all group"
  >
    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{label}</span>
    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
  </button>
);

const ShapeButton = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-1 border border-border rounded-lg p-3 hover:border-primary hover:bg-muted/50 transition-all text-muted-foreground hover:text-primary"
  >
    {icon}
    <span className="text-[10px]">{label}</span>
  </button>
);

export default LeftSidebar;
