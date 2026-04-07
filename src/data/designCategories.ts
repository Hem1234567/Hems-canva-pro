export interface DesignCategory {
  id: string;
  label: string;
  description: string;
  iconName: string; // Lucide icon name
  defaultWidth: number;
  defaultHeight: number;
  presets: { label: string; width: number; height: number }[];
}

export const designCategories: DesignCategory[] = [
  {
    id: 'presentation',
    label: 'Presentation',
    description: 'Slides & pitch decks',
    iconName: 'Presentation',
    defaultWidth: 1920,
    defaultHeight: 1080,
    presets: [
      { label: 'Widescreen (16:9)', width: 1920, height: 1080 },
      { label: 'Standard (4:3)', width: 1024, height: 768 },
    ],
  },
  {
    id: 'social-media',
    label: 'Social Media',
    description: 'Posts, stories & thumbnails',
    iconName: 'Smartphone',
    defaultWidth: 1080,
    defaultHeight: 1080,
    presets: [
      { label: 'Instagram Post', width: 1080, height: 1080 },
      { label: 'Instagram Story', width: 1080, height: 1920 },
      { label: 'Facebook Post', width: 1200, height: 630 },
      { label: 'YouTube Thumbnail', width: 1280, height: 720 },
      { label: 'Twitter/X Post', width: 1600, height: 900 },
      { label: 'LinkedIn Post', width: 1200, height: 627 },
    ],
  },
  {
    id: 'poster',
    label: 'Poster & Flyer',
    description: 'Posters, flyers & brochures',
    iconName: 'Image',
    defaultWidth: 595,
    defaultHeight: 842,
    presets: [
      { label: 'A4 Portrait', width: 595, height: 842 },
      { label: 'A4 Landscape', width: 842, height: 595 },
      { label: 'A3 Portrait', width: 842, height: 1191 },
      { label: 'US Letter', width: 612, height: 792 },
      { label: 'Flyer (5.5×8.5")', width: 396, height: 612 },
    ],
  },
  {
    id: 'business-card',
    label: 'Business Card',
    description: 'Cards & letterheads',
    iconName: 'CreditCard',
    defaultWidth: 324,
    defaultHeight: 204,
    presets: [
      { label: 'Standard (3.5×2")', width: 324, height: 204 },
      { label: 'European (85×55mm)', width: 324, height: 210 },
      { label: 'Square', width: 250, height: 250 },
      { label: 'Letterhead A4', width: 595, height: 842 },
      { label: 'Invoice', width: 595, height: 842 },
    ],
  },
  {
    id: 'label',
    label: 'Labels & Stickers',
    description: 'Barcodes, QR codes & serials',
    iconName: 'Tag',
    defaultWidth: 400,
    defaultHeight: 300,
    presets: [
      { label: 'Standard Label', width: 400, height: 300 },
      { label: 'Small Sticker', width: 200, height: 150 },
      { label: 'Large Sticker', width: 600, height: 400 },
    ],
  },
  {
    id: 'barcode-generator',
    label: 'Barcode Generator',
    description: 'Create sequences of barcodes',
    iconName: 'Tag',
    defaultWidth: 400,
    defaultHeight: 300,
    presets: [
      { label: 'Standard Barcode', width: 400, height: 300 }
    ],
  },
  {
    id: 'qr-generator',
    label: 'QR Generator',
    description: 'Custom QR codes with styles',
    iconName: 'QrCode',
    defaultWidth: 400,
    defaultHeight: 400,
    presets: [
      { label: 'QR Code', width: 400, height: 400 }
    ],
  },
  {
    id: 'organize-pages',
    label: 'Organize Pages',
    description: 'Reorder & export image pages',
    iconName: 'LayoutGrid',
    defaultWidth: 800,
    defaultHeight: 600,
    presets: [
      { label: 'Default', width: 800, height: 600 }
    ],
  },
  {
    id: 'bg-remover',
    label: 'BG Remover',
    description: 'AI background removal tool',
    iconName: 'Wand2',
    defaultWidth: 800,
    defaultHeight: 600,
    presets: [
      { label: 'Default', width: 800, height: 600 }
    ],
  },
  {
    id: 'id-card',
    label: 'ID Cards',
    description: 'Employee, student & visitor',
    iconName: 'BadgeCheck',
    defaultWidth: 324,
    defaultHeight: 204,
    presets: [
      { label: 'CR80 Card', width: 324, height: 204 },
      { label: 'CR80 Landscape', width: 204, height: 324 },
    ],
  },
  {
    id: 'web-banner',
    label: 'Web & Banner',
    description: 'Website banners & ads',
    iconName: 'Globe',
    defaultWidth: 1200,
    defaultHeight: 628,
    presets: [
      { label: 'Website Banner', width: 1200, height: 628 },
      { label: 'Leaderboard (728×90)', width: 728, height: 90 },
      { label: 'Rectangle Ad (300×250)', width: 300, height: 250 },
      { label: 'Email Header', width: 600, height: 200 },
    ],
  },
  {
    id: 'custom',
    label: 'Custom Size',
    description: 'Start with any dimensions',
    iconName: 'PenTool',
    defaultWidth: 800,
    defaultHeight: 600,
    presets: [],
  },
];
