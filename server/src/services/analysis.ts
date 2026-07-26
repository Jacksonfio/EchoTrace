/**
 * Analysis Pipeline Orchestrator
 *
 * This module orchestrates the multimodal evidence analysis workflow:
 * 1. Attempts Gemini API analysis for cross-modal reasoning
 * 2. Falls back to local mock analysis when Gemini is rate-limited
 * 3. Post-processes results (contradiction detection, timeline building)
 *
 * @see gemini.ts - Gemini API integration with timeout handling
 * @see mockAnalysis.ts - Fallback analysis with pattern extraction
 * @see store.ts - Data persistence layer
 */

export { analyzeEvidence, chatWithContext } from './gemini';
export { mockAnalyze } from './mockAnalysis';
