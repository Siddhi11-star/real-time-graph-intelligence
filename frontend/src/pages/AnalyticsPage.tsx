import React, { useState } from 'react';
import type { 
  GraphNodeData, 
  GraphEdgeData, 
  AlgorithmMode, 
  AppPage 
} from '../types/graph';
import type { AlgorithmResults } from '../services/graphAlgorithms';
import { findShortestPath } from '../services/graphAlgorithms';
import { 
  Route, 
  BarChart3, 
  Layers, 
  RotateCw, 
  ArrowRight, 
  CheckCircle, 
  Flame, 
  Network,
  FileDown,
  Loader2
} from 'lucide-react';

interface AnalyticsPageProps {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  metrics: AlgorithmResults;
  algorithmMode: AlgorithmMode;
  onChangeAlgorithmMode: (mode: AlgorithmMode) => void;
  onSetHighlightPath: (path: string[]) => void;
  onSelectNode: (node: GraphNodeData | null) => void;
  onChangePage: (page: AppPage) => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  nodes,
  edges,
  metrics,
  algorithmMode,
  onChangeAlgorithmMode,
  onSetHighlightPath,
  onSelectNode,
  onChangePage,
}) => {
  const [activeTab, setActiveTab] = useState<'path' | 'centrality' | 'communities' | 'cycles'>('path');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const response = await fetch('http://localhost:8000/api/graph/reports/forensic-pdf');
      if (!response.ok) {
        throw new Error('Failed to generate forensic audit PDF');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `incident_forensic_report_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('PDF download error:', err);
      window.open('http://localhost:8000/api/graph/reports/forensic-pdf', '_blank');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Shortest path states
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

  const handleInspectPathOnGraph = () => {
    if (computedPath) {
      onSetHighlightPath(computedPath.path);
      onChangePage('graph');
    }
  };

  // Top PageRank
  const topPageRank = Object.entries(metrics.pageRank)
    .sort((a, b) => b[1] - a[1])
    .map(([id, score]) => ({
      id,
      label: nodes.find(n => n.id === id)?.label || id,
      score,
      type: nodes.find(n => n.id === id)?.type || 'User',
    }));

  // Top Degree
  const topDegree = Object.entries(metrics.degreeCentrality)
    .sort((a, b) => b[1] - a[1])
    .map(([id, score]) => ({
      id,
      label: nodes.find(n => n.id === id)?.label || id,
      score,
      type: nodes.find(n => n.id === id)?.type || 'User',
    }));

  // Community groups
  const communityGroups: Record<number, string[]> = {};
  Object.entries(metrics.communities).forEach(([nodeId, commId]) => {
    if (!communityGroups[commId]) communityGroups[commId] = [];
    communityGroups[commId].push(nodeId);
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/20 dark:border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Graph Analytics Laboratory</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white m-0">
            Topological Algorithms & NetworkX Metrics
          </h1>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Evaluate betweenness, degree centrality, PageRank authority scores, community partitions, and shortest traversal paths.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/70 dark:bg-white/[0.08] hover:bg-white/90 dark:hover:bg-white/[0.14] text-slate-800 dark:text-white border border-slate-300/70 dark:border-white/10 font-semibold text-xs shadow-sm transition-all disabled:opacity-60 cursor-pointer"
            title="Download compiled Incident Forensic Summary report as PDF"
          >
            {isDownloadingPdf ? (
              <Loader2 className="w-4 h-4 text-rose-500 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4 text-rose-500" />
            )}
            <span>{isDownloadingPdf ? 'Generating PDF...' : 'Forensic Audit PDF'}</span>
          </button>

          <button
            onClick={() => onChangePage('graph')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
          >
            <Network className="w-4 h-4" />
            <span>Switch to Canvas</span>
          </button>
        </div>
      </div>

      {/* Algorithm Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/[0.08] pb-3 text-xs md:text-sm font-medium overflow-x-auto">
        <button
          onClick={() => setActiveTab('path')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'path'
              ? 'bg-rose-500 text-white font-semibold shadow-md'
              : 'glass-panel text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Route className="w-4 h-4" />
          <span>Shortest Path (BFS)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('centrality');
            if (algorithmMode === 'none') onChangeAlgorithmMode('pagerank');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'centrality'
              ? 'bg-rose-500 text-white font-semibold shadow-md'
              : 'glass-panel text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Centrality & PageRank</span>
        </button>

        <button
          onClick={() => setActiveTab('communities')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'communities'
              ? 'bg-rose-500 text-white font-semibold shadow-md'
              : 'glass-panel text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Community Clustering ({Object.keys(communityGroups).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cycles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'cycles'
              ? 'bg-rose-500 text-white font-semibold shadow-md'
              : 'glass-panel text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <RotateCw className="w-4 h-4" />
          <span>Cycle Detection ({metrics.cycles.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'path' && (
        <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/20 dark:border-white/10 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white m-0">
              Shortest Path & Hop Traversal Finder
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Computes the unweighted BFS shortest relationship path between any two network assets or user identities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Source Entity
              </label>
              <select
                value={sourceNodeId}
                onChange={(e) => setSourceNodeId(e.target.value)}
                className="w-full bg-white/70 dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id} className="bg-slate-900 text-white">
                    [{n.type}] {n.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Target Entity
              </label>
              <select
                value={targetNodeId}
                onChange={(e) => setTargetNodeId(e.target.value)}
                className="w-full bg-white/70 dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id} className="bg-slate-900 text-white">
                    [{n.type}] {n.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleComputePath}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-md transition-all"
            >
              <Route className="w-4 h-4" />
              <span>Calculate Shortest Path</span>
            </button>

            {computedPath && (
              <button
                onClick={handleInspectPathOnGraph}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/60 dark:bg-white/[0.08] hover:bg-white/80 dark:hover:bg-white/[0.12] text-slate-900 dark:text-white border border-slate-300/60 dark:border-white/10 text-xs font-semibold transition-all"
              >
                <Network className="w-4 h-4 text-rose-500" />
                <span>Highlight on Graph Canvas</span>
              </button>
            )}
          </div>

          {computedPath && (
            <div className="p-5 rounded-2xl bg-white/40 dark:bg-white/[0.02] border border-rose-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Computed Traversal Distance:
                </span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                  {computedPath.distance} Hops
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap pt-2">
                {computedPath.path.map((nodeId, idx) => (
                  <React.Fragment key={nodeId}>
                    <span className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-700 dark:text-rose-200 border border-rose-500/30 font-mono text-xs font-semibold">
                      {nodes.find(n => n.id === nodeId)?.label || nodeId}
                    </span>
                    {idx < computedPath.path.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-rose-500" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'centrality' && (
        <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/20 dark:border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white m-0">
                Centrality & Authority Rankings
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Identifies high-influence bridges, critical domain controllers, and high-degree pivot targets.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-black/5 dark:bg-black/40 p-1 rounded-xl border border-black/5 dark:border-white/10 text-xs">
              <button
                onClick={() => onChangeAlgorithmMode('pagerank')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  algorithmMode === 'pagerank'
                    ? 'bg-rose-500 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                PageRank
              </button>
              <button
                onClick={() => onChangeAlgorithmMode('betweenness')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  algorithmMode === 'betweenness'
                    ? 'bg-rose-500 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Degree Centrality
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {(algorithmMode === 'pagerank' ? topPageRank : topDegree).map((item, idx) => (
              <div
                key={item.id}
                onClick={() => onSelectNode(nodes.find(n => n.id === item.id) || null)}
                className="p-3.5 rounded-2xl bg-white/40 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06] hover:border-rose-400/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400 font-bold">#{idx + 1}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{item.label}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({item.type})</span>
                  </div>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                    {item.score.toFixed(3)}
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500"
                    style={{ width: `${Math.min(100, item.score * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'communities' && (
        <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/20 dark:border-white/10 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white m-0">
              Community Subnet Detection
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Partitions the network into modular clusters based on inter-entity connection density using label propagation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(communityGroups).map(([commId, members]) => (
              <div
                key={commId}
                className="p-5 rounded-2xl bg-white/40 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.08]"
              >
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-bold text-rose-600 dark:text-rose-300">
                    Cluster Subnet #{commId}
                  </span>
                  <span className="font-mono text-slate-500">
                    {members.length} entities
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {members.map((mId) => {
                    const node = nodes.find(n => n.id === mId);
                    return (
                      <span
                        key={mId}
                        onClick={() => onSelectNode(node || null)}
                        className="text-xs px-2.5 py-1 rounded-xl bg-white/70 dark:bg-white/[0.04] hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-200 border border-slate-200 dark:border-white/10 cursor-pointer font-mono transition-colors"
                      >
                        {node?.label || mId}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'cycles' && (
        <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/20 dark:border-white/10 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white m-0">
              Directed Feedback Loop & Cycle Detection
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Detects circular dependencies or process execution loops (e.g. recursive process injection).
            </p>
          </div>

          {metrics.cycles.length === 0 ? (
            <div className="p-8 text-center bg-white/40 dark:bg-white/[0.02] rounded-2xl border border-slate-200 dark:border-white/06">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Topology is Fully Acyclic
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                No circular directed loops detected across active connections.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.cycles.map((cyc, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 mb-2">
                    <Flame className="w-4 h-4" />
                    <span>Circular Loop #{idx + 1}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
                    {cyc.map((nodeId, cIdx) => (
                      <React.Fragment key={cIdx}>
                        <span className="font-bold text-rose-700 dark:text-rose-200">{nodeId}</span>
                        {cIdx < cyc.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-rose-500" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
