import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import type { Core, LayoutOptions } from 'cytoscape';
import type { 
  GraphNodeData, 
  GraphEdgeData, 
  EntityType, 
  AlgorithmMode 
} from '../types/graph';
import { 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  Search, 
  Filter,
  Route,
  Sparkles
} from 'lucide-react';

interface GraphCanvasProps {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  selectedEntity: GraphNodeData | null;
  onSelectNode: (node: GraphNodeData | null) => void;
  highlightPath: string[]; // Node IDs in shortest path
  algorithmMode: AlgorithmMode;
  metricScores: Record<string, number>; // PageRank or Degree Centrality scores
}

const ENTITY_COLORS: Record<EntityType, { bg: string; border: string; glow: string }> = {
  User: { bg: '#f472b6', border: '#fda4af', glow: 'rgba(244, 114, 182, 0.4)' },
  Device: { bg: '#38bdf8', border: '#7dd3fc', glow: 'rgba(56, 189, 248, 0.4)' },
  IP: { bg: '#fbbf24', border: '#fde68a', glow: 'rgba(251, 191, 36, 0.4)' },
  Domain: { bg: '#34d399', border: '#a7f3d0', glow: 'rgba(52, 211, 153, 0.4)' },
  Process: { bg: '#c084fc', border: '#e9d5ff', glow: 'rgba(192, 132, 252, 0.4)' },
  Session: { bg: '#818cf8', border: '#c7d2fe', glow: 'rgba(129, 140, 248, 0.4)' },
};

const ENTITY_SHAPES: Record<EntityType, cytoscape.Css.NodeShape> = {
  User: 'ellipse',
  Device: 'round-rectangle',
  IP: 'hexagon',
  Domain: 'diamond',
  Process: 'round-tag',
  Session: 'barrel',
};

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  selectedEntity,
  onSelectNode,
  highlightPath,
  algorithmMode,
  metricScores,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  const [activeLayout, setActiveLayout] = useState<'cose' | 'concentric' | 'circle' | 'breadthfirst'>('cose');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTypes, setFilterTypes] = useState<Record<EntityType, boolean>>({
    User: true,
    Device: true,
    IP: true,
    Domain: true,
    Process: true,
    Session: true,
  });

  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'color': '#f8fafc',
            'font-family': 'Outfit, sans-serif',
            'font-size': '11px',
            'font-weight': 'bold',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'text-background-opacity': 0.75,
            'text-background-color': '#090a10',
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
            'background-color': 'data(bgColor)',
            'border-width': 2,
            'border-color': 'data(borderColor)',
            'width': 'data(nodeSize)',
            'height': 'data(nodeSize)',
            'shape': 'data(shape)' as any,
            'transition-property': 'background-color, border-color, width, height, opacity',
            'transition-duration': 0.25,
          },
        },
        {
          selector: 'node[?isAnomaly]',
          style: {
            'border-color': '#f43f5e',
            'border-width': 4,
            'background-color': '#f43f5e',
            'overlay-color': '#f43f5e',
            'overlay-opacity': 0.35,
            'overlay-padding': 8,
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#ffffff',
            'border-width': 3,
            'overlay-color': '#ffffff',
            'overlay-opacity': 0.2,
            'overlay-padding': 8,
          },
        },
        {
          selector: 'node.highlighted',
          style: {
            'border-color': '#fb7185',
            'border-width': 4,
            'overlay-color': '#fb7185',
            'overlay-opacity': 0.35,
            'overlay-padding': 6,
          },
        },
        {
          selector: 'node.faded',
          style: {
            'opacity': 0.2,
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': 'rgba(148, 163, 184, 0.35)',
            'target-arrow-color': 'rgba(148, 163, 184, 0.5)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 1.1,
            'label': 'data(label)',
            'font-family': 'Outfit, sans-serif',
            'font-size': '9px',
            'color': '#94a3b8',
            'text-rotation': 'autorotate',
            'text-background-opacity': 0.8,
            'text-background-color': '#0a0c14',
            'text-background-padding': '2px',
          },
        },
        {
          selector: 'edge[?isAnomaly]',
          style: {
            'width': 3.5,
            'line-color': '#f43f5e',
            'target-arrow-color': '#f43f5e',
            'line-style': 'dashed',
            'line-dash-pattern': [6, 3],
            'overlay-color': '#f43f5e',
            'overlay-opacity': 0.3,
            'overlay-padding': 4,
          },
        },
        {
          selector: 'edge.highlighted',
          style: {
            'width': 4,
            'line-color': '#fb7185',
            'target-arrow-color': '#fb7185',
            'overlay-color': '#fb7185',
            'overlay-opacity': 0.35,
            'overlay-padding': 4,
          },
        },
        {
          selector: 'edge.faded',
          style: {
            'opacity': 0.15,
          },
        },
      ],
      layout: {
        name: 'cose',
        animate: false,
        randomize: false,
        componentSpacing: 100,
        nodeRepulsion: () => 400000,
        nodeOverlap: 20,
        idealEdgeLength: () => 100,
        edgeElasticity: () => 100,
      },
    });

    cy.on('tap', 'node', (evt) => {
      const nodeData = evt.target.data() as GraphNodeData;
      onSelectNode(nodeData);
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        onSelectNode(null);
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, []);

  // Update Cytoscape Elements whenever nodes/edges/scores change
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.batch(() => {
      // 1. Sync Nodes
      nodes.forEach((n) => {
        if (!filterTypes[n.type]) {
          const existing = cy.getElementById(n.id);
          if (existing.length > 0) existing.remove();
          return;
        }

        const colorCfg = ENTITY_COLORS[n.type];
        const shape = ENTITY_SHAPES[n.type];

        // Dynamic size calculation based on algorithm mode
        let nodeSize = 34;
        if (algorithmMode === 'pagerank' && metricScores[n.id] !== undefined) {
          nodeSize = Math.max(26, Math.min(60, 24 + metricScores[n.id] * 36));
        } else if (algorithmMode === 'betweenness' && metricScores[n.id] !== undefined) {
          nodeSize = Math.max(26, Math.min(60, 24 + metricScores[n.id] * 36));
        } else if (n.isAnomaly) {
          nodeSize = 42;
        }

        const existing = cy.getElementById(n.id);
        if (existing.length > 0) {
          existing.data({
            label: n.label,
            type: n.type,
            riskScore: n.riskScore,
            isAnomaly: n.isAnomaly || false,
            nodeSize,
            bgColor: colorCfg.bg,
            borderColor: colorCfg.border,
            shape,
          });
        } else {
          cy.add({
            group: 'nodes',
            data: {
              id: n.id,
              label: n.label,
              type: n.type,
              riskScore: n.riskScore,
              isAnomaly: n.isAnomaly || false,
              nodeSize,
              bgColor: colorCfg.bg,
              borderColor: colorCfg.border,
              shape,
            },
          });
        }
      });

      // 2. Sync Edges
      edges.forEach((e) => {
        const sourceVisible = filterTypes[nodes.find(n => n.id === e.source)?.type || 'User'];
        const targetVisible = filterTypes[nodes.find(n => n.id === e.target)?.type || 'User'];

        if (!sourceVisible || !targetVisible) {
          const existing = cy.getElementById(e.id);
          if (existing.length > 0) existing.remove();
          return;
        }

        const existing = cy.getElementById(e.id);
        if (existing.length > 0) {
          existing.data({
            label: e.label,
            isAnomaly: e.isAnomaly || false,
          });
        } else {
          // Verify both endpoints exist
          if (cy.getElementById(e.source).length > 0 && cy.getElementById(e.target).length > 0) {
            cy.add({
              group: 'edges',
              data: {
                id: e.id,
                source: e.source,
                target: e.target,
                label: e.label,
                isAnomaly: e.isAnomaly || false,
              },
            });
          }
        }
      });
    });

    // Shortest path or node selection highlighting
    cy.elements().removeClass('highlighted faded');

    if (highlightPath.length > 0) {
      cy.elements().addClass('faded');
      highlightPath.forEach((id, idx) => {
        cy.getElementById(id).removeClass('faded').addClass('highlighted');
        if (idx < highlightPath.length - 1) {
          const nextId = highlightPath[idx + 1];
          cy.edges(`[source = "${id}"][target = "${nextId}"], [source = "${nextId}"][target = "${id}"]`)
            .removeClass('faded')
            .addClass('highlighted');
        }
      });
    } else if (selectedEntity) {
      const selected = cy.getElementById(selectedEntity.id);
      if (selected.length > 0) {
        cy.elements().addClass('faded');
        selected.removeClass('faded').addClass('highlighted');
        selected.neighborhood().removeClass('faded').addClass('highlighted');
      }
    }
  }, [nodes, edges, filterTypes, highlightPath, selectedEntity, algorithmMode, metricScores]);

  // Layout switcher trigger
  const runLayout = (name: 'cose' | 'concentric' | 'circle' | 'breadthfirst') => {
    if (!cyRef.current) return;
    setActiveLayout(name);

    const layoutOptions: LayoutOptions = {
      name,
      animate: true,
      animationDuration: 600,
    } as any;

    if (name === 'concentric') {
      (layoutOptions as any).concentric = (node: any) => node.data('riskScore') || 10;
      (layoutOptions as any).levelWidth = () => 20;
    }

    const layout = cyRef.current.layout(layoutOptions);
    layout.run();
  };

  const handleFit = () => {
    cyRef.current?.fit(undefined, 40);
  };

  const handleZoom = (inOut: 'in' | 'out') => {
    if (!cyRef.current) return;
    const currentZoom = cyRef.current.zoom();
    cyRef.current.animate({
      zoom: inOut === 'in' ? currentZoom * 1.3 : currentZoom * 0.7,
      duration: 250,
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cyRef.current || !searchQuery.trim()) return;

    const query = searchQuery.toLowerCase().trim();
    const found = cyRef.current.nodes().filter((n) => {
      const label = (n.data('label') || '').toLowerCase();
      const id = (n.data('id') || '').toLowerCase();
      return label.includes(query) || id.includes(query);
    });

    if (found.length > 0) {
      cyRef.current.elements().removeClass('highlighted faded');
      cyRef.current.elements().addClass('faded');
      found.removeClass('faded').addClass('highlighted');
      found.neighborhood().removeClass('faded').addClass('highlighted');
      cyRef.current.animate({
        center: { eles: found },
        zoom: 1.5,
        duration: 500,
      });
      const firstData = found.first().data() as GraphNodeData;
      onSelectNode(firstData);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden rounded-2xl glass-panel">
      {/* Top Overlay Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="pointer-events-auto flex items-center">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
            <input
              type="text"
              placeholder="Search node or IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black/50 backdrop-blur-md border border-white/[0.08] hover:border-rose-400/30 focus:border-rose-400/60 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-colors w-44 md:w-56"
            />
          </div>
        </form>

        {/* Layout & Canvas Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-black/50 backdrop-blur-md border border-white/[0.08] rounded-xl p-1 shadow-lg">
          <div className="flex items-center text-xs px-2 text-slate-400 border-r border-white/[0.08] gap-1">
            <Sparkles className="w-3 h-3 text-rose-400" />
            <span>Layout:</span>
          </div>

          {(['cose', 'concentric', 'circle', 'breadthfirst'] as const).map((l) => (
            <button
              key={l}
              onClick={() => runLayout(l)}
              className={`px-2 py-0.5 rounded-lg text-xs capitalize transition-colors ${
                activeLayout === l
                  ? 'bg-rose-500/25 text-rose-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {l}
            </button>
          ))}

          <div className="h-4 w-[1px] bg-white/[0.08] mx-0.5" />

          <button
            onClick={() => handleZoom('in')}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleZoom('out')}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleFit}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] transition-colors"
            title="Fit to Screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => runLayout(activeLayout)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] transition-colors"
            title="Relayout"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Cytoscape Canvas Container */}
      <div 
        ref={containerRef} 
        className="w-full h-full min-h-[460px] bg-[#07080d]/80 cursor-grab active:cursor-grabbing"
      />

      {/* Bottom Overlay: Entity Filters & Legend */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Entity Category Filter Toggles */}
        <div className="pointer-events-auto flex items-center gap-1 bg-black/60 backdrop-blur-md border border-white/[0.08] rounded-xl px-2.5 py-1.5 shadow-lg text-[11px]">
          <div className="flex items-center gap-1 text-slate-400 pr-1.5 border-r border-white/[0.08]">
            <Filter className="w-3 h-3 text-rose-400" />
            <span>Entities:</span>
          </div>

          {(Object.keys(ENTITY_COLORS) as EntityType[]).map((type) => {
            const active = filterTypes[type];
            return (
              <button
                key={type}
                onClick={() => setFilterTypes((prev) => ({ ...prev, [type]: !prev[type] }))}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border transition-all ${
                  active
                    ? 'border-white/10 text-slate-200'
                    : 'border-transparent text-slate-500 opacity-40 line-through'
                }`}
                style={{ backgroundColor: active ? `${ENTITY_COLORS[type].bg}18` : 'transparent' }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: ENTITY_COLORS[type].bg }}
                />
                <span>{type}</span>
              </button>
            );
          })}
        </div>

        {/* Path Highlight Indicator if active */}
        {highlightPath.length > 0 && (
          <div className="pointer-events-auto flex items-center gap-2 bg-rose-500/20 backdrop-blur-md border border-rose-500/40 text-rose-200 px-3 py-1 rounded-xl text-xs font-semibold shadow-[0_0_15px_rgba(244,114,142,0.2)]">
            <Route className="w-3.5 h-3.5 text-rose-400" />
            <span>Shortest Path Active: {highlightPath.length} nodes</span>
          </div>
        )}
      </div>
    </div>
  );
};
