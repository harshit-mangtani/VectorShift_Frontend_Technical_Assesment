import { useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import { useStore } from '../store';
import { initialNodeData } from '../nodes/registry';

let dropped = 0;

export const useAddNode = () => {
  const { screenToFlowPosition } = useReactFlow();
  const addNode = useStore((s) => s.addNode);
  const getNodeID = useStore((s) => s.getNodeID);

  return useCallback(
    (type, position) => {
      const id = getNodeID(type);

      const i = dropped++;
      const dx = (i % 6) * 30;
      const dy = (i % 6) * 24 + (Math.floor(i / 6) % 4) * 26;

      addNode({
        id,
        type,
        position:
          position ??
          screenToFlowPosition({
            x: window.innerWidth / 2 + dx,
            y: window.innerHeight / 2 - 120 + dy,
          }),
        data: initialNodeData(type, id),
      });
    },
    [addNode, getNodeID, screenToFlowPosition]
  );
};
