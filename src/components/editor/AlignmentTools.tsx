import { useEditor } from '@/contexts/EditorContext';
import { Button } from '@/components/ui/button';
import { AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter, AlignStartVertical, AlignEndVertical, AlignStartHorizontal, AlignEndHorizontal, AlignHorizontalSpaceBetween, AlignVerticalSpaceBetween } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const AlignmentTools = () => {
  const { selectedIds, alignElements, distributeElements } = useEditor();

  if (selectedIds.size < 2) return null;

  return (
    <div>
      <Separator className="mb-3" />
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        Alignment ({selectedIds.size} selected)
      </p>
      <div className="flex flex-wrap gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => alignElements('left')} title="Align Left">
          <AlignStartVertical className="w-3.5 h-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => alignElements('center')} title="Align Center H">
          <AlignHorizontalJustifyCenter className="w-3.5 h-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => alignElements('right')} title="Align Right">
          <AlignEndVertical className="w-3.5 h-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => alignElements('top')} title="Align Top">
          <AlignStartHorizontal className="w-3.5 h-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => alignElements('middle')} title="Align Middle V">
          <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => alignElements('bottom')} title="Align Bottom">
          <AlignEndHorizontal className="w-3.5 h-3.5" />
        </Button>
        <div className="border-l border-border mx-0.5" />
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => distributeElements('horizontal')} title="Distribute Horizontally">
          <AlignHorizontalSpaceBetween className="w-3.5 h-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => distributeElements('vertical')} title="Distribute Vertically">
          <AlignVerticalSpaceBetween className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default AlignmentTools;
