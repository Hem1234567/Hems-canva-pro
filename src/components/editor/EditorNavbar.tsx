import { Undo2, Redo2, ZoomIn, ZoomOut, Eye, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEditor } from '@/contexts/EditorContext';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import ExportDialog from './ExportDialog';
import Konva from 'konva';

interface EditorNavbarProps {
  stageRef: React.RefObject<Konva.Stage>;
}

const EditorNavbar = ({ stageRef }: EditorNavbarProps) => {
  const { projectName, setProjectName, undo, redo, zoom, setZoom } = useEditor();
  const [editing, setEditing] = useState(false);

  return (
    <header className="h-16 border-b border-border bg-card flex items-center px-4 gap-3 shrink-0">
      <Link to="/dashboard">
        <Button variant="ghost" size="icon" title="Back to Dashboard">
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </Link>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">LF</span>
        </div>
        <span className="font-semibold text-foreground hidden sm:inline">LabelForge</span>
      </div>

      {editing ? (
        <input
          className="bg-secondary border border-border rounded px-2 py-1 text-sm font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={e => e.key === 'Enter' && setEditing(false)}
          autoFocus
        />
      ) : (
        <button onClick={() => setEditing(true)} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
          {projectName}
        </button>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={undo} title="Undo">
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={redo} title="Redo">
          <Redo2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 border-l border-border pl-3">
        <Button variant="ghost" size="icon" onClick={() => setZoom(Math.max(0.25, zoom - 0.1))}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-xs font-medium text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="icon" onClick={() => setZoom(Math.min(3, zoom + 0.1))}>
          <ZoomIn className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2 border-l border-border pl-3">
        <Button variant="ghost" size="sm" className="gap-1.5">
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline">Preview</span>
        </Button>
        <ExportDialog stageRef={stageRef} />
      </div>
    </header>
  );
};

export default EditorNavbar;
