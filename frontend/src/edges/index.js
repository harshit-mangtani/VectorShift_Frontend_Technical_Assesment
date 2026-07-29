import { TrimmedEdge } from './TrimmedEdge';
import { CurvedEdge } from './CurvedEdge';

// Built once at module scope — React Flow rebuilds its internals if this identity changes.
export const edgeTypes = { trimmed: TrimmedEdge, curved: CurvedEdge };
