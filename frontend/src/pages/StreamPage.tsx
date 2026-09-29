import React, { useState } from 'react';
import type { StreamEvent, RelationshipType } from '../types/graph';
import { 
  Radio, 
  Trash2, 
  ArrowRight, 
  ShieldAlert, 
  Pause, 
  Play, 
  Code
} from 'lucide-react';

interface StreamPageProps {
  events: StreamEvent[];
  onClearEvents: () => void;
  isRunning: boolean;
  onTogglePlay: () => void;
  speedMs: number;
  onChangeSpeed: (speed: number) => void;
  onSelectEntity: (entityId: string) => void;
}

const RELATION_BADGES: Record<RelationshipType, { bg: string; text: string; border: string }> = {
  logged_in_to: { bg: 'bg-rose-500/15', text: 'text-rose-600 dark:text-rose-300', border: 'border-rose-500/30' },
  connected_to: { bg: 'bg-sky-500/15', text: 'text-sky-600 dark:text-sky-300', border: 'border-sky-500/30' },
  requested: { bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-300', border: 'border-emerald-500/30' },
  spawned: { bg: 'bg-purple-500/15', text: 'text-purple-600 dark:text-purple-300', border: 'border-purple-500/30' },
  authenticated_as: { bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-300', border: 'border-amber-500/30' },
  accessed: { bg: 'bg-indigo-500/15', text: 'text-indigo-600 dark:text-indigo-300', border: 'border-indigo-500/30' },
};

export const StreamPage: React.FC<StreamPageProps> = ({
  events,
  onClearEvents,
  isRunning,
  onTogglePlay,
  speedMs,
  onChangeSpeed,
  onSelectEntity,
}) => {
  const [selectedRelation, setSelectedRelation] = useState<string>('all');
  const [selectedEventRaw, setSelectedEventRaw] = useState<StreamEvent | null>(null);

  const filteredEvents = events.filter((e) => {
    if (selectedRelation === 'all') return true;
    if (selectedRelation === 'anomalies') return e.isAnomaly;
    return e.relationship === selectedRelation;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner & Pipeline Controls */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/20 dark:border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Event Ingestion Pipeline</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white m-0">
            Real-Time Telemetry Stream
          </h1>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Continuous event packet processing, converting cybersecurity entity relationships into the dynamic graph.
          </p>
        </div>

        {/* Streaming Controls Bar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
              isRunning 
                ? 'bg-rose-500 text-white shadow-md' 
                : 'bg-white/60 dark:bg-white/[0.08] text-slate-800 dark:text-white'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isRunning ? 'Pause Ingestion' : 'Resume Ingestion'}</span>
          </button>

          {/* Speed Pills */}
          <div className="flex items-center bg-black/5 dark:bg-black/40 border border-black/5 dark:border-white/10 rounded-xl p-1 text-xs">
            {[
              { label: '0.5x', ms: 3000 },
              { label: '1x', ms: 1800 },
              { label: '2x', ms: 900 },
              { label: '4x', ms: 450 },
            ].map((s) => (
              <button
                key={s.label}
                onClick={() => onChangeSpeed(s.ms)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  speedMs === s.ms
                    ? 'bg-rose-500 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <button
            onClick={onClearEvents}
            className="p-2 rounded-xl bg-white/60 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-300/60 dark:border-white/10 transition-colors"
            title="Clear Stream History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Relation Category Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-slate-500 text-xs font-semibold pl-1">Filters:</span>
        {['all', 'anomalies', 'logged_in_to', 'connected_to', 'requested', 'spawned', 'authenticated_as', 'accessed'].map((r) => (
          <button
            key={r}
            onClick={() => setSelectedRelation(r)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap border transition-all ${
              selectedRelation === r
                ? 'bg-rose-500 text-white font-semibold shadow-sm border-rose-500'
                : 'glass-panel text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {r === 'all' ? 'All Telemetry' : r.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Main Stream View & Raw Packet Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stream List (8 cols) */}
        <div className="lg:col-span-8 glass-panel rounded-3xl p-5 border border-white/20 dark:border-white/10 flex flex-col h-[580px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08] mb-3 text-xs">
            <span className="font-semibold text-slate-800 dark:text-white">
              Live Ingestion Feed ({filteredEvents.length} events)
            </span>
            <span className="text-slate-500 font-mono">
              Rate: {(1000 / speedMs).toFixed(1)} events/sec
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredEvents.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Listening for incoming events...
              </div>
            ) : (
              filteredEvents.map((evt) => {
                const relBadge = RELATION_BADGES[evt.relationship] || {
                  bg: 'bg-slate-500/15',
                  text: 'text-slate-600 dark:text-slate-300',
                  border: 'border-slate-500/30'
                };

                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEventRaw(evt)}
                    className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                      evt.isAnomaly
                        ? 'bg-rose-500/[0.08] border-rose-500/40 shadow-sm'
                        : 'bg-white/40 dark:bg-white/[0.02] border-slate-200/70 dark:border-white/[0.06] hover:bg-white/70 dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500">{evt.timestamp}</span>
                        <span className="font-mono text-slate-400">#{evt.id}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {evt.isAnomaly && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold text-[9px] uppercase tracking-wider">
                            <ShieldAlert className="w-2.5 h-2.5" />
                            Anomaly
                          </span>
                        )}
                        <span className={`font-mono font-bold ${
                          evt.riskScore > 70 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          Risk: {evt.riskScore}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEntity(evt.source);
                        }}
                        className="font-bold text-slate-900 dark:text-white bg-black/5 dark:bg-white/[0.06] px-2 py-0.5 rounded-lg border border-black/5 dark:border-white/10 hover:text-rose-500"
                      >
                        {evt.source}
                      </button>

                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] ${relBadge.bg} ${relBadge.text} ${relBadge.border}`}>
                        <span>{evt.relationship}</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEntity(evt.target);
                        }}
                        className="font-bold text-slate-900 dark:text-white bg-black/5 dark:bg-white/[0.06] px-2 py-0.5 rounded-lg border border-black/5 dark:border-white/10 hover:text-rose-500"
                      >
                        {evt.target}
                      </button>
                    </div>

                    {evt.anomalyReason && (
                      <p className="mt-2 text-xs text-rose-600 dark:text-rose-300 font-medium">
                        {evt.anomalyReason}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Raw Packet Inspector (4 cols) */}
        <div className="lg:col-span-4 glass-panel rounded-3xl p-5 border border-white/20 dark:border-white/10 flex flex-col h-[580px]">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-white/[0.08] mb-3">
            <Code className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider m-0">
              Raw Packet JSON Inspector
            </h3>
          </div>

          {selectedEventRaw ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <span className="text-[11px] text-slate-500 mb-2">
                Selected Packet: <code className="text-rose-500 font-bold">{selectedEventRaw.id}</code>
              </span>
              <pre className="flex-1 p-3 rounded-2xl bg-black/80 text-emerald-400 font-mono text-[11px] overflow-auto border border-black/20 shadow-inner">
                {JSON.stringify(selectedEventRaw, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Code className="w-8 h-8 text-slate-400/60 mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Click any telemetry event card
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Inspect raw JSON schema, timestamps, and attached network metadata payloads.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
