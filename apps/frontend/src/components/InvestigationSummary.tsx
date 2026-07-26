'use client';

import { motion } from 'framer-motion';
import type { InvestigationDetail } from '@echotrace/shared';

interface InvestigationSummaryProps {
  investigation: InvestigationDetail;
}

export function InvestigationSummary({ investigation }: InvestigationSummaryProps) {
  const stats = [
    {
      label: 'Evidence Items',
      value: investigation.evidence.length,
      icon: '📎',
      color: 'border-echo-500/30 bg-echo-500/5',
      textColor: 'text-echo-400',
    },
    {
      label: 'Timeline Events',
      value: investigation.timeline.length,
      icon: '⏱',
      color: 'border-violet-500/30 bg-violet-500/5',
      textColor: 'text-violet-400',
    },
    {
      label: 'Entities',
      value: investigation.entities.length,
      icon: '👤',
      color: 'border-amber-500/30 bg-amber-500/5',
      textColor: 'text-amber-400',
    },
    {
      label: 'Contradictions',
      value: investigation.contradictions.length,
      icon: '⚠️',
      color: 'border-rose-500/30 bg-rose-500/5',
      textColor: 'text-rose-400',
    },
    {
      label: 'Relationships',
      value: investigation.relationships.length,
      icon: '🔗',
      color: 'border-emerald-500/30 bg-emerald-500/5',
      textColor: 'text-emerald-400',
    },
    {
      label: 'Status',
      value: investigation.status,
      icon: investigation.status === 'complete' ? '✅' : investigation.status === 'analyzing' ? '🔄' : '📝',
      color: investigation.status === 'complete'
        ? 'border-emerald-500/30 bg-emerald-500/5'
        : 'border-surface-300/30 bg-surface-100/50',
      textColor: investigation.status === 'complete' ? 'text-emerald-400' : 'text-muted-foreground',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-xl border p-4 ${stat.color}`}
            >
              <div className="text-lg mb-1">{stat.icon}</div>
              <div className={`text-2xl font-bold ${stat.textColor}`}>
                {typeof stat.value === 'number' ? stat.value : stat.value}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Evidence breakdown by type */}
        {investigation.evidence.length > 0 && (
          <div className="rounded-xl border border-surface-300/30 bg-surface/50 p-4">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Evidence by Type
            </h3>
            <div className="space-y-2">
              {groupByType(investigation.evidence).map(({ type, count }) => (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-xs text-foreground capitalize min-w-[80px]">
                    {typeIcon(type)} {type}
                  </span>
                  <div className="flex-1 h-2 bg-surface-200/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / investigation.evidence.length) * 100}%` }}
                      className="h-full rounded-full bg-echo-500"
                      transition={{ duration: 0.5, delay: 0.2 }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {investigation.description && (
          <div className="rounded-xl border border-surface-300/30 bg-surface/50 p-4">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Description
            </h3>
            <p className="text-sm text-foreground leading-relaxed">{investigation.description}</p>
          </div>
        )}

        {/* Timeline */}
        <div className="rounded-xl border border-surface-300/30 bg-surface/50 p-4">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Timeline Overview
          </h3>
          {investigation.timeline.length > 0 ? (
            <div className="space-y-1">
              {investigation.timeline.slice(0, 5).map((event, i) => (
                <div key={event.id || i} className="flex items-start gap-2 text-xs">
                  <span className="text-muted-foreground font-mono shrink-0 w-12">{event.time}</span>
                  <span className="text-foreground line-clamp-1">{event.description}</span>
                  <span className={`text-[10px] font-mono shrink-0 ${
                    event.confidence >= 0.8 ? 'text-emerald-400' : event.confidence >= 0.5 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {(event.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
              {investigation.timeline.length > 5 && (
                <p className="text-[10px] text-muted-foreground text-center pt-1">
                  +{investigation.timeline.length - 5} more events
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              No timeline events yet. Run analysis to generate them.
            </p>
          )}
        </div>

        {/* Created timestamp */}
        <p className="text-[10px] text-muted-foreground text-center">
          Created {new Date(investigation.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function groupByType(items: Array<{ type: string }>): Array<{ type: string; count: number }> {
  const map = new Map<string, number>();
  for (const item of items) {
    map.set(item.type, (map.get(item.type) || 0) + 1);
  }
  return Array.from(map.entries()).map(([type, count]) => ({ type, count }));
}

function typeIcon(type: string): string {
  const icons: Record<string, string> = {
    image: '🖼️',
    audio: '🎵',
    pdf: '📄',
    screenshot: '📸',
    video_frame: '🎬',
    text: '📝',
    map: '🗺️',
  };
  return icons[type] || '📎';
}
