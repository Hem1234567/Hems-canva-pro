import { useState } from 'react';
import { useEditor } from '@/contexts/EditorContext';
import { Button } from '@/components/ui/button';
import { Eraser, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const BackgroundRemover = () => {
  const { selectedElement, updateElement } = useEditor();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  if (!selectedElement || selectedElement.type !== 'image' || !selectedElement.src) return null;

  const handleRemoveBackground = async () => {
    if (!selectedElement.src) {
      toast.error('No image source to analyze');
      return;
    }

    setLoading(true);
    setAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke('remove-background', {
        body: { imageUrl: selectedElement.src },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.analysis) {
        setAnalysis(data.analysis);
        
        // Apply a crop based on subject bounds to simulate background removal
        const bounds = data.analysis.subjectBounds;
        if (bounds) {
          const newX = selectedElement.x + selectedElement.width * bounds.x;
          const newY = selectedElement.y + selectedElement.height * bounds.y;
          const newW = selectedElement.width * bounds.width;
          const newH = selectedElement.height * bounds.height;
          
          updateElement(selectedElement.id, {
            x: Math.round(newX),
            y: Math.round(newY),
            width: Math.round(newW),
            height: Math.round(newH),
          });
        }

        toast.success('AI analysis complete! Image cropped to subject.');
      }
    } catch (err: any) {
      console.error('Background removal error:', err);
      toast.error(err.message || 'Failed to analyze image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3 h-3 text-primary" />
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">AI Background Tools</h4>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2 text-xs"
        onClick={handleRemoveBackground}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Eraser className="w-3.5 h-3.5" />
            AI Smart Crop
          </>
        )}
      </Button>

      {analysis && (
        <div className="bg-muted/50 rounded p-2 space-y-1">
          <p className="text-[10px] font-medium text-foreground">Subject: {analysis.subject}</p>
          <p className="text-[10px] text-muted-foreground">{analysis.recommendation}</p>
          {analysis.hasComplexBackground && (
            <p className="text-[10px] text-amber-600">⚠ Complex background detected</p>
          )}
        </div>
      )}
    </div>
  );
};

export default BackgroundRemover;
