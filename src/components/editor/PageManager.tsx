import { useRef } from 'react';
import { Plus, Copy, Trash2, ChevronLeft, ChevronRight, FileText, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEditor } from '@/contexts/EditorContext';
import { cn } from '@/lib/utils';

const PageManager = () => {
  const { pages, currentPageIndex, addPage, deletePage, duplicatePage, switchPage, reorderPages } = useEditor();
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      reorderPages(dragItem.current, dragOverItem.current);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 border-t border-border bg-card">
      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={addPage} title="Add page">
        <Plus className="w-3.5 h-3.5" />
      </Button>

      <div className="flex items-center gap-1 overflow-x-auto flex-1 scrollbar-none">
        {pages.map((page, i) => (
          <button
            key={page.id}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragEnter={() => handleDragEnter(i)}
            onDragEnd={handleDragEnd}
            onDragOver={e => e.preventDefault()}
            onClick={() => switchPage(i)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors shrink-0 cursor-grab active:cursor-grabbing",
              i === currentPageIndex
                ? "bg-primary/10 text-primary font-medium border border-primary/30"
                : "text-muted-foreground hover:bg-muted border border-transparent"
            )}
          >
            <GripVertical className="w-2.5 h-2.5 opacity-50" />
            <FileText className="w-3 h-3" />
            Page {i + 1}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-0.5 shrink-0 border-l border-border pl-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => switchPage(Math.max(0, currentPageIndex - 1))}
          disabled={currentPageIndex === 0}
          title="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
        <span className="text-[10px] text-muted-foreground w-12 text-center">
          {currentPageIndex + 1} / {pages.length}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => switchPage(Math.min(pages.length - 1, currentPageIndex + 1))}
          disabled={currentPageIndex === pages.length - 1}
          title="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => duplicatePage(currentPageIndex)}
          title="Duplicate page"
        >
          <Copy className="w-3 h-3" />
        </Button>
        {pages.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={() => deletePage(currentPageIndex)}
            title="Delete page"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default PageManager;
