import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle, useState } from 'react';
import { Stage, Layer, Rect, Circle, Text, Line, Transformer, Group } from 'react-konva';
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
const RULER_SIZE = 24;

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
  const {
    elements, selectedId, selectElement, updateElement, zoom, canvasWidth, canvasHeight,
    deleteElement, addImageElement, addCustomElement, snapEnabled, selectedIds, toggleSelectElement, deleteSelected
  } = useEditor();
  const transformerRef = useRef<Konva.Transformer>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const selectedNodesRef = useRef<Map<string, Konva.Node>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [guides, setGuides] = useState<{ v: number | null; h: number | null }>({ v: null, h: null });
  const { user } = useAuth();

  // Track drag start positions for group move
  const groupDragStart = useRef<Map<string, { x: number; y: number }> | null>(null);

  useImperativeHandle(ref, () => ({
    getStage: () => stageRef.current,
  }));

  useEffect(() => {
    if (!transformerRef.current) return;
    const nodes: Konva.Node[] = [];
    selectedIds.forEach(id => {
      const node = selectedNodesRef.current.get(id);
      if (node) nodes.push(node);
    });
    transformerRef.current.nodes(nodes);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedIds, elements]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.size > 0 && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
          deleteSelected();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedIds, deleteSelected]);

  const handleSelect = useCallback((id: string, nodeRef: Konva.Node, shiftKey: boolean) => {
    selectedNodesRef.current.set(id, nodeRef);
    if (shiftKey) {
      toggleSelectElement(id);
    } else {
      selectElement(id);
    }
  }, [selectElement, toggleSelectElement]);

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      selectElement(null);
    }
  };

  const pixelW = canvasWidth * 3;
  const pixelH = canvasHeight * 3;

  const handleDragMove = useCallback((id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    if (!snapEnabled) return;
    const node = e.target;
    const el = elements.find(e => e.id === id);
    if (!el) return;

    const { vLines, hLines } = getSnapLines(elements, id, pixelW, pixelH);

    let x = Math.round(node.x() / GRID_SNAP) * GRID_SNAP;
    let y = Math.round(node.y() / GRID_SNAP) * GRID_SNAP;

    const snapX = findSnap(node.x(), el.width, vLines, SNAP_THRESHOLD);
    const snapY = findSnap(node.y(), el.height, hLines, SNAP_THRESHOLD);

    if (snapX) x = node.x() + snapX.offset;
    if (snapY) y = node.y() + snapY.offset;

    node.x(x);
    node.y(y);

    // Group move: move other selected elements by same delta
    if (selectedIds.size > 1 && selectedIds.has(id) && groupDragStart.current) {
      const startPos = groupDragStart.current.get(id);
      if (startPos) {
        const dx = x - startPos.x;
        const dy = y - startPos.y;
        selectedIds.forEach(sid => {
          if (sid === id) return;
          const sNode = selectedNodesRef.current.get(sid);
          const sStart = groupDragStart.current?.get(sid);
          if (sNode && sStart) {
            sNode.x(sStart.x + dx);
            sNode.y(sStart.y + dy);
          }
        });
      }
    }

    setGuides({
      v: snapX ? snapX.line : null,
      h: snapY ? snapY.line : null,
    });
  }, [elements, pixelW, pixelH, snapEnabled, selectedIds]);

  const handleDragStart = useCallback((id: string) => {
    if (selectedIds.size > 1 && selectedIds.has(id)) {
      const positions = new Map<string, { x: number; y: number }>();
      selectedIds.forEach(sid => {
        const el = elements.find(e => e.id === sid);
        if (el) positions.set(sid, { x: el.x, y: el.y });
      });
      groupDragStart.current = positions;
    } else {
      groupDragStart.current = null;
    }
  }, [selectedIds, elements]);

  const handleDragEnd = useCallback((id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    updateElement(id, { x: e.target.x(), y: e.target.y() });
    // Update all other selected elements too
    if (selectedIds.size > 1 && selectedIds.has(id)) {
      selectedIds.forEach(sid => {
        if (sid === id) return;
        const sNode = selectedNodesRef.current.get(sid);
        if (sNode) {
          updateElement(sid, { x: sNode.x(), y: sNode.y() });
        }
      });
    }
    groupDragStart.current = null;
    setGuides({ v: null, h: null });
  }, [updateElement, selectedIds]);

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

    // Check for stock element drag data first
    const elementData = e.dataTransfer.getData('application/designflow-element');
    if (elementData) {
      try {
        const parsed = JSON.parse(elementData);
        addCustomElement(parsed);
        toast.success('Element added to canvas');
      } catch {
        toast.error('Failed to add element');
      }
      return;
    }

    // Handle image file drops
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/') || !user) return;

    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('user-uploads').upload(path, file);
    if (error) { toast.error('Upload failed'); return; }
    const { data: { publicUrl } } = supabase.storage.from('user-uploads').getPublicUrl(path);

    addImageElement(publicUrl);
    toast.success('Image added to canvas');
  }, [user, addImageElement, addCustomElement]);

  // Ruler tick generation
  const rulerTicksH = [];
  const rulerTicksV = [];
  const tickSpacing = 30; // px per tick at zoom=1
  for (let i = 0; i <= pixelW; i += tickSpacing) {
    const mm = Math.round(i / 3);
    rulerTicksH.push({ pos: i, label: mm % 10 === 0 ? `${mm}` : '', major: mm % 10 === 0 });
  }
  for (let i = 0; i <= pixelH; i += tickSpacing) {
    const mm = Math.round(i / 3);
    rulerTicksV.push({ pos: i, label: mm % 10 === 0 ? `${mm}` : '', major: mm % 10 === 0 });
  }

  return (
    <div
      ref={containerRef}
      className={`flex-1 bg-canvas overflow-auto flex flex-col ${dragOver ? 'ring-2 ring-primary ring-inset' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleFileDrop}
    >
      <div className="flex-1 flex items-center justify-center p-8">
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease',
          }}
        >
          <div className="relative">
            {/* Top ruler */}
            <div
              className="absolute bg-muted border-b border-border"
              style={{ left: RULER_SIZE, top: 0, width: pixelW, height: RULER_SIZE, overflow: 'hidden' }}
            >
              <svg width={pixelW} height={RULER_SIZE} className="block">
                {rulerTicksH.map((t, i) => (
                  <g key={i}>
                    <line x1={t.pos} y1={t.major ? 0 : RULER_SIZE / 2} x2={t.pos} y2={RULER_SIZE} stroke="hsl(var(--muted-foreground))" strokeWidth={t.major ? 1 : 0.5} opacity={t.major ? 0.6 : 0.3} />
                    {t.label && <text x={t.pos + 2} y={10} fontSize={8} fill="hsl(var(--muted-foreground))" opacity={0.7}>{t.label}</text>}
                  </g>
                ))}
              </svg>
            </div>

            {/* Left ruler */}
            <div
              className="absolute bg-muted border-r border-border"
              style={{ left: 0, top: RULER_SIZE, width: RULER_SIZE, height: pixelH, overflow: 'hidden' }}
            >
              <svg width={RULER_SIZE} height={pixelH} className="block">
                {rulerTicksV.map((t, i) => (
                  <g key={i}>
                    <line y1={t.pos} x1={t.major ? 0 : RULER_SIZE / 2} y2={t.pos} x2={RULER_SIZE} stroke="hsl(var(--muted-foreground))" strokeWidth={t.major ? 1 : 0.5} opacity={t.major ? 0.6 : 0.3} />
                    {t.label && <text x={2} y={t.pos - 2} fontSize={8} fill="hsl(var(--muted-foreground))" opacity={0.7}>{t.label}</text>}
                  </g>
                ))}
              </svg>
            </div>

            {/* Corner square */}
            <div className="absolute bg-muted border-b border-r border-border" style={{ left: 0, top: 0, width: RULER_SIZE, height: RULER_SIZE }} />

            {/* Canvas */}
            <div className="shadow-lg rounded-sm" style={{ marginLeft: RULER_SIZE, marginTop: RULER_SIZE, width: pixelW, height: pixelH }}>
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
                      isSelected={selectedIds.has(el.id)}
                      onSelect={handleSelect}
                      onDragStart={handleDragStart}
                      onDragMove={handleDragMove}
                      onDragEnd={handleDragEnd}
                      onTransformEnd={handleTransformEnd}
                      registerNode={(id, node) => { if (node) selectedNodesRef.current.set(id, node); }}
                    />
                  ))}

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
      </div>
    </div>
  );
});

DesignCanvas.displayName = 'DesignCanvas';

interface ElementRendererProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: (id: string, node: Konva.Node, shiftKey: boolean) => void;
  onDragStart: (id: string) => void;
  onDragMove: (id: string, e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd: (id: string, e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (id: string, e: Konva.KonvaEventObject<Event>) => void;
  registerNode: (id: string, node: Konva.Node | null) => void;
}

const CanvasElementRenderer = ({ element: el, isSelected, onSelect, onDragStart, onDragMove, onDragEnd, onTransformEnd, registerNode }: ElementRendererProps) => {
  const nodeRef = useRef<any>(null);
  const groupRef = useRef<any>(null);

  useEffect(() => {
    // Register the inner shape node for transforms, not the group
    registerNode(el.id, nodeRef.current);
  }, [el.id, registerNode]);

  const isLocked = el.locked || false;
  const hasVariable = el.text && /\{\{(serial|date|prefix|batch|name|designation|empId|department)\}\}/.test(el.text);

  const commonProps = {
    x: el.x,
    y: el.y,
    rotation: el.rotation,
    opacity: el.opacity,
    draggable: !isLocked,
    onClick: (e: Konva.KonvaEventObject<MouseEvent>) => nodeRef.current && onSelect(el.id, nodeRef.current, e.evt.shiftKey),
    onTap: () => nodeRef.current && onSelect(el.id, nodeRef.current, false),
    onDragStart: isLocked ? undefined : () => onDragStart(el.id),
    onDragMove: isLocked ? undefined : (e: Konva.KonvaEventObject<DragEvent>) => onDragMove(el.id, e),
    onDragEnd: isLocked ? undefined : (e: Konva.KonvaEventObject<DragEvent>) => onDragEnd(el.id, e),
    onTransformEnd: isLocked ? undefined : (e: Konva.KonvaEventObject<Event>) => onTransformEnd(el.id, e),
    ref: nodeRef,
  };

  const renderElement = () => {
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
            cornerRadius={el.cornerRadius || 0}
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

  // Variable badge dimensions
  const badgeW = 52;
  const badgeH = 16;

  return (
    <>
      {renderElement()}
      {hasVariable && (
        <Group x={el.x} y={el.y - badgeH - 4} listening={false} rotation={el.rotation}>
          <Rect
            width={badgeW}
            height={badgeH}
            fill="#D4AF37"
            cornerRadius={3}
            opacity={0.9}
          />
          <Text
            x={4}
            y={2}
            text="{{serial}}"
            fontSize={9}
            fontFamily="monospace"
            fill="#FFFFFF"
            listening={false}
          />
        </Group>
      )}
    </>
  );
};

export default DesignCanvas;
