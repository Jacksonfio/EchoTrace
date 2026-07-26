'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Entity } from '@echotrace/shared';
import { getConfidenceColor, cn } from '@/lib/utils';

interface EntityListProps {
  entities: Entity[];
}

const entityIcons: Record<string, string> = {
  Person: '👤',
  Vehicle: '🚗',
  Object: '📦',
  Location: '📍',
  Organization: '🏢',
  Other: '❓',
};

const entityColors: Record<string, string> = {
  Person: 'border-amber-500/30 bg-amber-500/5',
  Vehicle: 'border-cyan-500/30 bg-cyan-500/5',
  Object: 'border-violet-500/30 bg-violet-500/5',
  Location: 'border-emerald-500/30 bg-emerald-500/5',
  Organization: 'border-blue-500/30 bg-blue-500/5',
  Other: 'border-surface-300/30 bg-surface-100/50',
};

export function EntityList({ entities }: EntityListProps) {
  if (entities.length === 0) {
    return (
      <div className="px-4 py-4 text-center">
        <p className="text-xs text-muted-foreground">No entities extracted yet</p>
      </div>
    );
  }

  return (
    <div className="px-3 py-2 max-h-[250px] overflow-y-auto space-y-1.5">
      <AnimatePresence>
        {entities.map((entity, i) => (
          <motion.div
            key={entity.id}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={cn(
              'flex items-center gap-2.5 px-2.5 py-2 rounded-lg border',
              entityColors[entity.type] || entityColors.Other
            )}
          >
            <span className="text-lg">{entityIcons[entity.type] || '❓'}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-foreground truncate">
                {entity.name}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">
                  {entity.type}
                </span>
                {entity.description && (
                  <span className="text-[10px] text-muted-foreground truncate">
                    — {entity.description}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className={cn('text-[10px] font-mono font-medium', getConfidenceColor(entity.confidence))}>
                {(entity.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
