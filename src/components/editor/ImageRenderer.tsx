import { useState, useEffect } from 'react';
import { Image as KonvaImage, Rect, Group } from 'react-konva';
import { CanvasElement } from '@/types/editor';
import Konva from 'konva';

interface ImageRendererProps {
  element: CanvasElement;
  commonProps: any;
}

const ImageRenderer = ({ element, commonProps }: ImageRendererProps) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!element.src) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setImage(img);
    img.onerror = () => setImage(null);
    img.src = element.src;
  }, [element.src]);

  return (
    <Group {...commonProps}>
      <Rect width={element.width} height={element.height} fill={image ? 'transparent' : '#f0f0f0'} stroke="#ccc" strokeWidth={image ? 0 : 1} listening={true} />
      {image && (
        <KonvaImage
          image={image}
          width={element.width}
          height={element.height}
        />
      )}
    </Group>
  );
};

export default ImageRenderer;
