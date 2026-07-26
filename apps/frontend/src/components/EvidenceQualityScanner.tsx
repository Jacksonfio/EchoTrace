'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Evidence } from '@echotrace/shared';
import { formatBytes } from '@/lib/utils';

interface QualityResult {
  fileId: string;
  fileName: string;
  checks: QualityCheck[];
  overallScore: number;
}

interface QualityCheck {
  label: string;
  status: 'pass' | 'warn' | 'fail' | 'info';
  message: string;
}

interface EvidenceQualityScannerProps {
  evidence: Evidence[];
  compact?: boolean;
}

export function EvidenceQualityScanner({ evidence, compact }: EvidenceQualityScannerProps) {
  const results = useMemo(() => {
    return evidence.map(ev => scanEvidence(ev));
  }, [evidence]);

  const averageScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.overallScore, 0) / results.length)
    : 0;

  if (evidence.length === 0) {
    if (compact) {
      return (
        <div className="flex items-center gap-2">
          <div className="text-lg opacity-50">📸</div>
          <div className="text-[10px] text-muted-foreground">No evidence to scan</div>
        </div>
      );
    }
    return (
      <div className="rounded-xl border border-surface-300/30 bg-surface/50 p-4">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          📸 Evidence Quality
        </h3>
        <p className="text-center text-[10px] text-muted-foreground py-4">
          Upload evidence to scan quality
        </p>
      </div>
    );
  }

  if (compact) {
    const worstResult = results.reduce((worst, r) => r.overallScore < worst.overallScore ? r : worst, results[0]);
    return (
      <div className="flex items-center gap-2">
        <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
          <span className={`text-xs font-bold ${
            averageScore >= 80 ? 'text-emerald-400' : averageScore >= 50 ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {averageScore}%
          </span>
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-medium text-foreground leading-tight">
            Quality Score
          </div>
          <p className="text-[9px] text-muted-foreground">
            {results.length} files · Worst: {worstResult.overallScore}%
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-surface-300/30 bg-surface/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          📸 Evidence Quality
        </h3>
        <span className={`text-xs font-bold ${
          averageScore >= 80 ? 'text-emerald-400' : averageScore >= 50 ? 'text-amber-400' : 'text-rose-400'
        }`}>
          {averageScore}% avg
        </span>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
        <AnimatePresence>
          {results.map((result, i) => (
            <motion.div
              key={result.fileId}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-lg border border-surface-300/20 bg-surface-200/30 p-2.5"
            >
              {/* File header */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs">{getFileIcon(result.fileName)}</span>
                  <span className="text-[11px] text-foreground font-medium truncate">
                    {result.fileName}
                  </span>
                </div>
                <span className={`text-[10px] font-mono font-bold ${
                  result.overallScore >= 80 ? 'text-emerald-400' : result.overallScore >= 50 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {result.overallScore}%
                </span>
              </div>

              {/* Quality checks */}
              <div className="space-y-0.5">
                {result.checks.slice(0, 4).map((check, ci) => (
                  <div key={ci} className="flex items-start gap-1.5 text-[10px]">
                    <span className="shrink-0 mt-0.5">
                      {check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : check.status === 'fail' ? '❌' : 'ℹ️'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-foreground">{check.label}</span>
                      <span className="text-muted-foreground ml-1">— {check.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function scanEvidence(ev: Evidence): QualityResult {
  const checks: QualityCheck[] = [];
  const name = ev.name || 'Unknown file';

  // Check 1: Has name
  if (ev.name && ev.name.length > 3) {
    checks.push({ label: 'File Name', status: 'pass', message: 'Descriptive name provided' });
  } else {
    checks.push({ label: 'File Name', status: 'warn', message: 'Name too short or missing' });
  }

  // Check 2: Has description
  if (ev.description && ev.description.length > 10) {
    checks.push({ label: 'Description', status: 'pass', message: 'Detailed description available' });
  } else if (ev.description) {
    checks.push({ label: 'Description', status: 'warn', message: 'Description is brief' });
  } else {
    checks.push({ label: 'Description', status: 'fail', message: 'No description provided' });
  }

  // Check 3: File size
  if (ev.sizeBytes > 1000000) {
    checks.push({ label: 'File Size', status: 'pass', message: `${formatBytes(ev.sizeBytes)} — good resolution` });
  } else if (ev.sizeBytes > 100000) {
    checks.push({ label: 'File Size', status: 'info', message: `${formatBytes(ev.sizeBytes)} — acceptable` });
  } else if (ev.sizeBytes > 0) {
    checks.push({ label: 'File Size', status: 'warn', message: `${formatBytes(ev.sizeBytes)} — may be too small` });
  }

  // Check 4: Evidence type specific
  if (ev.type === 'image' || ev.type === 'screenshot') {
    checks.push({ label: 'Visual Evidence', status: 'pass', message: 'Image file accepted for analysis' });
  } else if (ev.type === 'audio') {
    checks.push({ label: 'Audio Evidence', status: 'info', message: 'Audio transcription may be needed' });
  } else if (ev.type === 'text') {
    checks.push({ label: 'Text Evidence', status: 'pass', message: 'Text content ready for analysis' });
  } else if (ev.type === 'pdf') {
    checks.push({ label: 'Document', status: 'info', message: 'PDF parsing required for text extraction' });
  }

  // Check 5: Has file content
  if (ev.filePath) {
    checks.push({ label: 'File Upload', status: 'pass', message: 'File successfully uploaded' });
  } else {
    checks.push({ label: 'File Upload', status: 'fail', message: 'File path missing' });
  }

  // Calculate score
  const weights: Record<string, number> = { pass: 100, info: 75, warn: 40, fail: 0 };
  const overallScore = Math.round(
    checks.reduce((sum, c) => sum + (weights[c.status] || 50), 0) / checks.length
  );

  return { fileId: ev.id, fileName: name, checks, overallScore };
}

function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return '🎵';
  if (ext === 'pdf') return '📄';
  if (ext === 'txt') return '📝';
  return '📎';
}
