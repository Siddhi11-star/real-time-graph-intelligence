import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { 
  GraphNodeData, 
  GraphEdgeData, 
  StreamEvent, 
  AnomalyAlert, 
  AlgorithmMode, 
  NetworkStats,
  AppPage,
  AppTheme
} from './types/graph';
import { 
  INITIAL_ENTITIES, 
  INITIAL_EDGES, 
  mockStreamService 
} from './services/mockEventStream';
import { computeGraphMetrics } from './services/graphAlgorithms';
import { Header } from './components/Header';
import { OverviewPage } from './pages/OverviewPage';
import { GraphPage } from './pages/GraphPage';
import { AnomaliesPage } from './pages/AnomaliesPage';
import { StreamPage } from './pages/StreamPage';
import { AnalyticsPage } from './pages/AnalyticsPage';

export const App: React.FC = () => {
  // Navigation & Theme
  const [activePage, setActivePage] = useState<AppPage>('overview');
  const [theme, setTheme] = useState<AppTheme>('dark');

  // Graph and Stream State
  const [nodes, setNodes] = useState<GraphNodeData[]>(INITIAL_ENTITIES);
  const [edges, setEdges] = useState<GraphEdgeData[]>(INITIAL_EDGES);
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<GraphNodeData | null>(null);
  const [highlightPath, setHighlightPath] = useState<string[]>([]);
  const [algorithmMode, setAlgorithmMode] = useState<AlgorithmMode>('none');
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [speedMs, setSpeedMs] = useState<number>(1800);
  const [backendConnected, setBackendConnected] = useState<boolean>(false);

  // Sync theme with <html> element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Recompute topological graph metrics (PageRank, Centrality, Communities, Cycles)
  const graphMetrics = useMemo(() => {
    return computeGraphMetrics(nodes, edges);
  }, [nodes, edges]);

  // Overall platform KPIs
  const stats: NetworkStats = useMemo(() => {
    return {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      eventsProcessed: events.length + INITIAL_EDGES.length,
      anomaliesDetected: anomalies.length,
      eventsPerSecond: isRunning ? Number((1000 / speedMs).toFixed(1)) : 0,
      activeCommunities: Object.keys(
        Object.values(graphMetrics.communities).reduce((acc, c) => ({ ...acc, [c]: true }), {})
      ).length,
    };
  }, [nodes.length, edges.length, events.length, anomalies.length, isRunning, speedMs, graphMetrics.communities]);

  // Handle incoming stream event
  const handleIncomingEvent = useCallback((event: StreamEvent, anomalyAlert?: AnomalyAlert) => {
    // 1. Add to live event stream
    setEvents((prev) => [event, ...prev.slice(0, 150)]);

    // 2. Add or update nodes if needed
    setNodes((prevNodes) => {
      let updated = [...prevNodes];

      // Source node
      let srcIndex = updated.findIndex((n) => n.id === event.source);
      if (srcIndex === -1) {
        updated.push({
          id: event.source,
          label: event.source,
          type: event.sourceType,
          riskScore: event.riskScore,
          isAnomaly: event.isAnomaly,
          anomalyReason: event.anomalyReason,
        });
      } else if (event.isAnomaly) {
        updated[srcIndex] = {
          ...updated[srcIndex],
          riskScore: Math.max(updated[srcIndex].riskScore, event.riskScore),
          isAnomaly: true,
          anomalyReason: event.anomalyReason || updated[srcIndex].anomalyReason,
        };
      }

      // Target node
      let tgtIndex = updated.findIndex((n) => n.id === event.target);
      if (tgtIndex === -1) {
        updated.push({
          id: event.target,
          label: event.target,
          type: event.targetType,
          riskScore: event.riskScore,
          isAnomaly: event.isAnomaly,
          anomalyReason: event.anomalyReason,
        });
      } else if (event.isAnomaly) {
        updated[tgtIndex] = {
          ...updated[tgtIndex],
          riskScore: Math.max(updated[tgtIndex].riskScore, event.riskScore),
          isAnomaly: true,
          anomalyReason: event.anomalyReason || updated[tgtIndex].anomalyReason,
        };
      }

      return updated;
    });

    // 3. Add or update edge
    setEdges((prevEdges) => {
      const existingEdge = prevEdges.find(
        (e) => e.source === event.source && e.target === event.target && e.label === event.relationship
      );

      if (existingEdge) {
        return prevEdges.map((e) =>
          e.id === existingEdge.id
            ? { ...e, timestamp: event.timestamp, isAnomaly: e.isAnomaly || event.isAnomaly }
            : e
        );
      }

      const newEdge: GraphEdgeData = {
        id: `e-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        source: event.source,
        target: event.target,
        label: event.relationship,
        timestamp: event.timestamp,
        isAnomaly: event.isAnomaly,
        anomalyScore: event.riskScore,
      };

      return [...prevEdges, newEdge];
    });

    // 4. Record anomaly alert if triggered
    if (anomalyAlert) {
      setAnomalies((prev) => [anomalyAlert, ...prev]);
    }
  }, []);

  // Connect to local simulation engine on mount
  useEffect(() => {
    mockStreamService.subscribe(handleIncomingEvent);

    // Optional: Probe FastAPI WebSocket if present
    try {
      const ws = new WebSocket('ws://localhost:8000/ws/events');
      ws.onopen = () => {
        setBackendConnected(true);
        mockStreamService.pause();
      };
      ws.onmessage = (msg) => {
        try {
          const parsed = JSON.parse(msg.data);
          if (parsed.event) {
            handleIncomingEvent(parsed.event, parsed.anomaly);
          }
        } catch {
          // ignore
        }
      };
      ws.onerror = () => {
        setBackendConnected(false);
      };
      ws.onclose = () => {
        setBackendConnected(false);
      };

      return () => {
        ws.close();
      };
    } catch {
      // Backend not running yet, in-memory mock active
    }
  }, [handleIncomingEvent]);

  // Controls handlers
  const handleTogglePlay = () => {
    if (isRunning) {
      mockStreamService.pause();
      setIsRunning(false);
    } else {
      mockStreamService.resume();
      setIsRunning(true);
    }
  };

  const handleChangeSpeed = (speed: number) => {
    setSpeedMs(speed);
    mockStreamService.setSpeed(speed);
  };

  const handleTriggerScenario = (scenario: 'lateral_movement' | 'credential_stuffing' | 'dns_exfil' | 'privilege_escalation') => {
    mockStreamService.triggerScenario(scenario);
  };

  const handleResetGraph = () => {
    setNodes(INITIAL_ENTITIES);
    setEdges(INITIAL_EDGES);
    setEvents([]);
    setAnomalies([]);
    setSelectedEntity(null);
    setHighlightPath([]);
  };

  const handleSelectAnomalyEntity = (entityId: string) => {
    const node = nodes.find((n) => n.id === entityId) || null;
    setSelectedEntity(node);
    if (node) {
      setHighlightPath([node.id]);
    }
  };

  const handleSelectEntityByName = (entityId: string) => {
    const node = nodes.find((n) => n.id === entityId) || null;
    setSelectedEntity(node);
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {/* Top Navbar */}
      <Header
        stats={stats}
        isRunning={isRunning}
        onTogglePlay={handleTogglePlay}
        speedMs={speedMs}
        onChangeSpeed={handleChangeSpeed}
        onTriggerScenario={handleTriggerScenario}
        onResetGraph={handleResetGraph}
        backendConnected={backendConnected}
        activePage={activePage}
        onChangePage={setActivePage}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Multi-Page Content Area */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1720px] mx-auto w-full">
        {activePage === 'overview' && (
          <OverviewPage
            stats={stats}
            anomalies={anomalies}
            events={events}
            onChangePage={setActivePage}
            onTriggerScenario={handleTriggerScenario}
          />
        )}

        {activePage === 'graph' && (
          <GraphPage
            nodes={nodes}
            edges={edges}
            selectedEntity={selectedEntity}
            onSelectNode={setSelectedEntity}
            highlightPath={highlightPath}
            algorithmMode={algorithmMode}
            metricScores={
              algorithmMode === 'pagerank'
                ? graphMetrics.pageRank
                : graphMetrics.degreeCentrality
            }
          />
        )}

        {activePage === 'anomalies' && (
          <AnomaliesPage
            anomalies={anomalies}
            nodes={nodes}
            onSelectAnomalyEntity={handleSelectAnomalyEntity}
            onChangePage={setActivePage}
            onTriggerScenario={handleTriggerScenario}
          />
        )}

        {activePage === 'stream' && (
          <StreamPage
            events={events}
            onClearEvents={() => setEvents([])}
            isRunning={isRunning}
            onTogglePlay={handleTogglePlay}
            speedMs={speedMs}
            onChangeSpeed={handleChangeSpeed}
            onSelectEntity={handleSelectEntityByName}
          />
        )}

        {activePage === 'analytics' && (
          <AnalyticsPage
            nodes={nodes}
            edges={edges}
            metrics={graphMetrics}
            algorithmMode={algorithmMode}
            onChangeAlgorithmMode={setAlgorithmMode}
            onSetHighlightPath={setHighlightPath}
            onSelectNode={setSelectedEntity}
            onChangePage={setActivePage}
          />
        )}
      </main>

      {/* Global Footer */}
      <footer className="w-full glass-panel border-t border-white/20 dark:border-white/[0.06] px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="font-bold text-slate-800 dark:text-slate-200">AetherGraph</span>
          <span className="text-slate-500 dark:text-slate-400">— Real-Time Graph Intelligence Platform</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-600 dark:text-slate-400">
          <span>Mode: {theme === 'light' ? '🌸 Minimal Pink Swatch' : '🌙 Obsidian Dark'}</span>
          <span>•</span>
          <span>Engine: NetworkX + Cytoscape.js</span>
          <span>•</span>
          <span className="font-mono text-rose-500 dark:text-rose-400 font-semibold">
            {isRunning ? 'Pipeline Active' : 'Pipeline Idle'}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
