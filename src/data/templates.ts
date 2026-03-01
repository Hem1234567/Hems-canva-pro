import { CanvasElement } from '@/types/editor';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'label' | 'id-card';
  canvasWidth?: number;
  canvasHeight?: number;
  elements: Omit<CanvasElement, 'id'>[];
}

const genId = () => `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const templates: Template[] = [
  {
    id: 'product-label',
    name: 'Basic Product Label',
    description: 'Simple product label with name and barcode',
    category: 'label',
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
    category: 'label',
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
  // ========== ID CARD TEMPLATES ==========
  {
    id: 'employee-id-card',
    name: 'Employee ID Card',
    description: 'Professional employee ID with photo, name, and designation',
    category: 'id-card',
    canvasWidth: 324,  // CR80: 85.6mm × 54mm at ~3.78px/mm
    canvasHeight: 204,
    elements: [
      // Background
      {
        type: 'rect', x: 0, y: 0, width: 324, height: 204, rotation: 0,
        fill: '#1a365d', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 0,
      },
      // Header bar
      {
        type: 'rect', x: 0, y: 0, width: 324, height: 50, rotation: 0,
        fill: '#2b6cb0', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 1,
      },
      // Company name
      {
        type: 'text', x: 15, y: 10, width: 200, height: 30, rotation: 0,
        fill: '#FFFFFF', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 2,
        text: 'COMPANY NAME', fontSize: 16, fontFamily: 'Inter', fontStyle: 'bold', align: 'left', letterSpacing: 2,
      },
      // Logo placeholder
      {
        type: 'image', x: 260, y: 8, width: 35, height: 35, rotation: 0,
        fill: 'transparent', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 3,
        src: '',
      },
      // Photo placeholder
      {
        type: 'rect', x: 15, y: 60, width: 75, height: 90, rotation: 0,
        fill: '#e2e8f0', stroke: '#FFFFFF', strokeWidth: 2, opacity: 1, zIndex: 4,
        cornerRadius: 4,
      },
      // Photo image slot
      {
        type: 'image', x: 15, y: 60, width: 75, height: 90, rotation: 0,
        fill: 'transparent', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 5,
        src: '',
      },
      // Employee Name
      {
        type: 'text', x: 105, y: 62, width: 200, height: 25, rotation: 0,
        fill: '#FFFFFF', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 6,
        text: '{{name}}', fontSize: 18, fontFamily: 'Inter', fontStyle: 'bold', align: 'left', letterSpacing: 0,
      },
      // Designation
      {
        type: 'text', x: 105, y: 88, width: 200, height: 20, rotation: 0,
        fill: '#bee3f8', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 7,
        text: '{{designation}}', fontSize: 12, fontFamily: 'Inter', fontStyle: 'normal', align: 'left', letterSpacing: 0,
      },
      // Department
      {
        type: 'text', x: 105, y: 108, width: 200, height: 20, rotation: 0,
        fill: '#90cdf4', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 8,
        text: 'Dept: {{department}}', fontSize: 11, fontFamily: 'Inter', fontStyle: 'normal', align: 'left', letterSpacing: 0,
      },
      // Employee ID
      {
        type: 'text', x: 105, y: 128, width: 200, height: 20, rotation: 0,
        fill: '#D4AF37', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 9,
        text: 'ID: {{empId}}', fontSize: 12, fontFamily: 'Inter', fontStyle: 'bold', align: 'left', letterSpacing: 1,
      },
      // Barcode at bottom
      {
        type: 'barcode', x: 15, y: 160, width: 180, height: 35, rotation: 0,
        fill: '#FFFFFF', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 10,
        text: '{{empId}}', barcodeFormat: 'CODE128',
      },
      // QR Code
      {
        type: 'qrcode', x: 260, y: 140, width: 50, height: 50, rotation: 0,
        fill: '#FFFFFF', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 11,
        text: '{{empId}}',
      },
    ],
  },
  {
    id: 'student-id-card',
    name: 'Student ID Card',
    description: 'Student identity card with photo and academic details',
    category: 'id-card',
    canvasWidth: 324,
    canvasHeight: 204,
    elements: [
      // Background
      {
        type: 'rect', x: 0, y: 0, width: 324, height: 204, rotation: 0,
        fill: '#FFFFFF', stroke: '#2d3748', strokeWidth: 2, opacity: 1, zIndex: 0,
      },
      // Top accent stripe
      {
        type: 'rect', x: 0, y: 0, width: 324, height: 8, rotation: 0,
        fill: '#e53e3e', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 1,
      },
      // Institution name
      {
        type: 'text', x: 15, y: 15, width: 294, height: 25, rotation: 0,
        fill: '#1a202c', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 2,
        text: 'INSTITUTION NAME', fontSize: 16, fontFamily: 'Inter', fontStyle: 'bold', align: 'center', letterSpacing: 2,
      },
      // "STUDENT ID" subtitle
      {
        type: 'text', x: 15, y: 38, width: 294, height: 18, rotation: 0,
        fill: '#e53e3e', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 3,
        text: 'STUDENT IDENTITY CARD', fontSize: 10, fontFamily: 'Inter', fontStyle: 'bold', align: 'center', letterSpacing: 3,
      },
      // Divider
      {
        type: 'line', x: 15, y: 55, width: 294, height: 2, rotation: 0,
        fill: '#e2e8f0', stroke: 'transparent', strokeWidth: 1, opacity: 1, zIndex: 4,
      },
      // Photo placeholder
      {
        type: 'rect', x: 15, y: 65, width: 70, height: 85, rotation: 0,
        fill: '#f7fafc', stroke: '#cbd5e0', strokeWidth: 1, opacity: 1, zIndex: 5,
        cornerRadius: 4,
      },
      {
        type: 'image', x: 15, y: 65, width: 70, height: 85, rotation: 0,
        fill: 'transparent', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 6,
        src: '',
      },
      // Student Name
      {
        type: 'text', x: 100, y: 65, width: 210, height: 22, rotation: 0,
        fill: '#1a202c', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 7,
        text: '{{name}}', fontSize: 16, fontFamily: 'Inter', fontStyle: 'bold', align: 'left', letterSpacing: 0,
      },
      // Roll / Student ID
      {
        type: 'text', x: 100, y: 90, width: 210, height: 18, rotation: 0,
        fill: '#4a5568', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 8,
        text: 'Roll No: {{empId}}', fontSize: 11, fontFamily: 'Inter', fontStyle: 'normal', align: 'left', letterSpacing: 0,
      },
      // Department
      {
        type: 'text', x: 100, y: 110, width: 210, height: 18, rotation: 0,
        fill: '#4a5568', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 9,
        text: 'Dept: {{department}}', fontSize: 11, fontFamily: 'Inter', fontStyle: 'normal', align: 'left', letterSpacing: 0,
      },
      // Validity
      {
        type: 'text', x: 100, y: 130, width: 210, height: 18, rotation: 0,
        fill: '#718096', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 10,
        text: 'Valid: {{date}}', fontSize: 10, fontFamily: 'Inter', fontStyle: 'normal', align: 'left', letterSpacing: 0,
      },
      // Barcode
      {
        type: 'barcode', x: 15, y: 160, width: 170, height: 35, rotation: 0,
        fill: '#000000', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 11,
        text: '{{empId}}', barcodeFormat: 'CODE128',
      },
      // QR
      {
        type: 'qrcode', x: 260, y: 148, width: 48, height: 48, rotation: 0,
        fill: '#000000', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 12,
        text: '{{empId}}',
      },
    ],
  },
  {
    id: 'visitor-id-card',
    name: 'Visitor Pass',
    description: 'Temporary visitor badge with QR code',
    category: 'id-card',
    canvasWidth: 324,
    canvasHeight: 204,
    elements: [
      // Background
      {
        type: 'rect', x: 0, y: 0, width: 324, height: 204, rotation: 0,
        fill: '#FFFFFF', stroke: '#D4AF37', strokeWidth: 3, opacity: 1, zIndex: 0,
      },
      // VISITOR banner
      {
        type: 'rect', x: 0, y: 0, width: 324, height: 45, rotation: 0,
        fill: '#D4AF37', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 1,
      },
      {
        type: 'text', x: 15, y: 10, width: 294, height: 28, rotation: 0,
        fill: '#FFFFFF', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 2,
        text: 'VISITOR', fontSize: 22, fontFamily: 'Inter', fontStyle: 'bold', align: 'center', letterSpacing: 6,
      },
      // Name
      {
        type: 'text', x: 15, y: 58, width: 294, height: 25, rotation: 0,
        fill: '#1a202c', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 3,
        text: '{{name}}', fontSize: 20, fontFamily: 'Inter', fontStyle: 'bold', align: 'center', letterSpacing: 0,
      },
      // Visiting
      {
        type: 'text', x: 15, y: 88, width: 294, height: 20, rotation: 0,
        fill: '#4a5568', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 4,
        text: 'Visiting: {{department}}', fontSize: 12, fontFamily: 'Inter', fontStyle: 'normal', align: 'center', letterSpacing: 0,
      },
      // Date
      {
        type: 'text', x: 15, y: 112, width: 294, height: 18, rotation: 0,
        fill: '#718096', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 5,
        text: 'Date: {{date}}', fontSize: 11, fontFamily: 'Inter', fontStyle: 'normal', align: 'center', letterSpacing: 0,
      },
      // Large QR Code
      {
        type: 'qrcode', x: 127, y: 135, width: 60, height: 60, rotation: 0,
        fill: '#000000', stroke: 'transparent', strokeWidth: 0, opacity: 1, zIndex: 6,
        text: '{{serial}}',
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
