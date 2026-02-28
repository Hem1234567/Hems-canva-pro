import { useEffect, useRef } from 'react';
import { Group, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import QRCode from 'qrcode';
import { CanvasElement } from '@/types/editor';

interface QRCodeRendererProps {
  element: CanvasElement;
  commonProps: Record<string, any>;
}

const QRCodeRenderer = ({ element: el, commonProps }: QRCodeRendererProps) => {
  const imageRef = useRef<Konva.Image>(null);

  useEffect(() => {
    const render = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(el.text || 'https://example.com', {
          width: Math.max(el.width, el.height),
          margin: 1,
          color: {
            dark: el.fill || '#000000',
            light: '#FFFFFF',
          },
        });
        const img = new window.Image();
        img.onload = () => {
          if (imageRef.current) {
            imageRef.current.image(img);
            imageRef.current.getLayer()?.batchDraw();
          }
        };
        img.src = dataUrl;
      } catch {
        // Fallback
        const canvas = document.createElement('canvas');
        canvas.width = el.width;
        canvas.height = el.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = '#CCCCCC';
          ctx.strokeRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#999999';
          ctx.font = '10px sans-serif';
          ctx.fillText('QR Error', 4, el.height / 2);
        }
        const img = new window.Image();
        img.onload = () => {
          if (imageRef.current) {
            imageRef.current.image(img);
            imageRef.current.getLayer()?.batchDraw();
          }
        };
        img.src = canvas.toDataURL();
      }
    };
    render();
  }, [el.text, el.fill, el.width, el.height]);

  return (
    <Group {...commonProps}>
      <KonvaImage
        ref={imageRef}
        image={undefined as any}
        width={el.width}
        height={el.height}
        listening={false}
      />
    </Group>
  );
};

export default QRCodeRenderer;
