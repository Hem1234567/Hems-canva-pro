import { useState } from 'react';
import { Type, BarChart3, QrCode, Square, Circle, Minus, Image, Upload, Variable, LayoutTemplate, Hash } from 'lucide-react';
import { useEditor } from '@/contexts/EditorContext';
import { ElementType } from '@/types/editor';
import { cn } from '@/lib/utils';
import { templates, instantiateTemplate } from '@/data/templates';
import SerialGenerator from './SerialGenerator';
import ImageUploader from './ImageUploader';

const tabs = [
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'barcode', label: 'Barcode', icon: BarChart3 },
  { id: 'qrcode', label: 'QR Code', icon: QrCode },
  { id: 'shapes', label: 'Shapes', icon: Square },
  { id: 'images', label: 'Images', icon: Image },
  { id: 'serials', label: 'Serials', icon: Hash },
  { id: 'variables', label: 'Variables', icon: Variable },
] as const;

type TabId = typeof tabs[number]['id'];

const LeftSidebar = () => {
  const [activeTab, setActiveTab] = useState<TabId>('text');
  const { addElement, loadElements } = useEditor();

  const handleAdd = (type: ElementType) => addElement(type);
  const handleLoadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      loadElements(instantiateTemplate(template));
    }
  };

  return (
    <aside className="w-[280px] bg-surface border-r border-border flex shrink-0 h-full">
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
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => handleLoadTemplate(t.id)}
                className="w-full text-left border border-border rounded-lg p-3 hover:border-primary cursor-pointer transition-colors"
              >
                <div className="w-full h-20 bg-muted rounded mb-2 flex items-center justify-center text-muted-foreground text-xs">
                  {t.name}
                </div>
                <p className="text-xs font-medium">{t.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t.description}</p>
              </button>
            ))}
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

        {activeTab === 'images' && <ImageUploader />}

        {activeTab === 'serials' && (
          <SerialGenerator onGenerate={(serials) => {
            console.log('Generated serials:', serials.length);
          }} />
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
