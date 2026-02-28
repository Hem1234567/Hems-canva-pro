import { useEffect, useRef } from 'react';
import { Group, Image as KonvaImage, Text, Rect } from 'react-konva';
import Konva from 'konva';
import JsBarcode from 'jsbarcode';
import { CanvasElement } from '@/types/editor';

interface BarcodeRendererProps {
  element: CanvasElement;
  commonProps: Record<string, any>;
}

const BarcodeRenderer = ({ element: el, commonProps }: BarcodeRendererProps) => {
  const imageRef = useRef<Konva.Image>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;

    try {
      JsBarcode(canvas, el.text || '123456789', {
        format: el.barcodeFormat || 'CODE128',
        width: 2,
        height: Math.max(30, el.height - 20),
        displayValue: false,
        margin: 2,
        background: '#FFFFFF',
        lineColor: el.fill || '#000000',
      });

      const img = new window.Image();
      img.onload = () => {
        if (imageRef.current) {
          imageRef.current.image(img);
          imageRef.current.getLayer()?.batchDraw();
        }
      };
      img.src = canvas.toDataURL();
    } catch {
      // Fallback for invalid barcode data
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = el.width;
        canvas.height = el.height;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#999999';
        ctx.font = '10px monospace';
        ctx.fillText('Invalid barcode', 4, canvas.height / 2);
        const img = new window.Image();
        img.onload = () => {
          if (imageRef.current) {
            imageRef.current.image(img);
            imageRef.current.getLayer()?.batchDraw();
          }
        };
        img.src = canvas.toDataURL();
      }
    }
  }, [el.text, el.barcodeFormat, el.fill, el.width, el.height]);

  return (
    <Group {...commonProps}>
      <Rect width={el.width} height={el.height} fill="transparent" listening={true} />
      <KonvaImage
        ref={imageRef}
        image={undefined as any}
        width={el.width}
        height={el.height - 14}
        listening={false}
      />
      <Text
        text={el.text || '{{serial}}'}
        fontSize={9}
        y={el.height - 13}
        x={4}
        fill={el.fill}
        fontFamily="monospace"
        listening={false}
      />
    </Group>
  );
};

export default BarcodeRenderer;
