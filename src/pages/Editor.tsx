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

const EditorInner = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const canvasRef = useRef<DesignCanvasHandle>(null);
  const { loadElements, setProjectName, setCanvasSize, elements, projectName, canvasWidth, canvasHeight, undo, redo, duplicateElement, selectedId } = useEditor();
  const [loaded, setLoaded] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();

  const getStageRef = () => ({ current: canvasRef.current?.getStage() ?? null } as React.RefObject<Konva.Stage>);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth?mode=login', { replace: true });
  }, [user, authLoading, navigate]);

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
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveProject, undo, redo, duplicateElement, selectedId]);

  if (authLoading || !loaded) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Loading editor...</p></div>;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <EditorNavbar stageRef={getStageRef()} />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <DesignCanvas ref={canvasRef} />
        <RightPanel />
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
