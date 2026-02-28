import { EditorProvider } from '@/contexts/EditorContext';
import EditorNavbar from '@/components/editor/EditorNavbar';
import LeftSidebar from '@/components/editor/LeftSidebar';
import DesignCanvas from '@/components/editor/DesignCanvas';
import RightPanel from '@/components/editor/RightPanel';

const Index = () => {
  return (
    <EditorProvider>
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <EditorNavbar />
        <div className="flex flex-1 overflow-hidden">
          <LeftSidebar />
          <DesignCanvas />
          <RightPanel />
        </div>
      </div>
    </EditorProvider>
  );
};

export default Index;
