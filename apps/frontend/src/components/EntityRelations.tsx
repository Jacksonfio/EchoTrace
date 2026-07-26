'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Entity, Evidence, Relationship } from '@echotrace/shared';
import { getConfidenceColor } from '@/lib/utils';

interface EntityRelationsProps {
  entities: Entity[];
  evidence: Evidence[];
  relationships: Relationship[];
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

export function EntityRelations({ entities, evidence, relationships }: EntityRelationsProps) {
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  if (entities.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">🔎</div>
          <p className="text-muted-foreground mb-2">No entities extracted yet</p>
          <p className="text-xs text-muted-foreground/60">
            Upload evidence and run analysis to identify people, vehicles, locations, and more
          </p>
        </div>
      </div>
    );
  }

  const entityTypes = ['all', ...new Set(entities.map(e => e.type))];
  const filtered = filterType === 'all' ? entities : entities.filter(e => e.type === filterType);

  // Find evidence linked to an entity
  const getLinkedEvidence = (entityId: string): Evidence[] => {
    const linkedIds = relationships
      .filter(r => r.sourceId === entityId || r.targetId === entityId)
      .flatMap(r => [r.sourceId, r.targetId]);
    return evidence.filter(e => linkedIds.includes(e.id));
  };

  // Find relationships for an entity
  const getEntityRelationships = (entityId: string): Relationship[] => {
    return relationships.filter(r => r.sourceId === entityId || r.targetId === entityId);
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Entity List */}
      <div className="w-[280px] border-r border-surface-300/30 flex flex-col shrink-0">
        {/* Filter tabs */}
        <div className="flex flex-wrap gap-1 p-3 border-b border-surface-300/30 shrink-0">
          {entityTypes.map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`text-[10px] px-2 py-1 rounded-full transition-all ${
                filterType === type
                  ? 'bg-echo-600/20 text-echo-400 border border-echo-500/30'
                  : 'bg-surface-200/50 text-muted-foreground border border-transparent hover:text-foreground'
              }`}
            >
              {type === 'all' ? 'All' : type}
              {type !== 'all' && (
                <span className="ml-1 opacity-60">({entities.filter(e => e.type === type).length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Entity cards */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-3 space-y-2">
            <AnimatePresence>
              {filtered.map((entity, i) => (
                <motion.button
                  key={entity.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelectedEntity(selectedEntity === entity.id ? null : entity.id)}
                  className={`w-full text-left rounded-xl border p-3 transition-all ${
                    entityColors[entity.type] || entityColors.Other
                  } ${
                    selectedEntity === entity.id
                      ? 'ring-2 ring-echo-500/30'
                      : 'hover:border-echo-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{entityIcons[entity.type] || '❓'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {entity.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">{entity.type}</span>
                        <span className={getConfidenceColor(entity.confidence)}>
                          {(entity.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {entity.mentions?.length || 0} refs
                    </span>
                  </div>

                  {entity.description && (
                    <p className="text-[10px] text-muted-foreground mt-2 line-clamp-2">
                      {entity.description}
                    </p>
                  )}

                  {selectedEntity === entity.id && (
                    <div className="mt-3 pt-3 border-t border-surface-300/20">
                      {(() => {
                        const linked = getLinkedEvidence(entity.id);
                        const rels = getEntityRelationships(entity.id);
                        return (
                          <>
                            {rels.length > 0 && (
                              <div className="mb-2">
                                <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">
                                  Relationships
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {rels.map(rel => (
                                    <span
                                      key={rel.id}
                                      className="text-[9px] px-1.5 py-0.5 rounded-full bg-surface-200/50 text-muted-foreground"
                                    >
                                      {rel.relation}
                                      {rel.confidence && ` ${(rel.confidence * 100).toFixed(0)}%`}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {linked.length > 0 && (
                              <div>
                                <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">
                                  Linked Evidence
                                </div>
                                <div className="space-y-1">
                                  {linked.map(ev => (
                                    <div
                                      key={ev.id}
                                      className="text-[10px] px-2 py-1 rounded bg-surface-200/30 text-foreground"
                                    >
                                      📎 {ev.name}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Count summary */}
        <div className="p-3 border-t border-surface-300/30 text-[10px] text-muted-foreground text-center shrink-0">
          {entities.length} entities · {relationships.length} relationships · {evidence.length} evidence items
        </div>
      </div>

      {/* Detail Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedEntity ? (
          (() => {
            const entity = entities.find(e => e.id === selectedEntity);
            if (!entity) return null;
            const linked = getLinkedEvidence(entity.id);
            const rels = getEntityRelationships(entity.id);
            return (
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Entity header */}
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{entityIcons[entity.type] || '❓'}</div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-foreground">{entity.name}</h2>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-surface-200/50 text-muted-foreground">
                          {entity.type}
                        </span>
                        <span className={`text-xs font-mono ${getConfidenceColor(entity.confidence)}`}>
                          {(entity.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                      {entity.description && (
                        <p className="text-sm text-muted-foreground mt-3">{entity.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  {entity.metadata && Object.keys(entity.metadata).length > 0 && (
                    <div className="rounded-xl border border-surface-300/30 bg-surface/50 p-4">
                      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                        Metadata
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(entity.metadata).map(([key, val]) => (
                          <div key={key}>
                            <div className="text-[10px] text-muted-foreground uppercase">{key}</div>
                            <div className="text-sm text-foreground font-medium">{val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Relationships */}
                  {rels.length > 0 && (
                    <div className="rounded-xl border border-surface-300/30 bg-surface/50 p-4">
                      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                        Relationships ({rels.length})
                      </h3>
                      <div className="space-y-2">
                        {rels.map(rel => {
                          const target = entities.find(e => e.id === rel.targetId) || 
                                        evidence.find(e => e.id === rel.targetId);
                          const targetName = target ? (target as Entity | Evidence).name : rel.targetId.slice(0, 8);
                          return (
                            <div key={rel.id} className="flex items-center gap-2 text-sm">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${
                                rel.relation === 'contradicts' 
                                  ? 'bg-rose-500/20 text-rose-400' 
                                  : rel.relation === 'confirms'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-surface-200/50 text-muted-foreground'
                              }`}>
                                {rel.relation}
                              </span>
                              <span className="text-muted-foreground">→</span>
                              <span className="text-foreground font-medium">
                                {targetName}
                              </span>
                              {rel.confidence && (
                                <span className={`text-[10px] font-mono ${getConfidenceColor(rel.confidence)}`}>
                                  {(rel.confidence * 100).toFixed(0)}%
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Linked Evidence */}
                  {linked.length > 0 && (
                    <div className="rounded-xl border border-surface-300/30 bg-surface/50 p-4">
                      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                        Linked Evidence ({linked.length})
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {linked.map(ev => (
                          <div key={ev.id} className="p-3 rounded-lg bg-surface-200/30 border border-surface-300/20">
                            <div className="text-xs font-medium text-foreground truncate">{ev.name}</div>
                            <div className="text-[10px] text-muted-foreground mt-1 capitalize">{ev.type}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Evidence mentions */}
                  {entity.mentions && entity.mentions.length > 0 && (
                    <div className="rounded-xl border border-surface-300/30 bg-surface/50 p-4">
                      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                        Mentioned In ({entity.mentions.length} evidence items)
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {entity.mentions.map((mid, i) => {
                          const ev = evidence.find(e => e.id === mid);
                          return (
                            <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-echo-500/10 text-echo-400 border border-echo-500/20">
                              📎 {ev?.name || mid.slice(0, 8)}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl mb-3">👆</div>
              <p className="text-muted-foreground">Select an entity to view details</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Click any entity card on the left to see its relationships and linked evidence
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
