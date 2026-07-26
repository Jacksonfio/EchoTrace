'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CopilotStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  detail?: string;
}

interface LiveCopilotProps {
  isAnalyzing: boolean;
  evidenceCount: number;
  onComplete?: () => void;
}

export function LiveCopilot({ isAnalyzing, evidenceCount, onComplete }: LiveCopilotProps) {
  const [steps, setSteps] = useState<CopilotStep[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Define analysis steps
  const analysisSteps: CopilotStep[] = [
    { id: 'scan', label: 'Scanning evidence files...', status: 'pending' },
    { id: 'read', label: 'Reading document contents...', status: 'pending' },
    { id: 'entities', label: 'Extracting entities...', status: 'pending' },
    { id: 'timeline', label: 'Building timeline...', status: 'pending' },
    { id: 'contradictions', label: 'Detecting contradictions...', status: 'pending' },
    { id: 'relationships', label: 'Mapping relationships...', status: 'pending' },
    { id: 'summary', label: 'Generating summary...', status: 'pending' },
  ];

  useEffect(() => {
    if (!isAnalyzing) {
      setSteps([]);
      setCurrentStepIndex(0);
      return;
    }

    // Start the analysis sequence
    setSteps(analysisSteps.map(s => ({ ...s, status: 'pending' })));
    setCurrentStepIndex(0);

    const interval = setInterval(() => {
      setCurrentStepIndex(prev => {
        const next = prev + 1;
        if (next >= analysisSteps.length) {
          clearInterval(interval);
          return prev;
        }
        return next;
      });
    }, 800); // Progress a step every 800ms

    return () => clearInterval(interval);
  }, [isAnalyzing, evidenceCount]);

  // Update step statuses based on current index
  useEffect(() => {
    setSteps(prev => prev.map((step, i) => {
      if (i < currentStepIndex) return { ...step, status: 'complete' as const };
      if (i === currentStepIndex) return { ...step, status: 'processing' as const };
      return { ...step, status: 'pending' as const };
    }));
  }, [currentStepIndex]);

  // Add details to steps as they progress
  useEffect(() => {
    setSteps(prev => prev.map((step, i) => {
      if (i !== currentStepIndex) return step;
      const details: Record<string, string> = {
        scan: `Found ${evidenceCount} file(s) to analyze`,
        read: 'Processing text and metadata...',
        entities: 'Identifying people, vehicles, locations...',
        timeline: 'Arranging events chronologically...',
        contradictions: 'Comparing evidence for conflicts...',
        relationships: 'Connecting entities to evidence...',
        summary: 'Compiling investigation findings...',
      };
      return { ...step, detail: details[step.id] || 'Processing...' };
    }));
  }, [currentStepIndex, evidenceCount]);

  // Auto-collapse when complete
  useEffect(() => {
    if (currentStepIndex >= analysisSteps.length - 1 && !isAnalyzing) {
      const timer = setTimeout(() => setIsExpanded(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStepIndex, isAnalyzing, analysisSteps.length]);

  const allDone = steps.length > 0 && steps.every(s => s.status === 'complete');

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className={`text-sm ${isAnalyzing ? 'text-amber-400' : 'text-muted-foreground'}`}>
            🤖
          </span>
          <div className="text-left min-w-0">
            <div className="text-xs font-medium text-foreground leading-tight">
              {isAnalyzing ? 'Analyzing...' : allDone ? 'Analysis Complete' : 'Live Copilot'}
            </div>
            <p className="text-[9px] text-muted-foreground">
              {isAnalyzing
                ? `${currentStepIndex + 1} / ${analysisSteps.length} steps`
                : allDone
                  ? `${evidenceCount} evidence items processed`
                  : `${evidenceCount} file(s) ready`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAnalyzing && (
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
          )}
          {allDone && (
            <span className="text-[10px] text-emerald-400 font-medium">✓</span>
          )}
          <span className="text-[10px] text-muted-foreground">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 space-y-1.5"
          >
            {/* Idle state */}
            {!isAnalyzing && steps.length === 0 && (
              <div className="py-2 text-center">
                <p className="text-[10px] text-muted-foreground">
                  Click Analyze to start processing
                </p>
              </div>
            )}

            {/* Progress steps */}
            {steps.map((step, i) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-start gap-2 text-xs p-1.5 rounded-lg transition-all ${
                  step.status === 'processing' ? 'bg-echo-500/10 border border-echo-500/20' : ''
                } ${step.status === 'complete' ? 'opacity-60' : ''}`}
              >
                {/* Status icon */}
                <span className="shrink-0 mt-0.5">
                  {step.status === 'complete' ? '✅' :
                   step.status === 'processing' ? '🔄' :
                   step.status === 'error' ? '❌' :
                   '⏳'}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-foreground ${
                      step.status === 'processing' ? 'font-medium text-echo-400' : ''
                    }`}>
                      {step.label}
                    </span>
                    {step.status === 'processing' && (
                      <span className="flex gap-0.5 ml-2">
                        <span className="w-1 h-1 bg-echo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-1 bg-echo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-1 bg-echo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    )}
                  </div>
                  {step.detail && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{step.detail}</p>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Completion message */}
            {allDone && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center"
              >
                <p className="text-xs text-emerald-400 font-medium">✅ Analysis Complete</p>
                <p className="text-[10px] text-emerald-400/60 mt-0.5">
                  All evidence processed — view results in Timeline and Entity tabs
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
