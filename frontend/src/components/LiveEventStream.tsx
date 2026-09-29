import React, { useState, useRef, useEffect } from 'react';
import type { StreamEvent, RelationshipType } from '../types/graph';
import { 
  Radio, 
  Trash2, 
  ArrowRight, 
  ShieldAlert, 
  SlidersHorizontal,
  Pause,
  Play
} from 'lucide-react';

interface LiveEventStreamProps {
  events: StreamEvent[];
  onClearEvents: () => void;
  onSelectEntity: (entityId: string) => void;
}

const RELATION_BADGES: Record<RelationshipType, { bg: string; text: string; border: string }> = {
  logged_in_to: { bg: 'bg-rose-500/15', text: 'text-rose-300', border: 'border-rose-500/30' },
  connected_to: { bg: 'bg-sky-500/15', text: 'text-sky-300', border: 'border-sky-500/30' },
  requested: { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  spawned: { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/30' },
  authenticated_as: { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30' },
  accessed: { bg: 'bg-indigo-500/15', text: 'text-indigo-300', border: 'border-indigo-500/30' },
};

export const LiveEventStream: React.FC<LiveEventStreamProps> = ({
  events,
  onClearEvents,
  onSelectEntity,
}) => {
  const [autoScroll, setAutoScroll] = useState(true);
  const [selectedRelation, setSelectedRelation] = useState<string>('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [events, autoScroll]);

  const filteredEvents = events.filter((e) => {
    if (selectedRelation === 'all') return true;
    if (selectedRelation === 'anomalies') return e.isAnomaly;
    return e.relationship === selectedRelation;
  });

  return (
    <div className="h-full flex flex-col glass-panel rounded-2xl p-4 overflow-hidden border border-white/[0.08]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white m-0 flex items-center gap-1.5">
              Live Ingestion Pipeline
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300 font-normal">
                {events.length} queued
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Real-time cybersecurity relationship stream
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              autoScroll 
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                : 'bg-white/[0.04] text-slate-400 border-white/[0.06]'
            }`}
            title={autoScroll ? 'Pause Auto-Scroll' : 'Resume Auto-Scroll'}
          >
            {autoScroll ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onClearEvents}
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-rose-300 border border-white/[0.06] transition-colors"
            title="Clear Event Log"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Relation Filters */}
      <div className="flex items-center gap-1.5 py-2.5 overflow-x-auto text-[11px] no-scrollbar">
        <span className="text-slate-500 flex items-center gap-1 text-[10px] pl-1">
          <SlidersHorizontal className="w-3 h-3 text-rose-400" />
        </span>
        {['all', 'anomalies', 'logged_in_to', 'connected_to', 'requested', 'spawned'].map((r) => (
          <button
            key={r}
            onClick={() => setSelectedRelation(r)}
            className={`px-2 py-0.5 rounded-lg whitespace-nowrap border transition-all ${
              selectedRelation === r
                ? 'bg-rose-500/25 border-rose-500/40 text-rose-200 font-medium'
                : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-slate-200'
            }`}
          >
            {r === 'all' ? 'All Events' : r.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Streaming Event Feed */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto space-y-2 pr-1"
      >
        {filteredEvents.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            Waiting for incoming event packets...
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const relBadge = RELATION_BADGES[evt.relationship] || {
              bg: 'bg-slate-500/15',
              text: 'text-slate-300',
              border: 'border-slate-500/30'
            };

            return (
              <div
                key={evt.id}
                className={`p-2.5 rounded-xl border text-xs transition-all ${
                  evt.isAnomaly
                    ? 'bg-rose-500/10 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                }`}
              >
                {/* Top row: Timestamp, Risk, Anomaly flag */}
                <div className="flex items-center justify-between text-[10px] mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400">{evt.timestamp}</span>
                    <span className="font-mono text-slate-500">#{evt.id}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {evt.isAnomaly && (
                      <span className="flex items-center gap-1 px-1.5 py-0.2 rounded bg-rose-500/25 border border-rose-500/40 text-rose-300 font-bold uppercase tracking-wider text-[9px]">
                        <ShieldAlert className="w-2.5 h-2.5" />
                        Anomaly
                      </span>
                    )}
                    <span className={`font-mono font-semibold ${
                      evt.riskScore > 70 ? 'text-rose-400' : evt.riskScore > 30 ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      Risk: {evt.riskScore}%
                    </span>
                  </div>
                </div>

                {/* Main Event Pipeline Tuple: Source -> Relation -> Target */}
                <div className="flex items-center gap-1.5 font-mono text-[11px] flex-wrap">
                  <button
                    onClick={() => onSelectEntity(evt.source)}
                    className="text-slate-200 hover:text-rose-300 hover:underline font-semibold bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]"
                    title={`Type: ${evt.sourceType}`}
                  >
                    {evt.source}
                  </button>

                  <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${relBadge.bg} ${relBadge.text} ${relBadge.border} text-[10px]`}>
                    <span>{evt.relationship}</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </div>

                  <button
                    onClick={() => onSelectEntity(evt.target)}
                    className="text-slate-200 hover:text-rose-300 hover:underline font-semibold bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]"
                    title={`Type: ${evt.targetType}`}
                  >
                    {evt.target}
                  </button>
                </div>

                {/* Subtext description if present */}
                {evt.anomalyReason && (
                  <p className="mt-1.5 text-[11px] text-rose-300/90 leading-tight">
                    {evt.anomalyReason}
                  </p>
                )}
                {evt.metadata?.note && (
                  <p className="mt-1 text-[10px] text-slate-500 italic">
                    {evt.metadata.note}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
