import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor } from '@/contexts/EditorContext';
import { Stage, Layer, Rect, Circle, Text, Line, Group } from 'react-konva';
import { CanvasElement } from '@/types/editor';
import BarcodeRenderer from './BarcodeRenderer';
import QRCodeRenderer from './QRCodeRenderer';
import ImageRenderer from './ImageRenderer';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PresentationModeProps {
  open: boolean;
  onClose: () => void;
}

const PresentationMode = ({ open, onClose }: PresentationModeProps) => {
  const { pages, canvasWidth, canvasHeight } = useEditor();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  const pixelW = canvasWidth * 3;
  const pixelH = canvasHeight * 3;

  const totalSlides = pages.length;

  const goNext = useCallback(() => {
    if (currentSlide >= totalSlides - 1 || transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(prev => prev + 1);
      setTransitioning(false);
    }, 300);
  }, [currentSlide, totalSlides, transitioning]);

  const goPrev = useCallback(() => {
    if (currentSlide <= 0 || transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(prev => prev - 1);
      setTransitioning(false);
    }, 300);
  }, [currentSlide, transitioning]);

  // Fullscreen
  useEffect(() => {
    if (!open) return;
    const el = containerRef.current;
    if (el && document.fullscreenElement !== el) {
      el.requestFullscreen?.().catch(() => {});
    }
    const handleFsChange = () => {
      if (!document.fullscreenElement && open) onClose();
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, [open, onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'Space':
        case ' ':
          e.preventDefault();
          goNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goPrev();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'Home':
          setCurrentSlide(0);
          break;
        case 'End':
          setCurrentSlide(totalSlides - 1);
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, goNext, goPrev, onClose, totalSlides]);

  // Auto-hide controls
  useEffect(() => {
    if (!open) return;
    const handleMove = () => {
      setShowControls(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setShowControls(false), 3000);
    };
    window.addEventListener('mousemove', handleMove);
    handleMove();
    return () => {
      window.removeEventListener('mousemove', handleMove);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [open]);

  if (!open) return null;

  const currentPage = pages[currentSlide];
  const elements = currentPage?.elements || [];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      onClick={goNext}
    >
      {/* Slide */}
      <div
        className={`transition-all duration-300 ease-in-out ${transitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
        style={{
          width: pixelW,
          height: pixelH,
          transform: `scale(${Math.min(
            (window.innerWidth * 0.95) / pixelW,
            (window.innerHeight * 0.95) / pixelH
          )})`,
          transformOrigin: 'center center',
        }}
      >
        <Stage width={pixelW} height={pixelH} style={{ background: '#FFFFFF', borderRadius: '4px' }}>
          <Layer>
            {elements.map(el => (
              <PresentationElement key={el.id} element={el} />
            ))}
          </Layer>
        </Stage>
      </div>

      {/* Controls overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-6 flex items-center justify-center gap-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-black/70 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={goPrev}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-white text-sm font-medium min-w-[60px] text-center">
            {currentSlide + 1} / {totalSlides}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={goNext}
            disabled={currentSlide === totalSlides - 1}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
          <div className="w-px h-6 bg-white/30" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-white/10 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
        />
      </div>
    </div>
  );
};

const PresentationElement = ({ element: el }: { element: CanvasElement }) => {
  const commonProps = {
    x: el.x,
    y: el.y,
    rotation: el.rotation,
    opacity: el.opacity,
    draggable: false,
    listening: false,
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

export default PresentationMode;
