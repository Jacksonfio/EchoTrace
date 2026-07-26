'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { TimelineEvent, Evidence } from '@echotrace/shared';
import { formatTime, formatDate, getConfidenceColor, cn } from '@/lib/utils';

interface TimelineProps {
  events: TimelineEvent[];
  evidence: Evidence[];
  loading?: boolean;
}

export function Timeline({ events, evidence, loading }: TimelineProps) {
  const sorted = [...events].sort((a, b) => {
    // Sort by date then time
    const dateCompare = (a.date || '').localeCompare(b.date || '');
    if (dateCompare !== 0) return dateCompare;
    return a.time.localeCompare(b.time);
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-2 border-echo-500/30 rounded-full animate-ping" />
            <div className="absolute inset-2 border-2 border-echo-500/50 rounded-full animate-ping" style={{ animationDelay: '0.3s' }} />
            <div className="absolute inset-4 border-2 border-echo-500 rounded-full animate-spin" style={{ animationDuration: '1s' }} />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Analyzing evidence...</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Extracting entities, events, and relationships</p>
        </div>
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-muted-foreground mb-2">No timeline events yet</p>
          <p className="text-xs text-muted-foreground/60">
            Upload evidence and run analysis to generate a timeline
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 timeline-scroll">
      <div className="relative max-w-3xl mx-auto">
        {/* Timeline spine */}
        <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-echo-500/40 via-echo-500/20 to-transparent" />

        <div className="space-y-6">
          {sorted.map((event, index) => {
            const isContradiction = event.eventType === 'contradiction';
            const isInference = event.eventType === 'inference';
            const relatedEvidence = event.evidenceIds
              .map(id => evidence.find(e => e.id === id))
              .filter(Boolean) as Evidence[];

            return (
              <motion.div
                key={event.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="relative pl-14"
              >
                {/* Timeline dot */}
                <div className={cn(
                  'absolute left-[15px] w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center',
                  isContradiction
                    ? 'border-rose-500 bg-rose-500/20'
                    : isInference
                    ? 'border-amber-500 bg-amber-500/20'
                    : 'border-echo-500 bg-echo-500/20'
                )}>
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    isContradiction ? 'bg-rose-500' : isInference ? 'bg-amber-500' : 'bg-echo-500'
                  )} />
                </div>

                {/* Timestamp */}
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-mono font-semibold text-foreground">
                    {formatTime(event.time)}
                  </span>
                  {event.date && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatDate(event.date)}
                    </span>
                  )}
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                    event.eventType === 'observation' && 'bg-blue-500/10 text-blue-400',
                    event.eventType === 'statement' && 'bg-violet-500/10 text-violet-400',
                    event.eventType === 'inference' && 'bg-amber-500/10 text-amber-400',
                    event.eventType === 'contradiction' && 'bg-rose-500/10 text-rose-400',
                    !event.eventType && 'bg-surface-300/30 text-muted-foreground'
                  )}>
                    {event.eventType || 'event'}
                  </span>
                </div>

                {/* Event card */}
                <div className={cn(
                  'rounded-xl border p-4 transition-all',
                  isContradiction
                    ? 'border-rose-500/30 bg-rose-500/5'
                    : isInference
                    ? 'border-amber-500/30 bg-amber-500/5'
                    : 'border-surface-300/30 bg-surface/60 backdrop-blur-sm hover:border-surface-300/60'
                )}>
                  <p className="text-sm text-foreground leading-relaxed">{event.description}</p>
                  
                  {/* Confidence */}
                  <div className="flex items-center gap-2 mt-3">
                    <span className={cn('text-xs font-mono font-medium', getConfidenceColor(event.confidence))}>
                      {(event.confidence * 100).toFixed(0)}% confidence
                    </span>
                    <div className="flex-1 h-1 bg-surface-300/30 rounded-full max-w-[100px] overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', {
                          'bg-emerald-500': event.confidence >= 0.8,
                          'bg-amber-500': event.confidence >= 0.5 && event.confidence < 0.8,
                          'bg-rose-500': event.confidence < 0.5,
                        })}
                        style={{ width: `${event.confidence * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Related evidence */}
                  {relatedEvidence.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {relatedEvidence.map(ev => (
                        <span
                          key={ev.id}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-surface-200/50 text-muted-foreground border border-surface-300/20"
                        >
                          📎 {ev.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
