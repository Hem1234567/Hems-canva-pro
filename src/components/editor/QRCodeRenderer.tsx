import { useEffect, useRef } from 'react';
import { Group, Image as KonvaImage, Rect } from 'react-konva';
import Konva from 'konva';
import QRCodeStyling from 'qr-code-styling';
import { CanvasElement } from '@/types/editor';

interface QRCodeRendererProps {
  element: CanvasElement;
  commonProps: Record<string, any>;
}

const QRCodeRenderer = ({ element: el, commonProps }: QRCodeRendererProps) => {
  const imageRef = useRef<Konva.Image>(null);

  useEffect(() => {
    let objectUrl = '';
    
    const render = async () => {
      try {
        let data = el.text || 'https://example.com';
        
        if (el.qrType === 'email') {
          const email = el.qrEmail || '';
          const subject = encodeURIComponent(el.qrSubject || '');
          const message = encodeURIComponent(el.qrMessage || '');
          data = `mailto:${email}?subject=${subject}&body=${message}`;
        } else if (el.qrType === 'url') {
          data = el.qrUrl || 'https://example.com';
        } else if (el.qrType === 'phone') {
          data = `tel:${el.qrPhone || ''}`;
        }

        const size = Math.max(el.width, el.height);
        
        const qrCode = new QRCodeStyling({
          width: size,
          height: size,
          type: 'canvas',
          data: data,
          margin: 1,
          dotsOptions: {
            color: el.fill || '#000000',
            type: (el.qrStyle as any) || 'square'
          },
          backgroundOptions: {
            color: el.qrBgColor || '#ffffff'
          }
        });

        const blob = await qrCode.getRawData('png');
        if (!blob) throw new Error('Failed to generate QR');
        
        objectUrl = URL.createObjectURL(blob);

        const img = new window.Image();
        img.onload = () => {
          if (imageRef.current) {
            imageRef.current.image(img);
            imageRef.current.getLayer()?.batchDraw();
          }
        };
        img.src = objectUrl;
      } catch (err) {
        // Fallback
        console.error(err);
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

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [
    el.text, el.fill, el.width, el.height, 
    el.qrType, el.qrEmail, el.qrSubject, el.qrMessage, 
    el.qrUrl, el.qrPhone, el.qrStyle, el.qrBgColor
  ]);

  return (
    <Group {...commonProps}>
      <Rect width={el.width} height={el.height} fill="transparent" listening={true} />
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
