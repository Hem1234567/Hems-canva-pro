import { useState } from 'react';
import { Type, BarChart3, QrCode, Square, Circle, Minus, Image, Hash, Variable, LayoutTemplate, Layers } from 'lucide-react';
import { useEditor } from '@/contexts/EditorContext';
import { ElementType } from '@/types/editor';
import { cn } from '@/lib/utils';
import { templates, instantiateTemplate } from '@/data/templates';
import SerialGenerator from './SerialGenerator';
import ImageUploader from './ImageUploader';
import StockElements from './StockElements';
import { useIsMobile } from '@/hooks/use-mobile';

const tabs = [
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'barcode', label: 'Barcode', icon: BarChart3 },
  { id: 'qrcode', label: 'QR', icon: QrCode },
  { id: 'shapes', label: 'Shapes', icon: Square },
  { id: 'elements', label: 'Elements', icon: Layers },
  { id: 'images', label: 'Images', icon: Image },
  { id: 'serials', label: 'Serials', icon: Hash },
  { id: 'variables', label: 'Variables', icon: Variable },
] as const;

type TabId = typeof tabs[number]['id'];

const templateCategoryLabels: Record<string, string> = {
  'label': 'Labels & Stickers',
  'id-card': 'ID Cards',
  'presentation': 'Presentations',
  'social-media': 'Social Media',
  'poster': 'Posters & Flyers',
  'business-card': 'Business Cards',
  'web-banner': 'Web & Banners',
};

const LeftSidebar = () => {
  const [activeTab, setActiveTab] = useState<TabId>('templates');
  const { addElement, loadElements, setCanvasSize, zoomToFit, setTemplateCategory, templateCategory } = useEditor();
  const isMobile = useIsMobile();

  const handleAdd = (type: ElementType) => addElement(type);
  const handleLoadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const tW = template.canvasWidth || 400;
      const tH = template.canvasHeight || 300;
      setCanvasSize(tW, tH);
      setTemplateCategory(template.category);
      const pixelW = tW * 3;
      const pixelH = tH * 3;
      const offsetX = (pixelW - tW) / 2;
      const offsetY = (pixelH - tH) / 2;
      const els = instantiateTemplate(template).map(el => ({
        ...el,
        x: el.x + offsetX,
        y: el.y + offsetY,
      }));
      loadElements(els);
      // Auto zoom-to-fit after template load
      setTimeout(() => zoomToFit(), 100);
    }
  };

  const templatesByCategory = templates.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, typeof templates>);

  // Mobile: bottom bar with horizontal tabs + expandable content
  if (isMobile) {
    return (
      <MobileBottomBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleAdd={handleAdd}
        handleLoadTemplate={handleLoadTemplate}
        templatesByCategory={templatesByCategory}
        templateCategory={templateCategory}
      />
    );
  }

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
        <TabContent
          activeTab={activeTab}
          handleAdd={handleAdd}
          handleLoadTemplate={handleLoadTemplate}
          templatesByCategory={templatesByCategory}
          templateCategory={templateCategory}
        />
      </div>
    </aside>
  );
};

// Variable definitions per template category
const categoryVariables: Record<string, { group: string; vars: string[] }[]> = {
  'label': [
    { group: 'Label Variables', vars: ['{{serial}}', '{{date}}', '{{batch}}', '{{prefix}}', '{{name}}'] },
  ],
  'id-card': [
    { group: 'ID Card Variables', vars: ['{{name}}', '{{designation}}', '{{empId}}', '{{department}}'] },
    { group: 'Code Variables', vars: ['{{serial}}', '{{date}}'] },
  ],
  'business-card': [
    { group: 'Contact Variables', vars: ['{{name}}', '{{designation}}', '{{department}}', '{{serial}}'] },
  ],
  'presentation': [
    { group: 'Presentation Variables', vars: ['{{date}}', '{{name}}'] },
  ],
  'social-media': [
    { group: 'Social Variables', vars: ['{{name}}', '{{date}}'] },
  ],
  'poster': [
    { group: 'Poster Variables', vars: ['{{name}}', '{{date}}', '{{serial}}'] },
  ],
  'web-banner': [
    { group: 'Banner Variables', vars: ['{{name}}', '{{date}}', '{{serial}}'] },
  ],
};

const defaultVariables = [
  { group: 'Label Variables', vars: ['{{serial}}', '{{date}}', '{{batch}}', '{{prefix}}'] },
  { group: 'ID Card Variables', vars: ['{{name}}', '{{designation}}', '{{empId}}', '{{department}}'] },
];

// Shared tab content renderer
const TabContent = ({ activeTab, handleAdd, handleLoadTemplate, templatesByCategory, templateCategory }: {
  activeTab: TabId;
  handleAdd: (type: ElementType) => void;
  handleLoadTemplate: (id: string) => void;
  templatesByCategory: Record<string, typeof templates>;
  templateCategory: string | null;
}) => (
  <>
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

    {activeTab === 'elements' && <StockElements />}

    {activeTab === 'templates' && (
      <div className="space-y-4">
        {Object.entries(templatesByCategory).map(([cat, tmpls]) => (
          <div key={cat}>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {templateCategoryLabels[cat] || cat}
            </h4>
            <div className="space-y-2">
              {tmpls.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleLoadTemplate(t.id)}
                  className="w-full text-left border border-border rounded-lg p-3 hover:border-primary cursor-pointer transition-colors"
                >
                  <div className="w-full h-16 bg-muted rounded mb-2 flex items-center justify-center text-muted-foreground text-xs">
                    {t.canvasWidth && t.canvasHeight ? `${t.canvasWidth}×${t.canvasHeight}` : t.name}
                  </div>
                  <p className="text-xs font-medium">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t.description}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    )}

    {activeTab === 'variables' && (
      <div className="space-y-3">
        {(categoryVariables[templateCategory || ''] || defaultVariables).map(group => (
          <div key={group.group}>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{group.group}</h4>
            <div className="space-y-1.5">
              {group.vars.map(v => (
                <div key={v} className="border border-border rounded px-3 py-2 text-sm font-mono bg-card hover:border-primary cursor-pointer transition-colors">
                  {v}
                </div>
              ))}
            </div>
          </div>
        ))}
        {templateCategory && (
          <p className="text-[10px] text-muted-foreground italic mt-2">
            Showing variables for: {templateCategoryLabels[templateCategory] || templateCategory}
          </p>
        )}
      </div>
    )}

    {activeTab === 'images' && <ImageUploader />}

    {activeTab === 'serials' && (
      <SerialGenerator onGenerate={(serials) => {
        console.log('Generated serials:', serials.length);
      }} />
    )}
  </>
);

// Mobile Bottom Bar Component
const MobileBottomBar = ({ activeTab, setActiveTab, handleAdd, handleLoadTemplate, templatesByCategory, templateCategory }: {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  handleAdd: (type: ElementType) => void;
  handleLoadTemplate: (id: string) => void;
  templatesByCategory: Record<string, typeof templates>;
  templateCategory: string | null;
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border flex flex-col">
      {/* Expanded content panel */}
      {expanded && (
        <div className="max-h-[50vh] overflow-y-auto p-3 border-b border-border bg-card">
          <TabContent
            activeTab={activeTab}
            handleAdd={handleAdd}
            handleLoadTemplate={handleLoadTemplate}
            templatesByCategory={templatesByCategory}
            templateCategory={templateCategory}
          />
        </div>
      )}

      {/* Horizontal tab bar */}
      <div className="flex items-center gap-0.5 px-1 py-1.5 overflow-x-auto scrollbar-none">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              if (activeTab === tab.id && expanded) {
                setExpanded(false);
              } else {
                setActiveTab(tab.id);
                setExpanded(true);
              }
            }}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md transition-colors shrink-0",
              activeTab === tab.id && expanded
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground"
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span className="text-[9px] leading-none">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
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
