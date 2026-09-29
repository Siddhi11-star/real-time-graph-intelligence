import React, { useState } from 'react';
import type { 
  GraphNodeData, 
  GraphEdgeData, 
  AlgorithmMode 
} from '../types/graph';
import type { AlgorithmResults } from '../services/graphAlgorithms';
import { findShortestPath } from '../services/graphAlgorithms';
import { 
  Network, 
  Route, 
  BarChart2, 
  Layers, 
  RotateCw, 
  ArrowRight, 
  CheckCircle, 
  Flame
} from 'lucide-react';

interface GraphAnalyticsPanelProps {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  metrics: AlgorithmResults;
  algorithmMode: AlgorithmMode;
  onChangeAlgorithmMode: (mode: AlgorithmMode) => void;
  onSetHighlightPath: (path: string[]) => void;
  onSelectNode: (node: GraphNodeData | null) => void;
}

export const GraphAnalyticsPanel: React.FC<GraphAnalyticsPanelProps> = ({
  nodes,
  edges,
  metrics,
  algorithmMode,
  onChangeAlgorithmMode,
  onSetHighlightPath,
  onSelectNode,
}) => {
  const [activeTab, setActiveTab] = useState<'path' | 'centrality' | 'communities' | 'cycles'>('path');

  // Shortest path inputs
  const [sourceNodeId, setSourceNodeId] = useState<string>(nodes[0]?.id || '');
  const [targetNodeId, setTargetNodeId] = useState<string>(nodes[1]?.id || '');
  const [computedPath, setComputedPath] = useState<{ path: string[]; edgeIds: string[]; distance: number } | null>(null);

  const handleComputePath = () => {
    if (!sourceNodeId || !targetNodeId) return;
    const res = findShortestPath(sourceNodeId, targetNodeId, nodes, edges);
    setComputedPath(res);
    if (res) {
      onSetHighlightPath(res.path);
    } else {
      onSetHighlightPath([]);
    }
  };

  const handleClearPath = () => {
    setComputedPath(null);
    onSetHighlightPath([]);
  };

  // Top PageRank nodes
  const topPageRank = Object.entries(metrics.pageRank)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, score]) => ({
      id,
      label: nodes.find(n => n.id === id)?.label || id,
      score,
      type: nodes.find(n => n.id === id)?.type || 'User',
    }));

  // Top Degree nodes
  const topDegree = Object.entries(metrics.degreeCentrality)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, score]) => ({
      id,
      label: nodes.find(n => n.id === id)?.label || id,
      score,
      type: nodes.find(n => n.id === id)?.type || 'User',
    }));

  // Group communities
  const communityGroups: Record<number, string[]> = {};
  Object.entries(metrics.communities).forEach(([nodeId, commId]) => {
    if (!communityGroups[commId]) communityGroups[commId] = [];
    communityGroups[commId].push(nodeId);
  });

  return (
    <div className="h-full flex flex-col glass-panel rounded-2xl p-4 overflow-hidden border border-white/[0.08]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white m-0">Graph Analytics & Algorithms</h2>
            <p className="text-[11px] text-slate-400">
              NetworkX-grade topological metrics & pathfinding
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 py-2.5 border-b border-white/[0.06] text-xs">
        <button
          onClick={() => setActiveTab('path')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
            activeTab === 'path'
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-200 font-semibold shadow-sm'
              : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-slate-200'
          }`}
        >
          <Route className="w-3.5 h-3.5 text-rose-400" />
          <span>Shortest Path</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('centrality');
            if (algorithmMode === 'none') onChangeAlgorithmMode('pagerank');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
            activeTab === 'centrality'
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-200 font-semibold shadow-sm'
              : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5 text-rose-400" />
          <span>Centrality</span>
        </button>

        <button
          onClick={() => setActiveTab('communities')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
            activeTab === 'communities'
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-200 font-semibold shadow-sm'
              : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-rose-400" />
          <span>Communities</span>
        </button>

        <button
          onClick={() => setActiveTab('cycles')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
            activeTab === 'cycles'
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-200 font-semibold shadow-sm'
              : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-slate-200'
          }`}
        >
          <RotateCw className="w-3.5 h-3.5 text-rose-400" />
          <span>Cycles ({metrics.cycles.length})</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto pt-3 space-y-3 pr-1">
        {/* TAB 1: Shortest Path */}
        {activeTab === 'path' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Source Entity</label>
                <select
                  value={sourceNodeId}
                  onChange={(e) => setSourceNodeId(e.target.value)}
                  className="w-full bg-black/40 border border-white/[0.1] rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-400/50"
                >
                  {nodes.map(n => (
                    <option key={n.id} value={n.id} className="bg-slate-900 text-white">
                      [{n.type}] {n.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Target Entity</label>
                <select
                  value={targetNodeId}
                  onChange={(e) => setTargetNodeId(e.target.value)}
                  className="w-full bg-black/40 border border-white/[0.1] rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-400/50"
                >
                  {nodes.map(n => (
                    <option key={n.id} value={n.id} className="bg-slate-900 text-white">
                      [{n.type}] {n.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleComputePath}
                className="flex-1 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/25 hover:bg-rose-500/35 border border-rose-500/40 text-rose-200 transition-all flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(244,114,142,0.15)]"
              >
                <Route className="w-3.5 h-3.5 text-rose-400" />
                <span>Find Shortest Path (BFS)</span>
              </button>

              {computedPath && (
                <button
                  onClick={handleClearPath}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white bg-white/[0.04] border border-white/[0.08]"
                >
                  Clear
                </button>
              )}
            </div>

            {computedPath && (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-rose-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Path Length:</span>
                  <span className="font-mono font-bold text-rose-400">{computedPath.distance} hops</span>
                </div>

                <div className="flex items-center gap-1 flex-wrap font-mono text-[11px] pt-1">
                  {computedPath.path.map((nodeId, idx) => (
                    <React.Fragment key={nodeId}>
                      <span className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-200 font-semibold">
                        {nodes.find(n => n.id === nodeId)?.label || nodeId}
                      </span>
                      {idx < computedPath.path.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-rose-400" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Centrality Leaderboard */}
        {activeTab === 'centrality' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Metric Mode:</span>
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/[0.08] text-[11px]">
                <button
                  onClick={() => onChangeAlgorithmMode('pagerank')}
                  className={`px-2 py-0.5 rounded-lg transition-colors ${
                    algorithmMode === 'pagerank'
                      ? 'bg-rose-500/25 text-rose-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  PageRank
                </button>
                <button
                  onClick={() => onChangeAlgorithmMode('betweenness')}
                  className={`px-2 py-0.5 rounded-lg transition-colors ${
                    algorithmMode === 'betweenness'
                      ? 'bg-rose-500/25 text-rose-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Degree
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {(algorithmMode === 'pagerank' ? topPageRank : topDegree).map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => onSelectNode(nodes.find(n => n.id === item.id) || null)}
                  className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-rose-400/30 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500 font-bold">#{idx + 1}</span>
                      <span className="text-white font-medium">{item.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({item.type})</span>
                    </div>
                    <span className="font-mono font-bold text-rose-400">
                      {item.score.toFixed(3)}
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-400 to-pink-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, item.score * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Community Clusters */}
        {activeTab === 'communities' && (
          <div className="space-y-2.5">
            <p className="text-[11px] text-slate-400">
              Clustered using modularity & label propagation into {Object.keys(communityGroups).length} distinct subnet communities:
            </p>

            {Object.entries(communityGroups).map(([commId, memberIds]) => (
              <div
                key={commId}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08]"
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-rose-300">
                    Community Cluster #{commId}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {memberIds.length} members
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {memberIds.map(mId => {
                    const node = nodes.find(n => n.id === mId);
                    return (
                      <span
                        key={mId}
                        onClick={() => onSelectNode(node || null)}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 hover:text-rose-200 border border-white/[0.06] cursor-pointer text-slate-300 font-mono transition-colors"
                      >
                        {node?.label || mId}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: Cycles */}
        {activeTab === 'cycles' && (
          <div className="space-y-2.5">
            {metrics.cycles.length === 0 ? (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                <CheckCircle className="w-6 h-6 text-emerald-400/80 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-white">No Directed Cycles Found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Topology is acyclic across current directional dependencies.
                </p>
              </div>
            ) : (
              metrics.cycles.map((cyc, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-rose-500/[0.07] border border-rose-500/30">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300 mb-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    <span>Cycle Loop #{idx + 1} Detected</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-300 flex items-center gap-1 flex-wrap">
                    {cyc.map((nodeId, cIdx) => (
                      <React.Fragment key={cIdx}>
                        <span className="text-rose-200 font-semibold">{nodeId}</span>
                        {cIdx < cyc.length - 1 && <ArrowRight className="w-2.5 h-2.5 text-rose-400" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
