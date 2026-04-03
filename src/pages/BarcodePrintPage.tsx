import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import Konva from 'konva';

/* ── helpers ── */
function generateValues(
  start: number,
  end: number,
  prefix: string,
  suffix: string
): string[] {
  const vals: string[] = [];
  for (let i = start; i <= end; i++) {
    vals.push(`${prefix}${i}${suffix}`);
  }
  return vals;
}

export default function BarcodePrintPage() {
  const { state } = useLocation() as { state: any };
  const navigate = useNavigate();
  const [columns, setColumns] = useState(3);
  const [padding, setPadding] = useState(25);
  const [images, setImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pageBreak, setPageBreak] = useState(false);
  const [duplicateCopies, setDuplicateCopies] = useState(1);

  // Read state from Label Maker or Fallback
  const mode = state?.mode || 'basic';
  const elements = state?.elements || [];
  const canvasWidth = state?.canvasWidth || 100;
  const canvasHeight = state?.canvasHeight || 50;
  const canvasBg = state?.canvasBg || '#ffffff';
  const barcodeType = state?.barcodeType || 'CODE128';
  
  const serialStart = state?.serialStart;
  const serialEnd = state?.serialEnd;
  const serialPrefix = state?.serialPrefix || '';
  const singleValue = state?.singleValue || '';

  useEffect(() => {
    if (!state) return;
    
    let isCancelled = false;
    
    const generateAllImages = async () => {
      setIsGenerating(true);
      try {
        const isSerial = serialStart !== null && serialEnd !== null && serialStart !== undefined;
        let valuesToGenerate: string[] = [];
        
        if (isSerial) {
          valuesToGenerate = generateValues(
            Number(serialStart), 
            Number(serialEnd), 
            serialPrefix || '', 
            ''
          );
          if (valuesToGenerate.length === 0) valuesToGenerate = ['1'];
        } else if (singleValue && singleValue.trim().length > 0) {
          // Individual mode — each comma/newline entry becomes one label
          valuesToGenerate = singleValue.split(/[\n,]+/).map((v: string) => v.trim()).filter(Boolean);
        } else {
          // No explicit value — render one copy of the label using the element's stored text
          valuesToGenerate = ['__USE_ELEMENT_TEXT__'];
        }

        const generatedImages: string[] = [];

        if (mode === 'label-maker') {
          // Keep the scaling native so it renders crisp
          const renderScale = 3;
          const pixelW = canvasWidth * renderScale;
          const pixelH = canvasHeight * renderScale;
          
          const container = document.createElement('div');
          container.style.position = 'absolute';
          container.style.left = '-9999px';
          document.body.appendChild(container);

          for (const val of valuesToGenerate) {
            if (isCancelled) break;
            
            const offStage = new Konva.Stage({ container, width: pixelW, height: pixelH });
            const layer = new Konva.Layer();
            offStage.add(layer);

            layer.add(new Konva.Rect({ x: 0, y: 0, width: pixelW, height: pixelH, fill: canvasBg || '#FFFFFF' }));

            for (const el of elements) {
              const rawText = el.text || '';
              const useRawText = val === '__USE_ELEMENT_TEXT__';
              
              // Replace {{serial}} and any other {{variable}} with the current value
              const text = useRawText 
                ? rawText 
                : rawText.replace(/\{\{(\w+)\}\}/g, (_: string, varName: string) => {
                    if (varName === 'serial') return val;
                    return val;
                  });
              
              // For barcodes: use element's own text → resolved serial → the serial value itself → fallback
              const barcodeValue = useRawText
                ? (rawText.trim() || 'SAMPLE')
                : ((text.trim().length > 0 ? text.trim() : val) || 'SAMPLE');

              // Render standard properties
              switch (el.type) {
                case 'text':
                  layer.add(new Konva.Text({
                    x: el.x, y: el.y, text, fontSize: el.fontSize || 18,
                    fontFamily: el.fontFamily || 'Inter', fontStyle: el.fontStyle || 'normal',
                    fill: el.fill, width: el.width, rotation: el.rotation, opacity: el.opacity,
                    letterSpacing: el.letterSpacing || 0, align: el.align || 'left',
                  }));
                  break;
                case 'rect':
                  layer.add(new Konva.Rect({
                    x: el.x, y: el.y, width: el.width, height: el.height,
                    fill: el.fill, stroke: el.stroke, strokeWidth: el.strokeWidth,
                    rotation: el.rotation, opacity: el.opacity, cornerRadius: el.cornerRadius || 0,
                  }));
                  break;
                case 'circle':
                  layer.add(new Konva.Circle({
                    x: el.x + el.width / 2, y: el.y + el.height / 2, radius: el.width / 2,
                    fill: el.fill, stroke: el.stroke, strokeWidth: el.strokeWidth,
                    rotation: el.rotation, opacity: el.opacity,
                  }));
                  break;
                case 'barcode': {
                  try {
                    const bCanvas = document.createElement('canvas');
                    const fmt = el.barcodeFormat || barcodeType || 'CODE128';
                    const barH = Math.max(30, (el.height || 80) - (el.fontSize || 14) - 10);
                    JsBarcode(bCanvas, barcodeValue, {
                      format: fmt,
                      width: 2,
                      height: barH,
                      displayValue: el.showText !== false,
                      fontSize: el.fontSize || 14,
                      textMargin: 4,
                      margin: 3,
                      background: '#FFFFFF',
                      lineColor: el.fill || '#000000',
                      valid: (v: boolean) => { if (!v) console.warn('Invalid barcode value for format', fmt, ':', barcodeValue); },
                    });
                    const img = new window.Image();
                    img.src = bCanvas.toDataURL();
                    await new Promise<void>(resolve => { img.onload = () => resolve(); img.onerror = () => resolve(); });
                    layer.add(new Konva.Image({
                      x: el.x, y: el.y, width: el.width, height: el.height,
                      image: img, rotation: el.rotation, opacity: el.opacity,
                    }));
                  } catch (e) {
                    console.error('Barcode render error:', e, 'value:', barcodeValue);
                  }
                  break;
                }
                case 'qrcode': {
                  try {
                    const qrDataUrl = await QRCode.toDataURL(barcodeValue, { width: Math.max(el.width, el.height) * 2, margin: 2 });
                    const img = new window.Image();
                    img.src = qrDataUrl;
                    await new Promise<void>(resolve => { img.onload = () => resolve(); });
                    layer.add(new Konva.Image({ x: el.x, y: el.y, width: el.width, height: el.height, image: img, rotation: el.rotation, opacity: el.opacity }));
                  } catch { /* skip */ }
                  break;
                }
                case 'image': {
                  if (el.src) {
                    try {
                      const img = new window.Image();
                      img.crossOrigin = 'anonymous'; img.src = el.src;
                      await new Promise<void>(resolve => { img.onload = () => resolve(); img.onerror = () => resolve(); });
                      layer.add(new Konva.Image({ x: el.x, y: el.y, width: el.width, height: el.height, image: img, rotation: el.rotation, opacity: el.opacity }));
                    } catch { /* skip */ }
                  }
                  break;
                }
              }
            }

            layer.batchDraw();
            await new Promise(r => setTimeout(r, 10)); // tiny yield
            generatedImages.push(offStage.toDataURL({ pixelRatio: 2 }));
            offStage.destroy();
          }
          document.body.removeChild(container);
        } else {
          // SIMPLE MODE FLAG (Just generate basic barcodes)
          for (const val of valuesToGenerate) {
             const canvas = document.createElement('canvas');
             try {
                JsBarcode(canvas, val, { format: barcodeType, height: 60, displayValue: true });
                generatedImages.push(canvas.toDataURL());
             } catch {
                generatedImages.push(''); // blank on error
             }
          }
        }

        if (!isCancelled) {
          setImages(generatedImages);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!isCancelled) setIsGenerating(false);
      }
    };
    
    generateAllImages();
    return () => { isCancelled = true; };
  }, [state]);

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg mb-4">No label data found.</p>
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-blue-600 text-white rounded">Go to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: #f5f5f5; }
        .print-layout { display: flex; min-height: 100vh; }
        
        /* Sidebar styling to match the Bootstrap snippet */
        .sidebar { width: 280px; min-width: 280px; background: #f8f9fa; border-right: 1px solid #dee2e6; padding: 1rem; overflow-y: auto; }
        .sidebar .btn { display: inline-block; font-weight: 400; text-align: center; text-decoration: none; vertical-align: middle; cursor: pointer; user-select: none; padding: .375rem .75rem; font-size: 1rem; border-radius: .25rem; transition: color .15s,background-color .15s,border-color .15s; border: 1px solid transparent; width: 100%; white-space: normal; line-height: 1.2;}
        .btn-primary { color: #fff; background-color: #0d6efd; border-color: #0d6efd; }
        .btn-primary:hover { background-color: #0b5ed7; border-color: #0a58ca; }
        .btn-warning { color: #000; background-color: #ffc107; border-color: #ffc107; }
        .btn-warning:hover { background-color: #ffca2c; border-color: #ffc720; }
        .btn-toggle { background-color: transparent; border: 0; color: rgba(0,0,0,.65); text-align: left; padding: .25rem .5rem; font-weight: 600; }
        .btn-toggle:hover { color: rgba(0,0,0,.85); background-color: #e2e3e5; }
        
        .list-unstyled { padding-left: 0; list-style: none; }
        .pb-3 { padding-bottom: 1rem; }
        .mb-3 { margin-bottom: 1rem; }
        .mb-5 { margin-bottom: 3rem; }
        .mb-1 { margin-bottom: .25rem; }
        .gap-2 { gap: .5rem; }
        .d-grid { display: grid; }
        .fw-normal { font-weight: 400; }
        .small { font-size: .875em; }
        .link-dark { color: #212529; text-decoration: none; display: block; padding: .1875rem .5rem;}
        .link-dark:hover { color: #1e2125; background-color: #e2e3e5; border-radius: .25rem;}
        
        .section-box { margin-bottom: 4px; }
        .collapse-inner { padding-left: 1.25rem; margin-top: 0.25rem; }
        
        /* Main Content */
        .barcode-main { flex: 1; padding: 24px; overflow-y: auto; background: #fff; }
        .page-block { margin-bottom: 30px; }
        
        .grid-container {
          display: grid;
          /* Default overrides via style prop */
          overflow: hidden;
        }

        .label-slot {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          border: 1px dashed #d1d5db; /* subtle helper border */
          width: 100%;
        }

        .label-slot img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        /* Print modifications */
        @media print {
          .d-print-none { display: none !important; }
          .barcode-main { padding: 0 !important; }
          .label-slot { border: none !important; } /* remove dotted lines in print */
          .page-block { page-break-after: always; padding: 0; margin: 0; }
        }
      `}</style>
      
      <div className="print-layout">
        {/* Sidebar mimicking User HTML */}
        <div className="sidebar d-print-none">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/label-maker'); }} className="d-flex align-items-center pb-3 mb-3 link-dark text-decoration-none border-bottom" style={{ borderBottom: '1px solid #dee2e6' }}>
             <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>⚙ Menu</span>
          </a>
          
          <ul className="list-unstyled ps-0">
            <li>
              <div className="d-grid gap-2">
                <button className="btn btn-primary mb-3" onClick={() => window.print()}>print directly</button>
                <button className="btn btn-primary mb-3" onClick={() => alert('Download as PDF handled by full export functionality.')}>download as PDF</button>
                <button className="btn btn-warning mb-5" onClick={() => navigate('/label-maker')}>return to input</button>
              </div>
            </li>
            
            <li className="mb-1 section-box">
              <button className="btn btn-toggle w-100" style={{textAlign: 'left'}} >Download ZIP with ...</button>
              <div className="collapse-inner">
                <ul className="list-unstyled fw-normal pb-1 small">
                  <li><a href="#" onClick={e => e.preventDefault()} className="link-dark">... PNG files</a></li>
                  <li><a href="#" onClick={e => e.preventDefault()} className="link-dark">... JPG files</a></li>
                  <li><a href="#" onClick={e => e.preventDefault()} className="link-dark">... SVG files</a></li>
                </ul>
              </div>
            </li>

            <li className="mb-1 section-box">
              <button className="btn btn-toggle w-100" style={{textAlign: 'left'}} >Download PDF with ...</button>
              <div className="collapse-inner">
                <ul className="list-unstyled fw-normal pb-1 small">
                  <li><a href="#" onClick={e => e.preventDefault()} className="link-dark">2 column PDF</a></li>
                  <li><a href="#" onClick={e => e.preventDefault()} className="link-dark">all Barcodes in one File</a></li>
                </ul>
              </div>
            </li>

            <li className="mb-1 section-box">
              <button className="btn btn-toggle w-100" style={{textAlign: 'left'}} >change display ...</button>
              <div className="collapse-inner">
                <ul className="list-unstyled fw-normal pb-1 small">
                  <li><a href="#" onClick={(e) => { e.preventDefault(); setColumns(1); }} className="link-dark">to 1 column</a></li>
                  <li><a href="#" onClick={(e) => { e.preventDefault(); setColumns(2); }} className="link-dark">to 2 columns</a></li>
                  <li><a href="#" onClick={(e) => { e.preventDefault(); setColumns(3); }} className="link-dark pb-3">to 3 columns</a></li>
                  <li><a href="#" onClick={(e) => { e.preventDefault(); setPadding(5); }} className="link-dark">small padding</a></li>
                  <li><a href="#" onClick={(e) => { e.preventDefault(); setPadding(25); }} className="link-dark">medium padding</a></li>
                  <li><a href="#" onClick={(e) => { e.preventDefault(); setPadding(50); }} className="link-dark">big padding</a></li>
                  <li><a href="#" onClick={(e) => { e.preventDefault(); setPadding(0); }} className="link-dark">w/o padding</a></li>
                </ul>
              </div>
            </li>

            <li className="mb-1 section-box">
              <button className="btn btn-toggle w-100" style={{textAlign: 'left'}} >print directly options</button>
              <div className="collapse-inner">
                <ul className="list-unstyled fw-normal pb-1 small">
                  <li>
                    <label style={{ display: 'flex', gap: '8px', alignItems:'center', cursor: 'pointer', padding: '4px 8px', fontSize: '.875em' }}>
                      <input type="checkbox" checked={pageBreak} onChange={(e) => setPageBreak(e.target.checked)} />
                      one page per barcode
                    </label>
                  </li>
                </ul>
              </div>
            </li>

            <li className="mb-1 section-box">
              <button className="btn btn-toggle w-100" style={{textAlign: 'left'}} >Duplicate copies ...</button>
              <div className="collapse-inner">
                <ul className="list-unstyled fw-normal pb-1 small">
                  <li style={{ padding: '4px 8px' }}>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      {[1, 2, 3, 4].map(n => (
                        <button
                          key={n}
                          onClick={() => setDuplicateCopies(n)}
                          style={{
                            padding: '3px 10px', borderRadius: '6px', border: '1px solid #ced4da',
                            background: duplicateCopies === n ? '#0d6efd' : '#fff',
                            color: duplicateCopies === n ? '#fff' : '#212529',
                            cursor: 'pointer', fontSize: '13px', fontWeight: 500
                          }}
                        >
                          {n}×
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#6c757d' }}>Custom:</span>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={duplicateCopies}
                        onChange={e => setDuplicateCopies(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{ width: '60px', padding: '2px 6px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '13px' }}
                      />
                      <span style={{ fontSize: '12px', color: '#6c757d' }}>copies each</span>
                    </div>
                  </li>
                </ul>
              </div>
            </li>
          </ul>
        </div>
        
        {/* Main rendering area */}
        <div className="barcode-main">
          {isGenerating ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280' }}>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p>Generating high-quality labels...</p>
            </div>
          ) : (
            <div className="page-block">
              <div className="grid-container" style={{ gridTemplateColumns: pageBreak ? '1fr' : `repeat(${columns}, 1fr)`, gap: `${padding}px` }}>
                {images.flatMap((src, i) =>
                  Array.from({ length: duplicateCopies }, (_, d) => (
                    <div key={`${i}-${d}`} className="label-slot" style={{ pageBreakAfter: pageBreak ? 'always' : 'auto', paddingBottom: pageBreak ? 0 : `${padding}px` }}>
                      {src ? <img src={src} alt={`Label ${i} copy ${d + 1}`} /> : <span>Error rendering</span>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
