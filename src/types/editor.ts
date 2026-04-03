export type ElementType = 'text' | 'rect' | 'circle' | 'line' | 'barcode' | 'qrcode' | 'image';

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  text?: string;
  fontSize?: number;
  fontStyle?: string;
  fontFamily?: string;
  align?: string;
  letterSpacing?: number;
  opacity: number;
  zIndex: number;
  variable?: string;
  barcodeFormat?: string;
  src?: string;
  textDecoration?: string;
  locked?: boolean;
  cornerRadius?: number;
  showText?: boolean;
}

export interface EditorState {
  elements: CanvasElement[];
  selectedId: string | null;
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
  unit: 'mm' | 'inch' | 'px';
  projectName: string;
  history: CanvasElement[][];
  historyIndex: number;
}

export const createDefaultElement = (type: ElementType, x = 100, y = 100): CanvasElement => {
  const base = {
    id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    x,
    y,
    width: 120,
    height: 40,
    rotation: 0,
    fill: '#000000',
    stroke: 'transparent',
    strokeWidth: 0,
    opacity: 1,
    zIndex: 0,
  };

  switch (type) {
    case 'text':
      return { ...base, text: 'Label Text', fontSize: 18, fontFamily: 'Inter', fontStyle: 'normal', align: 'left', letterSpacing: 0, fill: '#000000' };
    case 'rect':
      return { ...base, width: 100, height: 80, fill: '#D4AF37', stroke: '#000000', strokeWidth: 1 };
    case 'circle':
      return { ...base, width: 80, height: 80, fill: '#D4AF37', stroke: '#000000', strokeWidth: 1 };
    case 'line':
      return { ...base, width: 150, height: 2, fill: '#000000', strokeWidth: 2 };
    case 'barcode':
      return { ...base, width: 180, height: 60, text: '{{serial}}', barcodeFormat: 'CODE128', fill: '#000000' };
    case 'qrcode':
      return { ...base, width: 80, height: 80, text: '{{serial}}', fill: '#000000' };
    case 'image':
      return { ...base, width: 150, height: 150, fill: 'transparent', src: '' };
    default:
      return base;
  }
};
