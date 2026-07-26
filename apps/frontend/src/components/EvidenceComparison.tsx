'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Evidence } from '@echotrace/shared';
import { formatBytes } from '@/lib/utils';

interface EvidenceComparisonProps {
  evidence: Evidence[];
}

const typeIcons: Record<string, string> = {
  image: '🖼️',
  audio: '🎵',
  pdf: '📄',
  screenshot: '📸',
  video_frame: '🎬',
  text: '📝',
  map: '🗺️',
};

export function EvidenceComparison({ evidence }: EvidenceComparisonProps) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);

  const leftEv = evidence.find(e => e.id === selectedLeft);
  const rightEv = evidence.find(e => e.id === selectedRight);

  if (evidence.length < 2) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl mb-3">🔍</div>
          <p className="text-muted-foreground text-sm">Need at least 2 evidence items to compare</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Upload more evidence and run analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Selection bar */}
      <div className="flex gap-4 p-4 border-b border-surface-300/30">
        <div className="flex-1">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Evidence A</label>
          <select
            value={selectedLeft || ''}
            onChange={e => setSelectedLeft(e.target.value || null)}
            className="w-full px-3 py-1.5 text-xs bg-surface-200/50 border border-surface-300/30 rounded-lg focus:outline-none focus:border-echo-500/50 text-foreground"
          >
            <option value="">Select evidence...</option>
            {evidence.map(ev => (
              <option key={ev.id} value={ev.id} disabled={ev.id === selectedRight}>
                {ev.name} ({ev.type})
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Evidence B</label>
          <select
            value={selectedRight || ''}
            onChange={e => setSelectedRight(e.target.value || null)}
            className="w-full px-3 py-1.5 text-xs bg-surface-200/50 border border-surface-300/30 rounded-lg focus:outline-none focus:border-echo-500/50 text-foreground"
          >
            <option value="">Select evidence...</option>
            {evidence.map(ev => (
              <option key={ev.id} value={ev.id} disabled={ev.id === selectedLeft}>
                {ev.name} ({ev.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison view */}
      <div className="flex-1 flex overflow-hidden">
        {(leftEv || rightEv) ? (
          <>
            {/* Left panel */}
            <div className="flex-1 overflow-y-auto p-4 border-r border-surface-300/30 scrollbar-thin">
              {leftEv ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{typeIcons[leftEv.type] || '📎'}</span>
                    <div>
                      <h3 className="text-sm font-medium text-foreground">{leftEv.name}</h3>
                      <span className="text-[10px] text-muted-foreground capitalize">{leftEv.type}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <DetailBox label="Type" value={leftEv.type} />
                    <DetailBox label="Size" value={formatBytes(leftEv.sizeBytes)} />
                    <DetailBox label="Uploaded" value={new Date(leftEv.uploadedAt).toLocaleString()} />
                    <DetailBox label="MIME" value={leftEv.mimeType} />
                  </div>
                  {leftEv.description && (
                    <div className="rounded-lg bg-surface-200/30 border border-surface-300/20 p-3">
                      <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Description</div>
                      <p className="text-xs text-foreground">{leftEv.description}</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                  Select Evidence A
                </div>
              )}
            </div>

            {/* Right panel */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              {rightEv ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{typeIcons[rightEv.type] || '📎'}</span>
                    <div>
                      <h3 className="text-sm font-medium text-foreground">{rightEv.name}</h3>
                      <span className="text-[10px] text-muted-foreground capitalize">{rightEv.type}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <DetailBox label="Type" value={rightEv.type} />
                    <DetailBox label="Size" value={formatBytes(rightEv.sizeBytes)} />
                    <DetailBox label="Uploaded" value={new Date(rightEv.uploadedAt).toLocaleString()} />
                    <DetailBox label="MIME" value={rightEv.mimeType} />
                  </div>
                  {rightEv.description && (
                    <div className="rounded-lg bg-surface-200/30 border border-surface-300/20 p-3">
                      <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Description</div>
                      <p className="text-xs text-foreground">{rightEv.description}</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                  Select Evidence B
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl mb-3">👆</div>
              <p className="text-muted-foreground text-sm">Select two evidence items to compare</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Side-by-side comparison helps spot inconsistencies</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-200/20 border border-surface-300/20 p-2.5">
      <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-xs text-foreground font-medium mt-0.5">{value}</div>
    </div>
  );
}
