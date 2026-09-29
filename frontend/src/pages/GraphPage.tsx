import React, { useState } from 'react';
import { GraphCanvas } from '../components/GraphCanvas';
import { EntityInspector } from '../components/EntityInspector';
import type { 
  GraphNodeData, 
  GraphEdgeData, 
  AlgorithmMode 
} from '../types/graph';
import { ChevronLeft } from 'lucide-react';

interface GraphPageProps {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  selectedEntity: GraphNodeData | null;
  onSelectNode: (node: GraphNodeData | null) => void;
  highlightPath: string[];
  algorithmMode: AlgorithmMode;
  metricScores: Record<string, number>;
}

export const GraphPage: React.FC<GraphPageProps> = ({
  nodes,
  edges,
  selectedEntity,
  onSelectNode,
  highlightPath,
  algorithmMode,
  metricScores,
}) => {
  const [inspectorOpen, setInspectorOpen] = useState<boolean>(true);

  return (
    <div className="relative w-full h-[calc(100vh-130px)] min-h-[580px] flex gap-4 overflow-hidden">
      {/* Main Cytoscape Canvas (Flex 1) */}
      <div className="flex-1 h-full relative rounded-3xl overflow-hidden glass-panel border border-white/20 dark:border-white/10 shadow-2xl">
        <GraphCanvas
          nodes={nodes}
          edges={edges}
          selectedEntity={selectedEntity}
          onSelectNode={(node) => {
            onSelectNode(node);
            if (node) setInspectorOpen(true);
          }}
          highlightPath={highlightPath}
          algorithmMode={algorithmMode}
          metricScores={metricScores}
        />

        {/* Toggle Inspector Floating Button if closed */}
        {!inspectorOpen && (
          <button
            onClick={() => setInspectorOpen(true)}
            className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-semibold shadow-lg hover:bg-rose-600 transition-all"
          >
            <span>Open Inspector</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Retractable Entity Inspector Sidebar */}
      {inspectorOpen && (
        <aside className="w-80 md:w-96 h-full flex flex-col relative transition-all duration-300">
          <EntityInspector
            selectedEntity={selectedEntity}
            edges={edges}
            nodes={nodes}
            onClose={() => setInspectorOpen(false)}
            onSelectNode={onSelectNode}
          />
        </aside>
      )}
    </div>
  );
};
