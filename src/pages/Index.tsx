import { useRef } from 'react';
import { EditorProvider } from '@/contexts/EditorContext';
import EditorNavbar from '@/components/editor/EditorNavbar';
import LeftSidebar from '@/components/editor/LeftSidebar';
import DesignCanvas, { DesignCanvasHandle } from '@/components/editor/DesignCanvas';
import RightPanel from '@/components/editor/RightPanel';
import Konva from 'konva';

const IndexInner = () => {
  const canvasRef = useRef<DesignCanvasHandle>(null);
  const getStageRef = () => ({ current: canvasRef.current?.getStage() ?? null } as React.RefObject<Konva.Stage>);

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

const Index = () => (
  <EditorProvider>
    <IndexInner />
  </EditorProvider>
);

export default Index;
