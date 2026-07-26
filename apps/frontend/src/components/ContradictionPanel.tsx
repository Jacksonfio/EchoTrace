'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Contradiction } from '@echotrace/shared';
import { getSeverityColor, getConfidenceColor, cn } from '@/lib/utils';

interface ContradictionPanelProps {
  contradictions: Contradiction[];
  compact?: boolean;
}

export function ContradictionPanel({ contradictions, compact }: ContradictionPanelProps) {
  if (contradictions.length === 0) {
    return (
      <div>
        <div className="px-4 pt-3 pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Contradictions
        </div>
        <div className="px-4 pb-3 text-center">
          <p className="text-[10px] text-muted-foreground">✓ No contradictions detected</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 pt-3 pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        Contradictions
        <span className="bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded-full text-[9px] ml-auto font-normal">
          {contradictions.length}
        </span>
      </div>
      <div className="px-4 pb-3 space-y-1.5">
        <AnimatePresence>
          {contradictions.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-lg border border-rose-500/15 bg-rose-500/5 p-2"
            >
              <div className="flex items-start gap-1.5">
                <span className="text-[10px] mt-0.5 shrink-0">⚠️</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-foreground leading-relaxed">
                    {c.description}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className={cn(
                      'text-[8px] px-1 py-0.5 rounded-full border leading-none',
                      getSeverityColor(c.severity)
                    )}>
                      {c.severity}
                    </span>
                    <span className={cn('text-[8px] font-mono', getConfidenceColor(c.confidence))}>
                      {(c.confidence * 100).toFixed(0)}%
                    </span>
                    <span className="text-[8px] px-1 py-0.5 rounded bg-surface-200/50 text-muted-foreground leading-none">
                      {c.category}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
