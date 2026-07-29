import { ReactFlowProvider } from 'reactflow';
import { PipelineToolbar } from './toolbar';
import { PipelineUI } from './ui';
import { SubmitButton } from './submit';
import { ClearAllButton } from './components/ClearAllButton';
import { useAddNode } from './hooks/useAddNode';

const Workspace = () => {
  const addNode = useAddNode();

  return (
    <div className="relative h-full">
      <main className="absolute inset-0">
        <PipelineUI />
        <PipelineToolbar onAdd={addNode} />
      </main>

      <div className="absolute right-3 top-3 z-20 flex items-center gap-2 sm:right-4 sm:top-4">
        <ClearAllButton />
        <SubmitButton />
      </div>
    </div>
  );
};

const App = () => (
  <ReactFlowProvider>
    <Workspace />
  </ReactFlowProvider>
);

export default App;
