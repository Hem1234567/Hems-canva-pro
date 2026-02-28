import { useEditor } from '@/contexts/EditorContext';

const MINIMAP_W = 160;

const Minimap = () => {
  const { elements, canvasWidth, canvasHeight, zoom } = useEditor();
  const pixelW = canvasWidth * 3;
  const pixelH = canvasHeight * 3;
  const scale = MINIMAP_W / pixelW;
  const minimapH = pixelH * scale;

  // Viewport indicator (approximation based on zoom)
  const viewW = MINIMAP_W / zoom;
  const viewH = minimapH / zoom;
  const viewX = (MINIMAP_W - viewW) / 2;
  const viewY = (minimapH - viewH) / 2;

  return (
    <div className="border border-border rounded bg-card p-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Minimap</p>
      <div className="relative bg-white rounded" style={{ width: MINIMAP_W, height: minimapH }}>
        {elements.map(el => {
          const x = el.x * scale;
          const y = el.y * scale;
          const w = Math.max(2, el.width * scale);
          const h = Math.max(2, el.height * scale);
          const color = el.type === 'text' ? 'hsl(var(--primary))' : el.fill === 'transparent' ? 'hsl(var(--muted-foreground))' : el.fill;
          return (
            <div
              key={el.id}
              className="absolute"
              style={{
                left: x,
                top: y,
                width: w,
                height: h,
                backgroundColor: color,
                opacity: el.opacity * 0.8,
                borderRadius: 1,
              }}
            />
          );
        })}
        {/* Viewport indicator */}
        <div
          className="absolute border-2 border-primary/60 rounded-sm pointer-events-none"
          style={{
            left: Math.max(0, viewX),
            top: Math.max(0, viewY),
            width: Math.min(viewW, MINIMAP_W),
            height: Math.min(viewH, minimapH),
          }}
        />
      </div>
    </div>
  );
};

export default Minimap;
