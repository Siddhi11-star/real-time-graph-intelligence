import React from 'react';
import type { GraphNodeData, GraphEdgeData } from '../types/graph';
import { 
  X, 
  ShieldAlert, 
  Compass
} from 'lucide-react';

interface EntityInspectorProps {
  selectedEntity: GraphNodeData | null;
  edges: GraphEdgeData[];
  nodes: GraphNodeData[];
  onClose: () => void;
  onSelectNode: (node: GraphNodeData | null) => void;
}

export const EntityInspector: React.FC<EntityInspectorProps> = ({
  selectedEntity,
  edges,
  nodes,
  onClose,
  onSelectNode,
}) => {
  if (!selectedEntity) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6 glass-panel rounded-2xl border border-white/[0.08] text-slate-500">
        <Compass className="w-8 h-8 text-slate-600 mb-2" />
        <h3 className="text-xs font-semibold text-slate-300">Entity Deep-Dive Inspector</h3>
        <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
          Click any node on the graph canvas or select an anomaly alert to inspect live attributes & 1-hop topology.
        </p>
      </div>
    );
  }

  // Find 1-hop neighbor relationships
  const connectedEdges = edges.filter(
    (e) => e.source === selectedEntity.id || e.target === selectedEntity.id
  );

  return (
    <div className="h-full flex flex-col glass-panel rounded-2xl p-4 overflow-hidden border border-white/[0.08]">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {selectedEntity.type}
            </span>
            {selectedEntity.isAnomaly && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-600 text-white flex items-center gap-1">
                <ShieldAlert className="w-2.5 h-2.5" />
                Compromised
              </span>
            )}
          </div>
          <h2 className="text-base font-bold text-white mt-1 font-mono tracking-tight">
            {selectedEntity.label}
          </h2>
          <p className="text-[10px] text-slate-400 font-mono">
            ID: {selectedEntity.id}
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pt-3 pr-1">
        {/* Risk Score Meter */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Composite Threat Risk</span>
            <span className={`font-mono font-bold ${
              selectedEntity.riskScore > 70 
                ? 'text-rose-400' 
                : selectedEntity.riskScore > 30 
                ? 'text-amber-400' 
                : 'text-emerald-400'
            }`}>
              {selectedEntity.riskScore} / 100
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                selectedEntity.riskScore > 70
                  ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                  : selectedEntity.riskScore > 30
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${selectedEntity.riskScore}%` }}
            />
          </div>
        </div>

        {/* Anomaly Explanation Note if present */}
        {selectedEntity.isAnomaly && selectedEntity.anomalyReason && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs">
            <div className="flex items-center gap-1.5 text-rose-300 font-bold mb-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Flagged Anomaly Rationale</span>
            </div>
            <p className="text-slate-200 leading-relaxed text-[11px]">
              {selectedEntity.anomalyReason}
            </p>
          </div>
        )}

        {/* Topological Graph Properties */}
        <div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            Topological Signatures
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/[0.02] p-2 rounded-xl border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 block">Degree Connections</span>
              <span className="font-mono font-semibold text-white mt-0.5 block">
                {connectedEdges.length} links
              </span>
            </div>
            <div className="bg-white/[0.02] p-2 rounded-xl border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 block">Community Cluster</span>
              <span className="font-mono font-semibold text-rose-300 mt-0.5 block">
                #{selectedEntity.communityId || 1}
              </span>
            </div>
          </div>
        </div>

        {/* Metadata Key-Value pairs */}
        {selectedEntity.metadata && Object.keys(selectedEntity.metadata).length > 0 && (
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Host / Asset Telemetry
            </span>
            <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] divide-y divide-white/[0.04] text-xs">
              {Object.entries(selectedEntity.metadata).map(([k, v]) => (
                <div key={k} className="p-2 flex items-center justify-between">
                  <span className="text-slate-400 capitalize">{k.replace('_', ' ')}</span>
                  <span className="font-mono text-slate-200">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 1-Hop Connected Neighbors */}
        <div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            1-Hop Incident Radius ({connectedEdges.length})
          </span>
          <div className="space-y-1.5">
            {connectedEdges.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No direct connections recorded.</p>
            ) : (
              connectedEdges.map((e) => {
                const isSource = e.source === selectedEntity.id;
                const neighborId = isSource ? e.target : e.source;
                const neighborNode = nodes.find((n) => n.id === neighborId);

                return (
                  <div
                    key={e.id}
                    onClick={() => neighborNode && onSelectNode(neighborNode)}
                    className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-rose-400/30 hover:bg-white/[0.04] cursor-pointer text-xs flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-300 border border-rose-500/25">
                        {e.label}
                      </span>
                      <span className="font-mono text-slate-200">
                        {neighborNode?.label || neighborId}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {isSource ? 'Outbound' : 'Inbound'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
