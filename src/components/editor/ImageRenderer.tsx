import { useState, useEffect, useRef } from 'react';
import { Image as KonvaImage } from 'react-konva';
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

  if (!image) {
    // Placeholder rect while loading
    return null;
  }

  return (
    <KonvaImage
      {...commonProps}
      image={image}
      width={element.width}
      height={element.height}
    />
  );
};

export default ImageRenderer;
