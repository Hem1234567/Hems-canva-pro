import { CanvasElement } from '@/types/editor';

export interface Template {
  id: string;
  name: string;
  description: string;
  elements: Omit<CanvasElement, 'id'>[];
}

const genId = () => `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const templates: Template[] = [
  {
    id: 'product-label',
    name: 'Basic Product Label',
    description: 'Simple product label with name and barcode',
    elements: [
      {
        type: 'text', x: 40, y: 30, width: 300, height: 40, rotation: 0,
        fill: '#000000', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 0,
        text: 'Product Name', fontSize: 28, fontFamily: 'Inter', fontStyle: 'bold', align: 'left', letterSpacing: 0,
      },
      {
        type: 'text', x: 40, y: 80, width: 250, height: 30, rotation: 0,
        fill: '#444444', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 1,
        text: 'SKU: PRD-001', fontSize: 14, fontFamily: 'Inter', fontStyle: 'normal', align: 'left', letterSpacing: 0,
      },
      {
        type: 'barcode', x: 40, y: 130, width: 200, height: 70, rotation: 0,
        fill: '#000000', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 2,
        text: '{{serial}}', barcodeFormat: 'CODE128',
      },
      {
        type: 'line', x: 40, y: 115, width: 320, height: 2, rotation: 0,
        fill: '#CCCCCC', stroke: 'transparent', strokeWidth: 1, opacity: 1, zIndex: 3,
      },
    ],
  },
  {
    id: 'serial-sticker',
    name: 'Serial Number Sticker',
    description: 'Sticker with serial number, QR code, and date',
    elements: [
      {
        type: 'rect', x: 20, y: 20, width: 360, height: 260, rotation: 0,
        fill: 'transparent', stroke: '#D4AF37', strokeWidth: 2, opacity: 1, zIndex: 0,
      },
      {
        type: 'text', x: 40, y: 35, width: 200, height: 30, rotation: 0,
        fill: '#000000', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 1,
        text: 'SERIAL NO.', fontSize: 12, fontFamily: 'Inter', fontStyle: 'bold', align: 'left', letterSpacing: 2,
      },
      {
        type: 'text', x: 40, y: 60, width: 280, height: 40, rotation: 0,
        fill: '#000000', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 2,
        text: '{{serial}}', fontSize: 24, fontFamily: 'Inter', fontStyle: 'bold', align: 'left', letterSpacing: 1,
      },
      {
        type: 'qrcode', x: 270, y: 110, width: 90, height: 90, rotation: 0,
        fill: '#000000', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 3,
        text: '{{serial}}',
      },
      {
        type: 'text', x: 40, y: 120, width: 200, height: 25, rotation: 0,
        fill: '#666666', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 4,
        text: 'Date: {{date}}', fontSize: 12, fontFamily: 'Inter', fontStyle: 'normal', align: 'left', letterSpacing: 0,
      },
      {
        type: 'text', x: 40, y: 150, width: 200, height: 25, rotation: 0,
        fill: '#666666', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 5,
        text: 'Batch: {{batch}}', fontSize: 12, fontFamily: 'Inter', fontStyle: 'normal', align: 'left', letterSpacing: 0,
      },
    ],
  },
];

export const instantiateTemplate = (template: Template): CanvasElement[] => {
  return template.elements.map((el, i) => ({
    ...el,
    id: `el-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
  }));
};
