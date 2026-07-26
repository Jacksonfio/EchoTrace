'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/Sidebar';
import { Timeline } from '@/components/Timeline';
import { InvestigationSummary } from '@/components/InvestigationSummary';
import { EntityRelations } from '@/components/EntityRelations';
import { EvidenceComparison } from '@/components/EvidenceComparison';
import { UploadZone } from '@/components/UploadZone';
import { ContradictionPanel } from '@/components/ContradictionPanel';
import { EvidenceCard } from '@/components/EvidenceCard';
import { CaseNotes } from '@/components/CaseNotes';
import { ClaimConfidenceMeter } from '@/components/ClaimConfidenceMeter';
import { EvidenceQualityScanner } from '@/components/EvidenceQualityScanner';
import { AnalysisBar } from '@/components/AnalysisBar';
import { FloatingChat } from '@/components/FloatingChat';
import {
  listInvestigations,
  createInvestigation,
  getInvestigation,
  uploadEvidenceBatch,
  runAnalysis,
  sendChatMessage,
  seedDemoData,
} from '@/lib/api';
import type { Investigation, InvestigationDetail, Evidence } from '@echotrace/shared';

type ViewMode = 'summary' | 'timeline' | 'entities' | 'evidence' | 'compare';

export default function Dashboard() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [activeInvestigation, setActiveInvestigation] = useState<InvestigationDetail | null>(null);
  const [activeView, setActiveView] = useState<ViewMode>('timeline');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  // Load investigations on mount
  useEffect(() => {
    loadInvestigations();
  }, []);

  async function loadInvestigations() {
    try {
      const invs = await listInvestigations();
      setInvestigations(invs);
    } catch (err) {
      console.error('Failed to load investigations:', err);
    }
  }

  const handleCreateInvestigation = useCallback(async (title: string, description?: string) => {
    setIsCreating(true);
    setError(null);
    try {
      const inv = await createInvestigation(title, description);
      setInvestigations(prev => [inv, ...prev]);
      setActiveInvestigation({ ...inv, evidence: [], timeline: [], entities: [], contradictions: [], relationships: [] });
      return inv;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const handleSelectInvestigation = useCallback(async (id: string) => {
    setError(null);
    try {
      const detail = await getInvestigation(id);
      setActiveInvestigation(detail);
      setChatMessages([]);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const handleUploadFiles = useCallback(async (files: File[]) => {
    if (!activeInvestigation) {
      setError('Create or select an investigation first');
      return;
    }
    try {
      const evidence = await uploadEvidenceBatch(activeInvestigation.id, files);
      const updated = await getInvestigation(activeInvestigation.id);
      setActiveInvestigation(updated);
    } catch (err: any) {
      setError(err.message);
    }
  }, [activeInvestigation]);

  const handleRunAnalysis = useCallback(async () => {
    if (!activeInvestigation) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      await runAnalysis(activeInvestigation.id);
      const updated = await getInvestigation(activeInvestigation.id);
      setActiveInvestigation(updated);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [activeInvestigation]);

  const handleLoadDemo = useCallback(async () => {
    setIsLoadingDemo(true);
    setError(null);
    try {
      const detail = await seedDemoData();
      setInvestigations(prev => [detail, ...prev]);
      setActiveInvestigation(detail);
      setChatMessages([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingDemo(false);
    }
  }, []);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!activeInvestigation) return;
    
    setChatMessages(prev => [...prev, { role: 'user', content: message }]);
    
    try {
      const response = await sendChatMessage(activeInvestigation.id, message);
      setChatMessages(prev => [...prev, { role: 'assistant', content: response.message }]);
    } catch (err: any) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    }
  }, [activeInvestigation]);

  const evidence = activeInvestigation?.evidence || [];
  const contradictions = activeInvestigation?.contradictions || [];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        investigations={investigations}
        activeId={activeInvestigation?.id}
        onSelect={handleSelectInvestigation}
        onCreate={handleCreateInvestigation}
        onLoadDemo={handleLoadDemo}
        isLoadingDemo={isLoadingDemo}
        isCreating={isCreating}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar - Larger for visibility */}
        <header className="h-16 border-b border-surface-300/30 flex items-center justify-between px-6 shrink-0 bg-background/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4 min-w-0">
            <h1 className="text-lg font-semibold text-foreground truncate">
              {activeInvestigation?.title || 'EchoTrace AI'}
            </h1>
            {activeInvestigation && (
              <span className="text-xs text-muted-foreground bg-surface-200/50 px-2.5 py-1 rounded-full shrink-0 border border-surface-300/20">
                {activeInvestigation.status}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex bg-surface-200/50 rounded-lg p-0.5">
              {(['summary', 'timeline', 'entities', 'evidence', 'compare'] as ViewMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setActiveView(mode)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    activeView === mode
                      ? 'bg-echo-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {mode === 'summary' ? '📊' : mode === 'timeline' ? '⏱' : mode === 'entities' ? '👤' : mode === 'evidence' ? '📎' : '🔍'}
                  <span className="ml-1.5 hidden sm:inline">
                    {mode === 'summary' ? 'Overview' : mode === 'timeline' ? 'Timeline' : mode === 'entities' ? 'Entities' : mode === 'evidence' ? 'Evidence' : 'Compare'}
                  </span>
                </button>
              ))}
            </div>

            {/* Analyze Button */}
            {activeInvestigation && evidence.length > 0 && (
              <button
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                className="px-4 py-1.5 text-xs font-medium bg-echo-600 hover:bg-echo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center gap-2 shrink-0"
              >
                {isAnalyzing ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  '🔍 Analyze'
                )}
              </button>
            )}
          </div>
        </header>

        {/* Analysis Bar - below header */}
        {activeInvestigation && (
          <AnalysisBar
            isAnalyzing={isAnalyzing}
            evidence={evidence}
            contradictions={contradictions}
            investigationId={activeInvestigation.id}
          />
        )}

        {/* Error Toast */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-6 py-2 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-sm flex items-center justify-between"
            >
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-2 hover:text-rose-300 shrink-0">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area - FULL WIDTH, no right panel */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {!activeInvestigation ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-lg">
                  <div className="text-6xl mb-6">🔍</div>
                  <h2 className="text-2xl font-bold text-foreground mb-3">Welcome to EchoTrace AI</h2>
                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    Turn scattered evidence into an explainable investigation timeline.
                    Upload photos, screenshots, voice notes, PDFs, and text messages —
                    let AI analyze the relationships, detect contradictions, and build your case.
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-left">
                    {[
                      { emoji: '📤', title: 'Upload Evidence', desc: 'Drag & drop mixed media files' },
                      { emoji: '🧠', title: 'AI Analysis', desc: 'Gemini extracts entities & events' },
                      { emoji: '📊', title: 'Visual Timeline', desc: 'Interactive investigation graph' },
                    ].map(item => (
                      <div key={item.title} className="bg-surface-100/50 rounded-xl p-4 border border-surface-300/20">
                        <div className="text-2xl mb-2">{item.emoji}</div>
                        <div className="text-sm font-medium text-foreground mb-1">{item.title}</div>
                        <div className="text-xs text-muted-foreground">{item.desc}</div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-8 text-sm text-muted-foreground">
                    Create a new investigation to get started
                  </p>
                </div>
              </div>
            ) : activeView === 'summary' ? (
              /* ── FULL-WIDTH OVERVIEW ── */
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <div className="max-w-4xl mx-auto py-6 px-8 space-y-6">
                  {/* Stats + Confidence + Quality row */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <ClaimConfidenceMeter
                        evidence={evidence}
                        contradictions={contradictions}
                        isAnalyzing={isAnalyzing}
                      />
                    </div>
                    <div className="col-span-1">
                      <EvidenceQualityScanner evidence={evidence} />
                    </div>
                    <div className="col-span-1">
                      <CaseNotes investigationId={activeInvestigation.id} />
                    </div>
                  </div>

                  {/* Investigation Summary (the core dashboard) */}
                  <div className="rounded-xl border border-surface-300/30 bg-surface/50">
                    <InvestigationSummary investigation={activeInvestigation} />
                  </div>

                  {/* Contradictions section */}
                  <div className="rounded-xl border border-surface-300/30 bg-surface/50">
                    <div className="p-4">
                      <ContradictionPanel contradictions={contradictions} />
                    </div>
                  </div>
                </div>
              </div>
            ) : activeView === 'timeline' ? (
              /* ── FULL-WIDTH TIMELINE ── */
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto p-6">
                  <Timeline
                    events={activeInvestigation.timeline || []}
                    evidence={evidence}
                    loading={isAnalyzing}
                  />
                </div>
              </div>
            ) : activeView === 'entities' ? (
              /* ── FULL-WIDTH ENTITIES ── */
              <div className="flex-1 overflow-hidden">
                <EntityRelations
                  entities={activeInvestigation.entities || []}
                  evidence={evidence}
                  relationships={activeInvestigation.relationships || []}
                />
              </div>
            ) : activeView === 'compare' ? (
              /* ── FULL-WIDTH COMPARE ── */
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto">
                  <EvidenceComparison evidence={evidence} />
                </div>
              </div>
            ) : (
              /* ── FULL-WIDTH EVIDENCE ── */
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                <div className="max-w-5xl mx-auto space-y-6">
                  <UploadZone onUpload={handleUploadFiles} />
                  
                  {/* Evidence grid */}
                  {evidence.length > 0 && (
                    <>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-foreground">
                          Evidence Files ({evidence.length})
                        </h3>
                        <span className="text-[10px] text-muted-foreground">
                          <EvidenceQualityScanner evidence={evidence} compact />
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {evidence.map(ev => (
                          <EvidenceCard key={ev.id} evidence={ev} />
                        ))}
                      </div>
                    </>
                  )}
                  {evidence.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="text-4xl mb-3">📎</div>
                      <p className="text-sm">No evidence uploaded yet. Drop files above to begin.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Chat Button + Overlay */}
      {activeInvestigation && (
        <FloatingChat
          messages={chatMessages}
          onSend={handleSendMessage}
        />
      )}
    </div>
  );
}
