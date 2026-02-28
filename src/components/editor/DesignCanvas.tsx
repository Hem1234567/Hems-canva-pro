import { useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Text, Line, Transformer, Group } from 'react-konva';
import { useEditor } from '@/contexts/EditorContext';
import { CanvasElement } from '@/types/editor';
import Konva from 'konva';

const DesignCanvas = () => {
  const { elements, selectedId, selectElement, updateElement, zoom, canvasWidth, canvasHeight, deleteElement } = useEditor();
  const transformerRef = useRef<Konva.Transformer>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const selectedRef = useRef<Konva.Node>(null);

  // Attach transformer
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

  // Keyboard shortcuts
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

  const handleDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    updateElement(id, { x: e.target.x(), y: e.target.y() });
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

  const pixelW = canvasWidth * 3; // Scale for visibility
  const pixelH = canvasHeight * 3;

  return (
    <div className="flex-1 bg-canvas overflow-auto flex items-center justify-center p-8">
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
              {/* Grid */}
              {Array.from({ length: Math.floor(pixelW / 30) }).map((_, i) => (
                <Line key={`gv-${i}`} points={[i * 30, 0, i * 30, pixelH]} stroke="#f0f0f0" strokeWidth={0.5} />
              ))}
              {Array.from({ length: Math.floor(pixelH / 30) }).map((_, i) => (
                <Line key={`gh-${i}`} points={[0, i * 30, pixelW, i * 30]} stroke="#f0f0f0" strokeWidth={0.5} />
              ))}

              {/* Elements */}
              {elements.map(el => (
                <CanvasElementRenderer
                  key={el.id}
                  element={el}
                  isSelected={selectedId === el.id}
                  onSelect={handleSelect}
                  onDragEnd={handleDragEnd}
                  onTransformEnd={handleTransformEnd}
                />
              ))}

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
};

interface ElementRendererProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: (id: string, node: Konva.Node) => void;
  onDragEnd: (id: string, e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (id: string, e: Konva.KonvaEventObject<Event>) => void;
}

const CanvasElementRenderer = ({ element: el, isSelected, onSelect, onDragEnd, onTransformEnd }: ElementRendererProps) => {
  const nodeRef = useRef<any>(null);

  const commonProps = {
    x: el.x,
    y: el.y,
    rotation: el.rotation,
    opacity: el.opacity,
    draggable: true,
    onClick: () => nodeRef.current && onSelect(el.id, nodeRef.current),
    onTap: () => nodeRef.current && onSelect(el.id, nodeRef.current),
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
      return (
        <Group {...commonProps}>
          <Rect width={el.width} height={el.height} fill="#FFFFFF" stroke="#CCCCCC" strokeWidth={1} cornerRadius={2} />
          {/* Barcode lines simulation */}
          {Array.from({ length: Math.floor(el.width / 3) }).map((_, i) => (
            <Line
              key={i}
              points={[i * 3 + 4, 4, i * 3 + 4, el.height - 14]}
              stroke={el.fill}
              strokeWidth={i % 3 === 0 ? 2 : 1}
            />
          ))}
          <Text text={el.text || '{{serial}}'} fontSize={8} y={el.height - 12} x={4} fill={el.fill} fontFamily="monospace" />
        </Group>
      );
    case 'qrcode':
      return (
        <Group {...commonProps}>
          <Rect width={el.width} height={el.height} fill="#FFFFFF" stroke="#CCCCCC" strokeWidth={1} cornerRadius={2} />
          {/* QR pattern simulation */}
          {Array.from({ length: 8 }).map((_, r) =>
            Array.from({ length: 8 }).map((_, c) => {
              const show = (r + c) % 2 === 0 || (r < 3 && c < 3) || (r < 3 && c > 4) || (r > 4 && c < 3);
              if (!show) return null;
              const cellW = (el.width - 8) / 8;
              const cellH = (el.height - 8) / 8;
              return <Rect key={`${r}-${c}`} x={4 + c * cellW} y={4 + r * cellH} width={cellW - 1} height={cellH - 1} fill={el.fill} />;
            })
          )}
        </Group>
      );
    default:
      return null;
  }
};

export default DesignCanvas;
