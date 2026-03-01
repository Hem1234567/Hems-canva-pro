import { useRef, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EditorProvider, useEditor } from '@/contexts/EditorContext';
import { useAuth } from '@/contexts/AuthContext';
import EditorNavbar from '@/components/editor/EditorNavbar';
import LeftSidebar from '@/components/editor/LeftSidebar';
import DesignCanvas, { DesignCanvasHandle } from '@/components/editor/DesignCanvas';
import RightPanel from '@/components/editor/RightPanel';
import { supabase } from '@/integrations/supabase/client';
import { CanvasElement } from '@/types/editor';
import { toast } from 'sonner';
import Konva from 'konva';
import { PanelLeft, PanelRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const EditorInner = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const canvasRef = useRef<DesignCanvasHandle>(null);
  const { loadElements, setProjectName, setCanvasSize, elements, projectName, canvasWidth, canvasHeight, undo, redo, duplicateElement, selectedId, copyElement, pasteElement, selectAll, deleteSelected, selectedIds } = useEditor();
  const [loaded, setLoaded] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();
  const isMobile = useIsMobile();
  const [leftOpen, setLeftOpen] = useState(!isMobile);
  const [rightOpen, setRightOpen] = useState(!isMobile);

  const getStageRef = () => ({ current: canvasRef.current?.getStage() ?? null } as React.RefObject<Konva.Stage>);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth?mode=login', { replace: true });
  }, [user, authLoading, navigate]);

  // Close sidebars on mobile by default
  useEffect(() => {
    if (isMobile) {
      setLeftOpen(false);
      setRightOpen(false);
    }
  }, [isMobile]);

  // Load project
  useEffect(() => {
    if (!projectId || !user) return;
    const load = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      if (error || !data) { toast.error('Project not found'); navigate('/dashboard'); return; }
      setProjectName(data.name);
      setCanvasSize(data.canvas_width, data.canvas_height);
      const els = (data.elements as unknown as CanvasElement[]) || [];
      loadElements(els);
      setLoaded(true);
    };
    load();
  }, [projectId, user]);

  // Auto-save with debounce
  const saveProject = useCallback(async () => {
    if (!projectId || !loaded || !user) return;
    await supabase.from('projects').update({
      name: projectName,
      canvas_width: canvasWidth,
      canvas_height: canvasHeight,
      elements: elements as any,
    }).eq('id', projectId);
  }, [projectId, loaded, user, projectName, canvasWidth, canvasHeight, elements]);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(saveProject, 2000);
    return () => { if (saveTimeout.current) clearTimeout(saveTimeout.current); };
  }, [elements, projectName, canvasWidth, canvasHeight, saveProject]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === 's') {
        e.preventDefault();
        saveProject().then(() => toast.success('Project saved'));
      } else if (mod && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        redo();
      } else if (mod && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if (mod && e.key === 'd') {
        e.preventDefault();
        if (selectedId) duplicateElement(selectedId);
      } else if (mod && e.key === 'c') {
        e.preventDefault();
        copyElement();
      } else if (mod && e.key === 'v') {
        e.preventDefault();
        pasteElement();
      } else if (mod && e.key === 'a') {
        e.preventDefault();
        selectAll();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveProject, undo, redo, duplicateElement, selectedId, copyElement, pasteElement, selectAll]);

  if (authLoading || !loaded) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Loading editor...</p></div>;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <EditorNavbar stageRef={getStageRef()} />

      {/* Mobile toggle bar */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-border bg-card md:hidden">
        <Button variant={leftOpen ? 'default' : 'ghost'} size="sm" className="gap-1 text-xs h-7" onClick={() => { setLeftOpen(!leftOpen); if (!leftOpen) setRightOpen(false); }}>
          <PanelLeft className="w-3.5 h-3.5" /> Tools
        </Button>
        <Button variant={rightOpen ? 'default' : 'ghost'} size="sm" className="gap-1 text-xs h-7" onClick={() => { setRightOpen(!rightOpen); if (!rightOpen) setLeftOpen(false); }}>
          <PanelRight className="w-3.5 h-3.5" /> Properties
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar - overlay on mobile */}
        {leftOpen && (
          <>
            {isMobile && <div className="absolute inset-0 bg-black/30 z-20" onClick={() => setLeftOpen(false)} />}
            <div className={cn(
              "z-30 h-full",
              isMobile ? "absolute left-0 top-0 bottom-0 shadow-xl" : "relative"
            )}>
              <LeftSidebar />
            </div>
          </>
        )}

        {/* Canvas - always visible */}
        <DesignCanvas ref={canvasRef} />

        {/* Right Panel - overlay on mobile */}
        {rightOpen && (
          <>
            {isMobile && <div className="absolute inset-0 bg-black/30 z-20" onClick={() => setRightOpen(false)} />}
            <div className={cn(
              "z-30 h-full",
              isMobile ? "absolute right-0 top-0 bottom-0 shadow-xl" : "relative"
            )}>
              <RightPanel />
            </div>
          </>
        )}

        {/* Desktop sidebar toggles */}
        {!isMobile && !leftOpen && (
          <Button variant="ghost" size="icon" className="absolute left-2 top-2 z-10 h-8 w-8 bg-card border border-border shadow-sm" onClick={() => setLeftOpen(true)}>
            <PanelLeft className="w-4 h-4" />
          </Button>
        )}
        {!isMobile && leftOpen && (
          <Button variant="ghost" size="icon" className="absolute left-[286px] top-2 z-10 h-6 w-6 bg-card border border-border shadow-sm" onClick={() => setLeftOpen(false)}>
            <X className="w-3 h-3" />
          </Button>
        )}
        {!isMobile && !rightOpen && (
          <Button variant="ghost" size="icon" className="absolute right-2 top-2 z-10 h-8 w-8 bg-card border border-border shadow-sm" onClick={() => setRightOpen(true)}>
            <PanelRight className="w-4 h-4" />
          </Button>
        )}
        {!isMobile && rightOpen && (
          <Button variant="ghost" size="icon" className="absolute right-[306px] top-2 z-10 h-6 w-6 bg-card border border-border shadow-sm" onClick={() => setRightOpen(false)}>
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
};

const Editor = () => (
  <EditorProvider>
    <EditorInner />
  </EditorProvider>
);

export default Editor;
