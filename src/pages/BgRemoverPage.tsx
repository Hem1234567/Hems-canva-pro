import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Upload, Trash2, Download, Copy,
  Wand2, Loader2, ImageOff, Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';

// ── MediaPipe singleton ────────────────────────────────────────────────────────
let segmenterPromise: Promise<ImageSegmenter> | null = null;

async function getSegmenter(): Promise<ImageSegmenter> {
  if (segmenterPromise) return segmenterPromise;
  segmenterPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
    );
    return ImageSegmenter.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',
        delegate: 'GPU',
      },
      outputCategoryMask: false,
      outputConfidenceMasks: true,
      runningMode: 'IMAGE',
    });
  })();
  return segmenterPromise;
}

// ── Remove background via smooth alpha mask ──────────────────────────────────
async function removeBg(file: File): Promise<Blob> {
  const segmenter = await getSegmenter();

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const imgEl = new Image();
  imgEl.width = canvas.width;
  imgEl.height = canvas.height;
  imgEl.src = canvas.toDataURL();
  await new Promise<void>(r => { imgEl.onload = () => r(); });

  const result = segmenter.segment(imgEl);
  const confMasks = result.confidenceMasks;
  if (!confMasks || confMasks.length === 0) throw new Error('Segmentation returned no confidence mask.');

  // selfie_segmenter usually returns 2 masks, but sometimes 1.
  // We grab the person mask if available, or the only mask.
  const personMask = confMasks.length > 1 ? confMasks[1] : confMasks[0];
  const maskArr = personMask.getAsFloat32Array();

  // Create an ImageData for the mask
  const maskWidth = personMask.width || canvas.width;
  const maskHeight = personMask.height || canvas.height;
  
  // Robust check: the 4 corners of a photo are almost always background.
  // If the mask values at the corners are high (~1.0), this is a background mask and we must invert it.
  const cornerSum = maskArr[0] + 
                    maskArr[maskWidth - 1] + 
                    maskArr[(maskHeight - 1) * maskWidth] + 
                    maskArr[maskHeight * maskWidth - 1];
  const isBackgroundMask = cornerSum > 2.0;

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = maskWidth;
  maskCanvas.height = maskHeight;
  const maskCtx = maskCanvas.getContext('2d')!;
  const maskImgData = maskCtx.createImageData(maskWidth, maskHeight);
  const mPx = maskImgData.data;
  
  for (let i = 0; i < maskArr.length; i++) {
    let alpha = maskArr[i];
    if (isBackgroundMask) alpha = 1.0 - alpha;
    
    // Adjust contrast for cleaner edges
    alpha = Math.max(0, Math.min(1, (alpha - 0.1) * 1.2));
    
    const val = Math.round(alpha * 255);
    mPx[i * 4] = 0;
    mPx[i * 4 + 1] = 0;
    mPx[i * 4 + 2] = 0;
    mPx[i * 4 + 3] = val; // The alpha channel acts as the mask
  }
  maskCtx.putImageData(maskImgData, 0, 0);
  
  // Composite the mask onto the original image
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(maskCanvas, 0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'source-over'; // Reset

  confMasks.forEach(m => m.close());

  return new Promise<Blob>((res, rej) =>
    canvas.toBlob(b => b ? res(b) : rej(new Error('toBlob failed')), 'image/png')
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function BgRemoverPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png');

  // ── File handling ───────────────────────────────────────────────────────────
  const handleFile = useCallback((file: File) => {
    const valid = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!valid.includes(file.type)) { toast.error('Unsupported format. Use JPG, PNG, or WebP.'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('File too large. Max 10 MB.'); return; }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);

    setOriginalFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResultBlob(null);
    setResultUrl(null);
  }, [previewUrl, resultUrl]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  // ── Background removal ──────────────────────────────────────────────────────
  const handleRemoveBg = async () => {
    if (!originalFile) return;
    setProcessing(true);
    try {
      toast.info('Loading AI model… first run may take ~15 s.');
      const blob = await removeBg(originalFile);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
      toast.success('Background removed!');
    } catch (err: any) {
      console.error('BG removal error:', err);
      toast.error(`Failed: ${err?.message ?? 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  // ── Reset ───────────────────────────────────────────────────────────────────
  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setOriginalFile(null); setPreviewUrl(null);
    setResultBlob(null); setResultUrl(null);
  };

  // ── Download ────────────────────────────────────────────────────────────────
  const download = () => {
    if (!resultBlob) return;
    if (exportFormat === 'png') {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(resultBlob);
      a.download = `bg_removed_${Date.now()}.png`;
      a.click();
    } else {
      const img = new Image();
      const u = URL.createObjectURL(resultBlob);
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        const ctx = c.getContext('2d')!;
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0);
        c.toBlob(b => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(b!);
          a.download = `bg_removed_${Date.now()}.jpg`;
          a.click();
        }, 'image/jpeg', 0.92);
        URL.revokeObjectURL(u);
      };
      img.src = u;
    }
  };

  // ── Copy to clipboard ───────────────────────────────────────────────────────
  const copyToClipboard = async () => {
    if (!resultBlob) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ [resultBlob.type]: resultBlob })]);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Clipboard not supported. Try downloading instead.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md flex items-center gap-3 px-4 sm:px-6 h-14 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center">
            <Wand2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-foreground text-sm leading-none" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Magic BG Remover
            </h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">AI-powered · on-device · privacy-first</p>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6">

        {/* ── Left: Upload panel ── */}
        <section className="flex-1 min-w-0 space-y-5">
          <div>
            <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Background Remover</h2>
            <p className="text-sm text-muted-foreground mt-1">Upload an image — AI removes the background instantly in your browser.</p>
            <div className="mt-3 h-px bg-border" />
          </div>

          {/* Dropzone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !originalFile && fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-2xl transition-all',
              originalFile ? 'border-border cursor-default' : 'cursor-pointer',
              isDragOver ? 'border-primary bg-primary/5 scale-[1.01]' : originalFile ? 'border-border' : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/5'
            )}
          >
            {!originalFile ? (
              <div className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center">
                <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center', isDragOver ? 'brand-gradient' : 'bg-muted')}>
                  <Upload className={cn('w-7 h-7', isDragOver ? 'text-white' : 'text-muted-foreground')} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Click or drag &amp; drop an image</p>
                  <p className="text-sm text-muted-foreground mt-1">JPG · PNG · WebP — max 10 MB</p>
                </div>
                <Button className="brand-gradient border-0 text-white pointer-events-none gap-2" tabIndex={-1}>
                  <Upload className="w-4 h-4" /> Browse Image
                </Button>
              </div>
            ) : (
              <div className="p-4">
                <img src={previewUrl!} alt="Preview" className="w-full max-h-64 object-contain rounded-xl" />
                <p className="text-xs text-muted-foreground text-center mt-2 truncate">{originalFile.name}</p>
              </div>
            )}
          </div>

          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleInputChange} />

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleRemoveBg}
              disabled={!originalFile || processing}
              className="flex-1 gap-2 brand-gradient border-0 text-white hover:opacity-90 disabled:opacity-50"
            >
              {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : <><Wand2 className="w-4 h-4" /> Remove Background</>}
            </Button>
            <Button variant="outline" onClick={reset} disabled={!originalFile || processing} className="gap-2">
              <Trash2 className="w-4 h-4" /> Clear
            </Button>
          </div>

          {/* Export format */}
          <div className="border border-border rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Export Format</p>
            <select
              value={exportFormat}
              onChange={e => setExportFormat(e.target.value as 'png' | 'jpeg')}
              className="w-full px-3 py-2 rounded-xl border-2 border-border bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-all"
            >
              <option value="png">PNG — transparent background</option>
              <option value="jpeg">JPEG — white background fill</option>
            </select>
          </div>

          {/* Info */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-foreground/80 leading-relaxed flex items-start gap-2">
            <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span><strong>Privacy-first:</strong> The AI model runs entirely in your browser using Google MediaPipe. No image is ever sent to a server. First run downloads the model (~5 MB).</span>
          </div>
        </section>

        {/* ── Right: Result panel ── */}
        <section className="flex-1 min-w-0 flex flex-col gap-5">
          <div>
            <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Result Preview</h2>
            <p className="text-sm text-muted-foreground mt-1">Transparent PNG output — ready to copy or download.</p>
            <div className="mt-3 h-px bg-border" />
          </div>

          {/* Checkerboard result area */}
          <div
            className="flex-1 min-h-[280px] rounded-2xl flex items-center justify-center overflow-hidden"
            style={{ background: 'repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 0 0 / 20px 20px' }}
          >
            {processing ? (
              <div className="flex flex-col items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-8 py-6">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-sm font-medium text-foreground">AI is removing background…</p>
                <p className="text-xs text-muted-foreground">First run loads the model (~5 MB)</p>
              </div>
            ) : resultUrl ? (
              <img src={resultUrl} alt="Result" className="max-w-full max-h-[400px] object-contain rounded-xl shadow-lg" />
            ) : (
              <div className="flex flex-col items-center gap-3 text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-white/70 flex items-center justify-center shadow">
                  <ImageOff className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {originalFile ? 'Click "Remove Background" to process.' : 'Upload an image to get started.'}
                </p>
              </div>
            )}
          </div>

          {/* Download / Copy */}
          <div className="flex gap-3">
            <Button
              onClick={download}
              disabled={!resultBlob || processing}
              className="flex-1 gap-2 brand-gradient border-0 text-white hover:opacity-90 disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> Download
            </Button>
            <Button
              variant="outline"
              onClick={copyToClipboard}
              disabled={!resultBlob || processing}
              className="flex-1 gap-2"
            >
              <Copy className="w-4 h-4" /> Copy to Clipboard
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            🧠 Powered by <strong>Google MediaPipe</strong> — on-device AI selfie segmentation
          </p>
        </section>
      </div>
    </div>
  );
}
