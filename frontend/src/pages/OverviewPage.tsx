import React from 'react';
import { 
  Network, 
  ShieldAlert, 
  Radio, 
  BarChart3, 
  ArrowRight, 
  Zap, 
  Layers, 
  Share2, 
  CheckCircle2, 
  Sparkles,
  Server
} from 'lucide-react';
import type { 
  NetworkStats, 
  AnomalyAlert, 
  StreamEvent, 
  AppPage 
} from '../types/graph';

interface OverviewPageProps {
  stats: NetworkStats;
  anomalies: AnomalyAlert[];
  events: StreamEvent[];
  onChangePage: (page: AppPage) => void;
  onTriggerScenario: (scenario: 'lateral_movement' | 'credential_stuffing' | 'dns_exfil' | 'privilege_escalation') => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  stats,
  anomalies,
  events,
  onChangePage,
  onTriggerScenario,
}) => {
  return (
    <div className="space-y-6">
      {/* Hero Welcome & Value Proposition Card */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 relative overflow-hidden border border-white/20 dark:border-white/10">
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-rose-400/20 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Real-Time Graph Intelligence & Cybersecurity Telemetry</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight mb-3">
            Dynamic Graph Processing with Explainable Anomaly Detection
          </h1>

          <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 leading-relaxed mb-6 font-normal">
            A local-first intelligence platform transforming high-velocity event streams into an interactive graph. 
            Analyze cybersecurity entity relationships in near real-time with NetworkX algorithms, community clustering, and explainable threat scoring.
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => onChangePage('graph')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs md:text-sm shadow-[0_4px_20px_rgba(247,138,156,0.4)] transition-all hover:scale-105"
            >
              <Network className="w-4 h-4" />
              <span>Explore Live Graph Canvas</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onChangePage('anomalies')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/60 dark:bg-white/[0.08] hover:bg-white/80 dark:hover:bg-white/[0.12] text-slate-900 dark:text-white border border-slate-300/60 dark:border-white/10 text-xs md:text-sm font-medium transition-all"
            >
              <ShieldAlert className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              <span>Review Anomalies ({stats.anomaliesDetected})</span>
            </button>

            <button
              onClick={() => onChangePage('analytics')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/60 dark:bg-white/[0.08] hover:bg-white/80 dark:hover:bg-white/[0.12] text-slate-900 dark:text-white border border-slate-300/60 dark:border-white/10 text-xs md:text-sm font-medium transition-all"
            >
              <BarChart3 className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              <span>Run Graph Algorithms</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid: Core Telemetry KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Nodes */}
        <div 
          onClick={() => onChangePage('graph')} 
          className="glass-panel-interactive rounded-2xl p-5 cursor-pointer flex flex-col justify-between border border-white/20 dark:border-white/10"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Entities</span>
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {stats.nodeCount}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Users, Devices, IPs & Domains
            </span>
          </div>
          <div className="flex items-center text-xs text-rose-600 dark:text-rose-400 font-semibold gap-1">
            <span>View Canvas</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* KPI 2: Live Edges / Relationships */}
        <div 
          onClick={() => onChangePage('stream')} 
          className="glass-panel-interactive rounded-2xl p-5 cursor-pointer flex flex-col justify-between border border-white/20 dark:border-white/10"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Connected Edges</span>
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {stats.edgeCount}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Across 6 relationship types
            </span>
          </div>
          <div className="flex items-center text-xs text-rose-600 dark:text-rose-400 font-semibold gap-1">
            <span>Inspect Stream</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* KPI 3: Detected Anomalies */}
        <div 
          onClick={() => onChangePage('anomalies')} 
          className="glass-panel-interactive rounded-2xl p-5 cursor-pointer flex flex-col justify-between border border-white/20 dark:border-white/10"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Threat Alerts</span>
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
              {stats.anomaliesDetected}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Statistical deviations & heuristics
            </span>
          </div>
          <div className="flex items-center text-xs text-rose-600 dark:text-rose-400 font-semibold gap-1">
            <span>Explainable AI Engine</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* KPI 4: Stream Ingestion Rate */}
        <div 
          onClick={() => onChangePage('stream')} 
          className="glass-panel-interactive rounded-2xl p-5 cursor-pointer flex flex-col justify-between border border-white/20 dark:border-white/10"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Pipeline Throughput</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="my-3">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {stats.eventsProcessed}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
              {stats.eventsPerSecond} events/sec ingestion
            </span>
          </div>
          <div className="flex items-center text-xs text-rose-600 dark:text-rose-400 font-semibold gap-1">
            <span>Live Telemetry</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Bento Grid Row 2: Attack Simulator & Quick Launch Stations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Threat Scenario Launcher (7 cols) */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 border border-white/20 dark:border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400">
                <Zap className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white m-0">
                Cybersecurity Attack Simulator
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Inject real-world attack vectors to observe instant topology mutations, path anomalies, and explainable statistical rule triggers.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => onTriggerScenario('lateral_movement')}
                className="p-3 rounded-2xl bg-white/50 dark:bg-white/[0.03] hover:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-slate-300/70 dark:border-white/[0.08] hover:border-rose-400/50 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-300">
                    ⚡ Lateral Movement
                  </span>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase">Critical</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Sales host bypasses bastion to connect directly to prod DB cluster.
                </p>
              </button>

              <button
                onClick={() => onTriggerScenario('credential_stuffing')}
                className="p-3 rounded-2xl bg-white/50 dark:bg-white/[0.03] hover:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-slate-300/70 dark:border-white/[0.08] hover:border-rose-400/50 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-300">
                    💥 Credential Stuffing
                  </span>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase">Burst</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  140+ auth attempts/s from bulletproof external IP.
                </p>
              </button>

              <button
                onClick={() => onTriggerScenario('dns_exfil')}
                className="p-3 rounded-2xl bg-white/50 dark:bg-white/[0.03] hover:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-slate-300/70 dark:border-white/[0.08] hover:border-rose-400/50 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-300">
                    🛰️ DNS Tunneling Exfil
                  </span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">High</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  High Shannon entropy TXT payloads beaconing to C2 domain.
                </p>
              </button>

              <button
                onClick={() => onTriggerScenario('privilege_escalation')}
                className="p-3 rounded-2xl bg-white/50 dark:bg-white/[0.03] hover:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-slate-300/70 dark:border-white/[0.08] hover:border-rose-400/50 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-300">
                    🛡️ Token Escalation
                  </span>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase">Policy</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Contractor account elevates privileges directly to Global Admin.
                </p>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-white/[0.06] flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400">
              Injected scenarios update all views instantaneously.
            </span>
            <button
              onClick={() => onChangePage('graph')}
              className="text-rose-600 dark:text-rose-400 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Watch on Canvas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Platform Architecture & Features (5 cols) */}
        <div className="lg:col-span-5 glass-panel rounded-3xl p-6 border border-white/20 dark:border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400">
                <Server className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white m-0">
                Platform Architecture
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Local-first, open-source stack designed for real-time cybersecurity graph engineering.
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-white/40 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Visualization</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">Cytoscape.js Canvas</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/40 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Graph Engine</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">NetworkX Algorithms</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/40 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Streaming Pipeline</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">WebSockets + In-Memory Queue</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/40 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Anomaly Engine</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">Explainable Z-Score & Rules</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-white/[0.06] flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>100% Free & Open-Source • Zero Cloud/API Lock-in</span>
          </div>
        </div>
      </div>

      {/* Row 3: Live Telemetry Preview & Threat Radar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Events Preview */}
        <div className="glass-panel rounded-3xl p-6 border border-white/20 dark:border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                  Live Stream Ticker
                </h3>
              </div>
              <button
                onClick={() => onChangePage('stream')}
                className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline flex items-center gap-1"
              >
                <span>View All ({events.length})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2">
              {events.slice(0, 4).map((evt) => (
                <div
                  key={evt.id}
                  className="p-2.5 rounded-xl bg-white/40 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06] text-xs flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0 font-mono">
                    <span className="text-[10px] text-slate-400">{evt.timestamp}</span>
                    <span className="font-semibold text-slate-900 dark:text-white truncate">{evt.source}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-300">
                      {evt.relationship}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white truncate">{evt.target}</span>
                  </div>
                  <span className={`text-[10px] font-bold font-mono ${evt.isAnomaly ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
                    {evt.isAnomaly ? 'ANOMALY' : `${evt.riskScore}%`}
                  </span>
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-xs text-slate-500 italic p-4 text-center">Stream starting up...</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Anomalies Preview */}
        <div className="glass-panel rounded-3xl p-6 border border-white/20 dark:border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                  Threat Activity Highlights
                </h3>
              </div>
              <button
                onClick={() => onChangePage('anomalies')}
                className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline flex items-center gap-1"
              >
                <span>All Alerts ({anomalies.length})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2">
              {anomalies.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  className="p-2.5 rounded-xl bg-rose-500/[0.08] border border-rose-500/30 text-xs flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 dark:text-white truncate block">
                      {a.title}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {a.entityType}: {a.entityId}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                    {a.score}%
                  </span>
                </div>
              ))}
              {anomalies.length === 0 && (
                <div className="text-center p-6 text-xs text-slate-500">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                  <span>No active critical alerts. Network baseline stable.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
