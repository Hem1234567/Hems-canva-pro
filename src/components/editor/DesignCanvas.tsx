import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle, useState } from 'react';
import { Stage, Layer, Rect, Circle, Text, Line, Transformer } from 'react-konva';
import { useEditor } from '@/contexts/EditorContext';
import { CanvasElement } from '@/types/editor';
import Konva from 'konva';
import BarcodeRenderer from './BarcodeRenderer';
import QRCodeRenderer from './QRCodeRenderer';
import ImageRenderer from './ImageRenderer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DesignCanvasHandle {
  getStage: () => Konva.Stage | null;
}

const SNAP_THRESHOLD = 6;
const GRID_SNAP = 15;

const getSnapLines = (elements: CanvasElement[], dragId: string, canvasW: number, canvasH: number) => {
  const vLines: number[] = [0, canvasW / 2, canvasW];
  const hLines: number[] = [0, canvasH / 2, canvasH];
  for (const el of elements) {
    if (el.id === dragId) continue;
    vLines.push(el.x, el.x + el.width / 2, el.x + el.width);
    hLines.push(el.y, el.y + el.height / 2, el.y + el.height);
  }
  return { vLines, hLines };
};

const findSnap = (pos: number, size: number, lines: number[], threshold: number) => {
  const edges = [pos, pos + size / 2, pos + size];
  let best: { offset: number; line: number } | null = null;
  for (const edge of edges) {
    for (const line of lines) {
      const dist = Math.abs(edge - line);
      if (dist < threshold && (!best || dist < Math.abs(best.offset))) {
        best = { offset: line - edge, line };
      }
    }
  }
  return best;
};

const DesignCanvas = forwardRef<DesignCanvasHandle>((_, ref) => {
  const { elements, selectedId, selectElement, updateElement, zoom, canvasWidth, canvasHeight, deleteElement, addImageElement } = useEditor();
  const transformerRef = useRef<Konva.Transformer>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const selectedRef = useRef<Konva.Node>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [guides, setGuides] = useState<{ v: number | null; h: number | null }>({ v: null, h: null });
  const { user } = useAuth();

  useImperativeHandle(ref, () => ({
    getStage: () => stageRef.current,
  }));

  useEffect(() => {
    if (!transformerRef.current) return;
    if (selectedId && selectedRef.current) {
      transformerRef.current.nodes([selectedRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    } else {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId, elements]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
          deleteElement(selectedId);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, deleteElement]);

  const handleSelect = useCallback((id: string, nodeRef: Konva.Node) => {
    selectedRef.current = nodeRef;
    selectElement(id);
  }, [selectElement]);

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      selectElement(null);
      selectedRef.current = null;
    }
  };

  const pixelW = canvasWidth * 3;
  const pixelH = canvasHeight * 3;

  const handleDragMove = useCallback((id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const el = elements.find(e => e.id === id);
    if (!el) return;

    const { vLines, hLines } = getSnapLines(elements, id, pixelW, pixelH);

    // Grid snap
    let x = Math.round(node.x() / GRID_SNAP) * GRID_SNAP;
    let y = Math.round(node.y() / GRID_SNAP) * GRID_SNAP;

    // Element/canvas edge snap (overrides grid if close)
    const snapX = findSnap(node.x(), el.width, vLines, SNAP_THRESHOLD);
    const snapY = findSnap(node.y(), el.height, hLines, SNAP_THRESHOLD);

    if (snapX) x = node.x() + snapX.offset;
    if (snapY) y = node.y() + snapY.offset;

    node.x(x);
    node.y(y);

    setGuides({
      v: snapX ? snapX.line : null,
      h: snapY ? snapY.line : null,
    });
  }, [elements, pixelW, pixelH]);

  const handleDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    updateElement(id, { x: e.target.x(), y: e.target.y() });
    setGuides({ v: null, h: null });
  };

  const handleTransformEnd = (id: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    updateElement(id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
      rotation: node.rotation(),
    });
  };

  const handleFileDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/') || !user) return;

    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('user-uploads').upload(path, file);
    if (error) { toast.error('Upload failed'); return; }
    const { data: { publicUrl } } = supabase.storage.from('user-uploads').getPublicUrl(path);

    addImageElement(publicUrl);
    toast.success('Image added to canvas');
  }, [user, addImageElement]);

  return (
    <div
      ref={containerRef}
      className={`flex-1 bg-canvas overflow-auto flex items-center justify-center p-8 ${dragOver ? 'ring-2 ring-primary ring-inset' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleFileDrop}
    >
      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          transition: 'transform 0.15s ease',
        }}
      >
        <div className="shadow-lg rounded-sm" style={{ width: pixelW, height: pixelH }}>
          <Stage
            ref={stageRef}
            width={pixelW}
            height={pixelH}
            onClick={handleStageClick}
            style={{ background: '#FFFFFF', borderRadius: '2px' }}
          >
            <Layer>
              {Array.from({ length: Math.floor(pixelW / 30) }).map((_, i) => (
                <Line key={`gv-${i}`} points={[i * 30, 0, i * 30, pixelH]} stroke="#f0f0f0" strokeWidth={0.5} />
              ))}
              {Array.from({ length: Math.floor(pixelH / 30) }).map((_, i) => (
                <Line key={`gh-${i}`} points={[0, i * 30, pixelW, i * 30]} stroke="#f0f0f0" strokeWidth={0.5} />
              ))}

              {elements.map(el => (
                <CanvasElementRenderer
                  key={el.id}
                  element={el}
                  isSelected={selectedId === el.id}
                  onSelect={handleSelect}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                  onTransformEnd={handleTransformEnd}
                />
              ))}

              {/* Alignment guide lines */}
              {guides.v !== null && (
                <Line points={[guides.v, 0, guides.v, pixelH]} stroke="#D4AF37" strokeWidth={1} dash={[4, 4]} listening={false} />
              )}
              {guides.h !== null && (
                <Line points={[0, guides.h, pixelW, guides.h]} stroke="#D4AF37" strokeWidth={1} dash={[4, 4]} listening={false} />
              )}

              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 5 || newBox.height < 5) return oldBox;
                  return newBox;
                }}
                anchorFill="#D4AF37"
                anchorStroke="#B8962E"
                borderStroke="#D4AF37"
                anchorSize={8}
              />
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
});

DesignCanvas.displayName = 'DesignCanvas';

interface ElementRendererProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: (id: string, node: Konva.Node) => void;
  onDragMove: (id: string, e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd: (id: string, e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (id: string, e: Konva.KonvaEventObject<Event>) => void;
}

const CanvasElementRenderer = ({ element: el, isSelected, onSelect, onDragMove, onDragEnd, onTransformEnd }: ElementRendererProps) => {
  const nodeRef = useRef<any>(null);

  const commonProps = {
    x: el.x,
    y: el.y,
    rotation: el.rotation,
    opacity: el.opacity,
    draggable: true,
    onClick: () => nodeRef.current && onSelect(el.id, nodeRef.current),
    onTap: () => nodeRef.current && onSelect(el.id, nodeRef.current),
    onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => onDragMove(el.id, e),
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => onDragEnd(el.id, e),
    onTransformEnd: (e: Konva.KonvaEventObject<Event>) => onTransformEnd(el.id, e),
    ref: nodeRef,
  };

  switch (el.type) {
    case 'text':
      return (
        <Text
          {...commonProps}
          text={el.text || 'Text'}
          fontSize={el.fontSize || 18}
          fontFamily={el.fontFamily || 'Inter'}
          fontStyle={el.fontStyle || 'normal'}
          fill={el.fill}
          width={el.width}
          letterSpacing={el.letterSpacing || 0}
          align={el.align || 'left'}
          textDecoration={el.textDecoration || ''}
        />
      );
    case 'rect':
      return (
        <Rect
          {...commonProps}
          width={el.width}
          height={el.height}
          fill={el.fill}
          stroke={el.stroke}
          strokeWidth={el.strokeWidth}
          cornerRadius={2}
        />
      );
    case 'circle':
      return (
        <Circle
          {...commonProps}
          x={el.x + el.width / 2}
          y={el.y + el.height / 2}
          radius={el.width / 2}
          fill={el.fill}
          stroke={el.stroke}
          strokeWidth={el.strokeWidth}
        />
      );
    case 'line':
      return (
        <Line
          {...commonProps}
          points={[0, 0, el.width, 0]}
          stroke={el.fill}
          strokeWidth={el.strokeWidth || 2}
        />
      );
    case 'barcode':
      return <BarcodeRenderer element={el} commonProps={commonProps} />;
    case 'qrcode':
      return <QRCodeRenderer element={el} commonProps={commonProps} />;
    case 'image':
      return <ImageRenderer element={el} commonProps={commonProps} />;
    default:
      return null;
  }
};

export default DesignCanvas;
