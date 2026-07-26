'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Evidence, Contradiction } from '@echotrace/shared';
import { LiveCopilot } from './LiveCopilot';
import { ClaimConfidenceMeter } from './ClaimConfidenceMeter';
import { EvidenceQualityScanner } from './EvidenceQualityScanner';

interface AnalysisBarProps {
  isAnalyzing: boolean;
  evidence: Evidence[];
  contradictions: Contradiction[];
  investigationId?: string;
}

export function AnalysisBar({ isAnalyzing, evidence, contradictions, investigationId }: AnalysisBarProps) {
  if (!investigationId) return null;

  return (
    <div className="border-b border-surface-300/30 bg-surface/30">
      <div className="flex items-center gap-4 px-6 py-2">
        {/* Live Copilot */}
        <div className="flex-1 min-w-0 max-w-[280px]">
          <LiveCopilot
            isAnalyzing={isAnalyzing}
            evidenceCount={evidence.length}
          />
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-surface-300/20 shrink-0" />

        {/* Confidence */}
        <div className="shrink-0">
          <div className="rounded-lg border border-surface-300/20 bg-surface-200/30 px-3 py-1.5">
            <ClaimConfidenceMeter
              evidence={evidence}
              contradictions={contradictions}
              isAnalyzing={isAnalyzing}
              compact
            />
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-surface-300/20 shrink-0" />

        {/* Quality */}
        <div className="shrink-0">
          <div className="rounded-lg border border-surface-300/20 bg-surface-200/30 px-3 py-1.5">
            <EvidenceQualityScanner
              evidence={evidence}
              compact
            />
          </div>
        </div>

        {/* Right spacer */}
        <div className="flex-1" />
      </div>
    </div>
  );
}
