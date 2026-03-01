import { useState, useEffect, useRef } from 'react';
import { Image as KonvaImage, Rect, Group, Text } from 'react-konva';
import { CanvasElement } from '@/types/editor';
import Konva from 'konva';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEditor } from '@/contexts/EditorContext';
import { toast } from 'sonner';

interface ImageRendererProps {
  element: CanvasElement;
  commonProps: any;
}

const ImageRenderer = ({ element, commonProps }: ImageRendererProps) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const { user } = useAuth();
  const { updateElement } = useEditor();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!element.src) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setImage(img);
    img.onerror = () => setImage(null);
    img.src = element.src;
  }, [element.src]);

  // Create a hidden file input once
  useEffect(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file || !user) return;
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('user-uploads').upload(path, file);
      if (error) { toast.error('Upload failed'); return; }
      const { data: { publicUrl } } = supabase.storage.from('user-uploads').getPublicUrl(path);
      updateElement(element.id, { src: publicUrl });
      toast.success('Photo uploaded');
    };
    document.body.appendChild(input);
    fileInputRef.current = input;
    return () => { document.body.removeChild(input); };
  }, [user, element.id, updateElement]);

  const handleDoubleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Group {...commonProps} onDblClick={handleDoubleClick} onDblTap={handleDoubleClick}>
      <Rect width={element.width} height={element.height} fill={image ? 'transparent' : '#f0f0f0'} stroke="#ccc" strokeWidth={image ? 0 : 1} listening={true} />
      {image ? (
        <KonvaImage
          image={image}
          width={element.width}
          height={element.height}
        />
      ) : (
        <Text
          x={0}
          y={element.height / 2 - 10}
          width={element.width}
          text="Double-click to upload photo"
          fontSize={10}
          fill="#999"
          align="center"
          listening={false}
        />
      )}
    </Group>
  );
};

export default ImageRenderer;
