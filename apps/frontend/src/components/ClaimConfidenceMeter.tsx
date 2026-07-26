'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Evidence, Contradiction } from '@echotrace/shared';

interface ClaimConfidenceMeterProps {
  evidence: Evidence[];
  contradictions: Contradiction[];
  isAnalyzing: boolean;
  compact?: boolean;
}

interface ConfidenceFactor {
  label: string;
  impact: number; // positive = adds confidence, negative = reduces
  reason: string;
  type: 'positive' | 'negative' | 'neutral';
}

export function ClaimConfidenceMeter({ evidence, contradictions, isAnalyzing, compact }: ClaimConfidenceMeterProps) {
  const { score, factors, changes } = useMemo(() => {
    const factors: ConfidenceFactor[] = [];
    let baseScore = 50; // Start at 50%

    // Factor 1: Evidence count
    if (evidence.length >= 3) {
      baseScore += 15;
      factors.push({ label: 'Multiple Evidence Sources', impact: 15, reason: `${evidence.length} pieces of evidence strengthen the case`, type: 'positive' });
    } else if (evidence.length >= 1) {
      baseScore += 5;
      factors.push({ label: 'Evidence Submitted', impact: 5, reason: `Initial evidence provides a foundation`, type: 'positive' });
    }

    // Factor 2: Evidence type diversity
    const types = new Set(evidence.map(e => e.type));
    if (types.size >= 3) {
      baseScore += 10;
      factors.push({ label: 'Diverse Evidence Types', impact: 10, reason: `Multiple evidence types (${types.size}) provide cross-validation`, type: 'positive' });
    } else if (types.size >= 2) {
      baseScore += 5;
      factors.push({ label: 'Multiple Formats', impact: 5, reason: `${types.size} different evidence types submitted`, type: 'positive' });
    }

    // Factor 3: Contradictions reduce confidence
    if (contradictions.length > 0) {
      const penalty = Math.min(contradictions.length * 12, 40);
      baseScore -= penalty;
      factors.push({ label: 'Contradictions Detected', impact: -penalty, reason: `${contradictions.length} contradiction(s) found in evidence`, type: 'negative' });
    }

    // Factor 4: High severity contradictions
    const criticalContradictions = contradictions.filter(c => c.severity === 'critical' || c.severity === 'high');
    if (criticalContradictions.length > 0) {
      const extraPenalty = criticalContradictions.length * 8;
      baseScore -= extraPenalty;
      factors.push({ label: 'Critical Discrepancies', impact: -extraPenalty, reason: `${criticalContradictions.length} high-severity contradiction(s)`, type: 'negative' });
    }

    // Factor 5: Text evidence adds confidence
    const textEvidence = evidence.filter(e => e.type === 'text' || e.description);
    if (textEvidence.length > 1) {
      baseScore += 8;
      factors.push({ label: 'Detailed Statements', impact: 8, reason: `Multiple textual descriptions provide context`, type: 'positive' });
    }

    // Clamp score
    const finalScore = Math.max(5, Math.min(99, baseScore));

    // Build change explanations
    const changes = factors.filter(f => f.impact !== 0);

    return { score: finalScore, factors, changes };
  }, [evidence, contradictions]);

  const scoreColor = score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-rose-400';
  const scoreBg = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className="rounded-xl border border-surface-300/30 bg-surface/50 p-4">
      {compact ? (
        /* ── Compact Version (mini score + label only) ── */
        <div className="flex items-center gap-2">
          <div className="relative w-10 h-10 shrink-0">
            <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
              <motion.circle
                cx="50" cy="50" r="42" fill="none"
                stroke="currentColor" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - score / 100) }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={scoreBg}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-[10px] font-bold ${scoreColor}`}>{score}%</span>
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-medium text-foreground leading-tight">
              {score >= 80 ? 'Strong Case' : score >= 50 ? 'Needs Review' : 'Weak Case'}
            </div>
            <p className="text-[9px] text-muted-foreground">
              {evidence.length} items · {changes.filter(c => c.impact < 0).length} issues
            </p>
          </div>
        </div>
      ) : (
        /* ── Full Version ── */
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Claim Confidence
            </h3>
            {isAnalyzing && (
              <span className="text-[10px] text-amber-400 animate-pulse">Updating...</span>
            )}
          </div>

          {/* Score circle */}
          <div className="flex justify-center mb-4">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                <motion.circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="currentColor" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - score / 100) }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={scoreBg}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.span
                  key={score}
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`text-2xl font-bold ${scoreColor}`}
                >
                  {score}%
                </motion.span>
              </div>
            </div>
          </div>

          {/* Score label */}
          <p className="text-center text-xs text-muted-foreground mb-4">
            {score >= 80 ? 'Strong Case' : score >= 50 ? 'Needs Review' : 'Weak Evidence'}
          </p>

          {/* Factors list */}
          <AnimatePresence>
            {changes.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                  Breakdown
                </div>
                {changes.map((factor, i) => (
                  <motion.div
                    key={factor.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-2 text-xs"
                  >
                    <span className={`shrink-0 text-sm ${
                      factor.type === 'positive' ? 'text-emerald-400' :
                      factor.type === 'negative' ? 'text-rose-400' : 'text-muted-foreground'
                    }`}>
                      {factor.impact > 0 ? '↑' : '↓'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-foreground font-medium">{factor.label}</span>
                        <span className={`font-mono text-[10px] ${
                          factor.impact > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {factor.impact > 0 ? '+' : ''}{factor.impact}%
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{factor.reason}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {evidence.length === 0 && (
            <p className="text-center text-[10px] text-muted-foreground py-4">
              Upload evidence to calculate claim confidence
            </p>
          )}
        </>
      )}
    </div>
  );
}
