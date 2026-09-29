import React, { useState } from 'react';
import type { AnomalyAlert, GraphNodeData, AppPage } from '../types/graph';
import { 
  ShieldAlert, 
  AlertTriangle, 
  ChevronRight, 
  Activity, 
  TrendingUp, 
  Crosshair, 
  CheckCircle2, 
  Search,
  Info,
  Zap
} from 'lucide-react';

interface AnomaliesPageProps {
  anomalies: AnomalyAlert[];
  nodes: GraphNodeData[];
  onSelectAnomalyEntity: (entityId: string) => void;
  onChangePage: (page: AppPage) => void;
  onTriggerScenario: (scenario: 'lateral_movement' | 'credential_stuffing' | 'dns_exfil' | 'privilege_escalation') => void;
}

export const AnomaliesPage: React.FC<AnomaliesPageProps> = ({
  anomalies,
  onSelectAnomalyEntity,
  onChangePage,
  onTriggerScenario,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = anomalies.filter((a) => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.entityId.toLowerCase().includes(q) ||
        a.entityType.toLowerCase().includes(q) ||
        a.reasons.some((r) => r.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const criticalCount = anomalies.filter((a) => a.severity === 'critical').length;
  const avgScore = anomalies.length > 0 
    ? Math.round(anomalies.reduce((sum, a) => sum + a.score, 0) / anomalies.length) 
    : 0;

  const handleInspectInGraph = (entityId: string) => {
    onSelectAnomalyEntity(entityId);
    onChangePage('graph');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/20 dark:border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Explainable AI Engine</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white m-0">
            Threat & Anomaly Detection Center
          </h1>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Statistical deviation signals, baseline comparisons, and topological heuristic rule violations with transparent reasoning.
          </p>
        </div>

        {/* Quick Inject Attack Button */}
        <button
          onClick={() => onTriggerScenario('lateral_movement')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs shadow-lg transition-all"
        >
          <Zap className="w-4 h-4" />
          <span>Simulate Lateral Threat</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-white/20 dark:border-white/10">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Flagged Anomalies</span>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono mt-2">
            {anomalies.length}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-rose-500/30 bg-rose-500/[0.04]">
          <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Critical Severity</span>
          <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-mono mt-2">
            {criticalCount}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-white/20 dark:border-white/10">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Average Threat Score</span>
          <div className="text-3xl font-extrabold text-amber-500 font-mono mt-2">
            {avgScore}%
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-white/20 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search anomalies by entity, reason, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/70 dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
          />
        </div>

        {/* Severity Filters */}
        <div className="flex items-center gap-1.5 bg-black/5 dark:bg-black/40 p-1 rounded-xl border border-black/5 dark:border-white/10 text-xs w-full sm:w-auto overflow-x-auto">
          {(['all', 'critical', 'high', 'medium'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                severityFilter === sev
                  ? 'bg-rose-500 text-white font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Anomalies List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center border border-white/20 dark:border-white/10">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Active Anomalies Matching Filters
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4">
              All statistical baseline indicators are within normal operating bounds. You can trigger simulated cybersecurity threat scenarios from the top button.
            </p>
            <button
              onClick={() => onTriggerScenario('credential_stuffing')}
              className="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-semibold shadow-md hover:bg-rose-600 transition-colors"
            >
              Trigger Credential Stuffing Attack
            </button>
          </div>
        ) : (
          filtered.map((anomaly) => {
            const isExpanded = expandedId === anomaly.id;

            return (
              <div
                key={anomaly.id}
                className="glass-panel rounded-2xl border border-white/20 dark:border-white/10 overflow-hidden transition-all"
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : anomaly.id)}
                  className="p-4 md:p-5 cursor-pointer flex items-center justify-between gap-4 hover:bg-black/5 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`p-2.5 rounded-2xl flex-shrink-0 ${
                      anomaly.severity === 'critical'
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                    }`}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
                          {anomaly.title}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          anomaly.severity === 'critical'
                            ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                        }`}>
                          {anomaly.severity}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="font-mono">{anomaly.timestamp}</span>
                        <span>•</span>
                        <span className="font-semibold text-rose-600 dark:text-rose-400">
                          {anomaly.entityType}: {anomaly.entityId}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <span className="text-base font-bold text-rose-600 dark:text-rose-400 font-mono">
                        {anomaly.score}%
                      </span>
                      <span className="text-[10px] text-slate-500 block">Threat Score</span>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-rose-500' : ''}`} />
                  </div>
                </div>

                {/* Expanded Explainability Body */}
                {isExpanded && (
                  <div className="p-5 pt-2 border-t border-slate-200 dark:border-white/[0.08] bg-white/40 dark:bg-black/30 space-y-4">
                    {/* Why Flagged */}
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-300 mb-2">
                        <Info className="w-4 h-4 text-rose-500" />
                        <span>Why Flagged? (Explainable Rules & Graph Signals)</span>
                      </div>
                      <ul className="space-y-1.5 pl-5 list-disc text-xs text-slate-800 dark:text-slate-300">
                        {anomaly.reasons.map((r, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Statistical breakdown cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {anomaly.metrics.zScore !== undefined && (
                        <div className="p-3 rounded-xl bg-white/60 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                            Statistical Z-Score
                          </span>
                          <span className="text-sm font-mono font-bold text-rose-600 dark:text-rose-400 mt-1 block">
                            +{anomaly.metrics.zScore.toFixed(1)}σ Deviation
                          </span>
                        </div>
                      )}

                      {anomaly.metrics.observedRate && (
                        <div className="p-3 rounded-xl bg-white/60 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-amber-500" />
                            Observed vs Baseline
                          </span>
                          <span className="text-sm font-mono font-bold text-amber-600 dark:text-amber-400 mt-1 block">
                            {anomaly.metrics.observedRate} (base: {anomaly.metrics.baselineRate || '0'})
                          </span>
                        </div>
                      )}

                      {anomaly.metrics.unexpectedRelation && (
                        <div className="p-3 rounded-xl bg-white/60 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                            Anomalous Graph Path
                          </span>
                          <code className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                            {anomaly.metrics.unexpectedRelation}
                          </code>
                        </div>
                      )}
                    </div>

                    {/* Action button */}
                    <button
                      onClick={() => handleInspectInGraph(anomaly.entityId)}
                      className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs shadow-md transition-all"
                    >
                      <Crosshair className="w-4 h-4" />
                      <span>Inspect & Focus Entity in Graph Canvas</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
