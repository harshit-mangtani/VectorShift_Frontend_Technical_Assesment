import { ReactFlowProvider } from 'reactflow';
import { Workflow } from 'lucide-react';
import { PipelineToolbar } from './toolbar';
import { PipelineUI } from './ui';
import { SubmitButton } from './submit';
import { ClearAllButton } from './components/ClearAllButton';
import { useAddNode } from './hooks/useAddNode';

const Workspace = () => {
  const addNode = useAddNode();

  return (
    // The canvas fills the viewport and the header floats over it, so nodes and grid
    // pass underneath and are genuinely refracted rather than sitting beside the glass.
    <div className="relative h-full">
      <main className="absolute inset-0">
        <PipelineUI />
        <PipelineToolbar onAdd={addNode} />
      </main>

      <header
        // No border: depth comes from the cast shadow and the blur itself.
        className="absolute inset-x-0 top-0 z-20 flex h-14 items-center justify-between
                   bg-white/25 px-3 backdrop-blur-2xl backdrop-saturate-150
                   shadow-[0_10px_30px_-14px_rgba(28,33,63,.45),0_2px_8px_-4px_rgba(28,33,63,.16)]
                   sm:px-4"
      >
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-xl
                       bg-gradient-to-br from-brand to-cat-llm text-white shadow-card"
          >
            <Workflow size={16} strokeWidth={2.2} />
          </span>
          <span className="hidden text-sm font-semibold tracking-tight xs:inline">
            Pipeline Builder
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ClearAllButton />
          <SubmitButton />
        </div>
      </header>
    </div>
  );
};

const App = () => (
  <ReactFlowProvider>
    <Workspace />
  </ReactFlowProvider>
);

export default App;
