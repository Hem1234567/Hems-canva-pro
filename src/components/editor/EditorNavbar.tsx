import { Undo2, Redo2, ZoomIn, ZoomOut, Eye, ArrowLeft, Magnet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEditor } from '@/contexts/EditorContext';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import ExportDialog from './ExportDialog';
import PreviewDialog from './PreviewDialog';
import Konva from 'konva';

interface EditorNavbarProps {
  stageRef: React.RefObject<Konva.Stage>;
}

const EditorNavbar = ({ stageRef }: EditorNavbarProps) => {
  const { projectName, setProjectName, undo, redo, zoom, setZoom, snapEnabled, setSnapEnabled } = useEditor();
  const [editing, setEditing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <header className="h-12 sm:h-16 border-b border-border bg-card flex items-center px-2 sm:px-4 gap-1.5 sm:gap-3 shrink-0">
      <Link to="/dashboard">
        <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" title="Back to Dashboard">
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </Link>
      <div className="hidden sm:flex items-center gap-2">
        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">LF</span>
        </div>
        <span className="font-semibold text-foreground hidden lg:inline">LabelForge</span>
      </div>

      {editing ? (
        <input
          className="bg-secondary border border-border rounded px-2 py-1 text-sm font-medium text-foreground outline-none focus:ring-1 focus:ring-primary w-24 sm:w-auto"
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={e => e.key === 'Enter' && setEditing(false)}
          autoFocus
        />
      ) : (
        <button onClick={() => setEditing(true)} className="text-xs sm:text-sm font-medium text-foreground hover:text-primary transition-colors truncate max-w-[100px] sm:max-w-none">
          {projectName}
        </button>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-0.5 sm:gap-1">
        <Button variant="ghost" size="icon" onClick={undo} title="Undo" className="h-8 w-8">
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={redo} title="Redo" className="h-8 w-8">
          <Redo2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="hidden sm:flex items-center border-l border-border pl-2">
        <Button
          variant={snapEnabled ? 'default' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          onClick={() => setSnapEnabled(!snapEnabled)}
          title={snapEnabled ? 'Disable snapping' : 'Enable snapping'}
        >
          <Magnet className="w-4 h-4" />
        </Button>
      </div>

      <div className="hidden md:flex items-center gap-1 border-l border-border pl-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.max(0.25, zoom - 0.1))}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-xs font-medium text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.min(3, zoom + 0.1))}>
          <ZoomIn className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 border-l border-border pl-1.5 sm:pl-3">
        <Button variant="ghost" size="sm" className="gap-1 h-8 px-2 sm:px-3" onClick={() => setPreviewOpen(true)}>
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Preview</span>
        </Button>
        <ExportDialog stageRef={stageRef} />
      </div>

      <PreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} />
    </header>
  );
};

export default EditorNavbar;
