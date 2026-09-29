import React, { useState } from 'react';
import type { AnomalyAlert, GraphNodeData } from '../types/graph';
import { 
  ShieldAlert, 
  AlertTriangle, 
  ChevronRight, 
  Activity, 
  TrendingUp, 
  Crosshair, 
  CheckCircle2, 
  Info
} from 'lucide-react';

interface ExplainableAnomalyPanelProps {
  anomalies: AnomalyAlert[];
  onSelectAnomalyEntity: (entityId: string) => void;
  selectedEntity: GraphNodeData | null;
}

export const ExplainableAnomalyPanel: React.FC<ExplainableAnomalyPanelProps> = ({
  anomalies,
  onSelectAnomalyEntity,
  selectedEntity,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high'>('all');

  const filtered = anomalies.filter(a => {
    if (severityFilter === 'all') return true;
    return a.severity === severityFilter;
  });

  const criticalCount = anomalies.filter(a => a.severity === 'critical').length;

  return (
    <div className="h-full flex flex-col glass-panel rounded-2xl p-4 overflow-hidden border border-white/[0.08]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white m-0 flex items-center gap-2">
              Explainable Anomaly Engine
              {criticalCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 ping-subtle" />
              )}
            </h2>
            <p className="text-[11px] text-slate-400">
              Statistical deviations & behavioral graph heuristics
            </p>
          </div>
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/[0.06] text-[11px]">
          <button
            onClick={() => setSeverityFilter('all')}
            className={`px-2 py-0.5 rounded-lg transition-colors ${
              severityFilter === 'all'
                ? 'bg-rose-500/25 text-rose-300 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({anomalies.length})
          </button>
          <button
            onClick={() => setSeverityFilter('critical')}
            className={`px-2 py-0.5 rounded-lg transition-colors ${
              severityFilter === 'critical'
                ? 'bg-rose-500/30 text-rose-300 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Critical ({criticalCount})
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-3 gap-2 my-3">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-2.5 flex flex-col">
          <span className="text-[10px] text-slate-400">Total Flagged</span>
          <span className="text-lg font-bold text-white font-mono mt-0.5">{anomalies.length}</span>
        </div>

        <div className="bg-rose-500/[0.07] border border-rose-500/25 rounded-xl p-2.5 flex flex-col">
          <span className="text-[10px] text-rose-300">Critical Threats</span>
          <span className="text-lg font-bold text-rose-400 font-mono mt-0.5">{criticalCount}</span>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-2.5 flex flex-col">
          <span className="text-[10px] text-slate-400">Mean Anomaly Score</span>
          <span className="text-lg font-bold text-amber-300 font-mono mt-0.5">
            {anomalies.length > 0 
              ? `${Math.round(anomalies.reduce((acc, a) => acc + a.score, 0) / anomalies.length)}%`
              : '0%'}
          </span>
        </div>
      </div>

      {/* Anomaly Alerts List with Explainability Breakdown */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {filtered.length === 0 ? (
          <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center p-4 text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-400/60 mb-2" />
            <p className="text-xs font-medium text-slate-300">Baseline Normal Activity</p>
            <p className="text-[11px] text-slate-500 max-w-[220px]">
              No active statistical threshold violations. Inject a cybersecurity scenario from the top bar to trigger.
            </p>
          </div>
        ) : (
          filtered.map((anomaly) => {
            const isExpanded = expandedId === anomaly.id;
            const isSelected = selectedEntity?.id === anomaly.entityId;

            return (
              <div
                key={anomaly.id}
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                  isSelected
                    ? 'bg-rose-500/15 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                    : 'bg-white/[0.02] border-white/[0.08] hover:border-rose-400/30 hover:bg-white/[0.04]'
                }`}
              >
                {/* Header row */}
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : anomaly.id)}
                  className="p-3 cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                      anomaly.severity === 'critical'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}>
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white truncate">
                          {anomaly.title}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                          anomaly.severity === 'critical'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {anomaly.severity}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="font-mono">{anomaly.timestamp}</span>
                        <span>•</span>
                        <span className="text-rose-300 font-mono">{anomaly.entityType}: {anomaly.entityId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-bold text-rose-400 font-mono">
                        {anomaly.score}%
                      </div>
                      <div className="text-[9px] text-slate-500">Risk Score</div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-rose-400' : ''}`} />
                  </div>
                </div>

                {/* Explainability Accordion Drawer */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-white/[0.06] bg-black/30 space-y-2.5">
                    {/* Why Flagged Explainable Reasons */}
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-300 mb-1.5">
                        <Info className="w-3.5 h-3.5 text-rose-400" />
                        <span>Why Flagged? (Explainable Rules & Graph Signals)</span>
                      </div>
                      <ul className="space-y-1 pl-4 list-disc text-[11px] text-slate-300">
                        {anomaly.reasons.map((r, i) => (
                          <li key={i} className="leading-relaxed">
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Statistical Metrics Breakdown */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {anomaly.metrics.zScore !== undefined && (
                        <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05]">
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-rose-400" />
                            Statistical Z-Score
                          </span>
                          <span className="text-xs font-mono font-bold text-rose-300 mt-0.5 block">
                            +{anomaly.metrics.zScore.toFixed(1)}σ deviation
                          </span>
                        </div>
                      )}

                      {anomaly.metrics.observedRate && (
                        <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05]">
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Activity className="w-3 h-3 text-amber-400" />
                            Observed vs Baseline
                          </span>
                          <span className="text-xs font-mono font-bold text-amber-300 mt-0.5 block">
                            {anomaly.metrics.observedRate} (base: {anomaly.metrics.baselineRate || '0'})
                          </span>
                        </div>
                      )}
                    </div>

                    {anomaly.metrics.unexpectedRelation && (
                      <div className="bg-rose-500/[0.08] border border-rose-500/20 p-2 rounded-lg text-[11px]">
                        <span className="text-[10px] text-rose-300 block mb-0.5">Unobserved Graph Path</span>
                        <code className="text-white font-mono">{anomaly.metrics.unexpectedRelation}</code>
                      </div>
                    )}

                    {/* Highlight in Canvas Action */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAnomalyEntity(anomaly.entityId);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 transition-colors shadow-sm"
                    >
                      <Crosshair className="w-3.5 h-3.5 text-rose-400" />
                      <span>Focus & Center in Graph View</span>
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
