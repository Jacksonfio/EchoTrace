import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import type { ExtractedData, Evidence } from '../../../shared/types';
import { buildAnalysisPrompt, CHAT_SYSTEM_PROMPT } from '../../../shared/types/prompts';
import fs from 'fs';
import { logger } from './logger';

// ── Configuration ──

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 15000;
const REQUEST_TIMEOUT_MS = 30000;
const MAX_TEXT_CHARS = 10000;

// ── Model ──

let model: GenerativeModel | null = null;

function getModel(): GenerativeModel {
  if (!model) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }
  return model;
}

// ── Rate Limit Helpers ──

class RateLimitError extends Error {
  public retryAfterMs: number;
  constructor(message: string, retryAfterMs: number = BASE_DELAY_MS) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay with full jitter.
 * Formula: random_between(0, min(max_delay, base_delay * 2^attempt))
 */
function backoffDelay(attempt: number): number {
  const cap = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * Math.pow(2, attempt));
  return Math.random() * cap;
}

/**
 * Classify an error from the Gemini SDK into a retryable or non-retryable category.
 */
function classifyGeminiError(err: any): { retryable: boolean; retryAfterMs: number; label: string } {
  const msg = (err?.message || '').toLowerCase();
  const status = err?.status || err?.response?.status;

  // Rate limit — retryable
  if (status === 429 || msg.includes('rate limit') || msg.includes('quota exceeded') || msg.includes('429')) {
    // Try to extract retry delay from error
    const retryMatch = msg.match(/retry after\s*:?\s*(\d+)/i);
    const retryAfter = retryMatch ? parseInt(retryMatch[1]) * 1000 : BASE_DELAY_MS * 2;
    return { retryable: true, retryAfterMs: Math.min(retryAfter, MAX_DELAY_MS), label: 'rate_limit' };
  }

  // Resource exhausted — retryable
  if (msg.includes('resource exhausted') || status === 503) {
    return { retryable: true, retryAfterMs: BASE_DELAY_MS * 4, label: 'resource_exhausted' };
  }

  // Timeout — retryable
  if (msg.includes('timeout') || msg.includes('timed out') || err.name === 'AbortError') {
    return { retryable: true, retryAfterMs: BASE_DELAY_MS, label: 'timeout' };
  }

  // Internal server error — retryable
  if (status && status >= 500 && status < 600) {
    return { retryable: true, retryAfterMs: BASE_DELAY_MS * 2, label: 'server_error' };
  }

  // Auth / key errors — NOT retryable
  if (msg.includes('api key') || status === 400 || status === 401 || status === 403) {
    return { retryable: false, retryAfterMs: 0, label: 'auth_error' };
  }

  // Everything else — not retryable
  return { retryable: false, retryAfterMs: 0, label: 'unknown' };
}

// ── File Helpers ──

function fileToGenerativePart(filePath: string, mimeType: string) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString('base64'),
      mimeType,
    },
  };
}

// ── JSON Extraction ──

function extractJSON(text: string): string {
  // Try to find JSON object in the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];

  // Try code blocks
  const codeMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeMatch) return codeMatch[1];

  return text;
}

function parseGeminiResponse(text: string): ExtractedData {
  const jsonStr = extractJSON(text);
  const parsed = JSON.parse(jsonStr);

  // Assign stable IDs
  return {
    entities: (parsed.entities || []).map((e: any, i: number) => ({
      ...e,
      id: `entity-${i}`,
      mentions: e.mentions || [],
      metadata: e.metadata || {},
    })),
    events: (parsed.events || []).map((e: any, i: number) => ({
      ...e,
      id: `event-${i}`,
      evidenceIds: e.evidenceIds || [],
      entityIds: e.entityIds || [],
    })),
    contradictions: (parsed.contradictions || []).map((c: any, i: number) => ({
      ...c,
      id: `contradiction-${i}`,
      evidenceIds: c.evidenceIds || [],
      entities: c.entities || [],
    })),
    relationships: (parsed.relationships || []).map((r: any, i: number) => ({
      ...r,
      id: `relationship-${i}`,
    })),
    summary: parsed.summary || 'Gemini analysis completed.',
  };
}

// ── Public API ──

export interface AnalysisResult {
  data: ExtractedData;
  processingTimeMs: number;
  retryCount: number;
  rateLimited: boolean;
}

export async function analyzeEvidence(
  evidence: Evidence[],
): Promise<AnalysisResult> {
  const startTime = Date.now();
  const genModel = getModel();
  let lastError: Error | null = null;
  let retryCount = 0;
  let wasRateLimited = false;

  // Build evidence descriptions for the prompt
  const evidenceDescriptions = evidence.map(e => {
    let fileContent = '';
    if (e.filePath && fs.existsSync(e.filePath) && e.mimeType === 'text/plain') {
      try {
        const content = fs.readFileSync(e.filePath, 'utf8').trim();
        fileContent = content.length > MAX_TEXT_CHARS
          ? content.substring(0, MAX_TEXT_CHARS) + '\n[...truncated]'
          : content;
      } catch { /* file may not exist */ }
    }
    return {
      id: e.id,
      type: e.type,
      name: e.name,
      description: e.description,
      fileContent,
    };
  });

  const prompt = buildAnalysisPrompt(evidenceDescriptions);

  // Attempt Gemini call with retries
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const delay = backoffDelay(attempt);
        logger.info(`Gemini retry ${attempt}/${MAX_RETRIES} after ${Math.round(delay)}ms delay`);
        await sleep(delay);
      }

      // Build multimodal content parts
      const contentParts: (string | ReturnType<typeof fileToGenerativePart>)[] = [prompt];

      // Add file data for multimodal evidence
      for (const ev of evidence) {
        if (ev.filePath && fs.existsSync(ev.filePath)) {
          try {
            const mimeType = ev.mimeType || 'application/octet-stream';
            if (
              mimeType.startsWith('image/') ||
              mimeType.startsWith('audio/') ||
              mimeType.includes('pdf')
            ) {
              contentParts.push(fileToGenerativePart(ev.filePath, mimeType));
            }
          } catch (err) {
            logger.warn(`Could not read file for evidence ${ev.id}`);
          }
        }
      }

      // Generate with timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API request timed out')), REQUEST_TIMEOUT_MS),
      );

      const result = await Promise.race([
        genModel.generateContent(contentParts),
        timeoutPromise,
      ]) as Awaited<ReturnType<typeof genModel.generateContent>>;

      const response = await result.response;
      const text = response.text();

      // Parse the response
      let extracted: ExtractedData;
      try {
        extracted = parseGeminiResponse(text);
      } catch (parseErr: any) {
        logger.warn(`Gemini response parse failed: ${parseErr.message?.substring(0, 100)}`);
        extracted = {
          entities: [],
          events: [],
          contradictions: [],
          relationships: [],
          summary: 'Gemini response could not be parsed into structured data.',
          rawAnalysis: text.substring(0, 5000),
        };
      }

      return {
        data: extracted,
        processingTimeMs: Date.now() - startTime,
        retryCount,
        rateLimited: wasRateLimited,
      };

    } catch (err: any) {
      lastError = err;
      const classification = classifyGeminiError(err);

      if (classification.retryable && attempt < MAX_RETRIES) {
        if (classification.label === 'rate_limit') {
          wasRateLimited = true;
          retryCount++;
          logger.warn(
            `Gemini rate limited (attempt ${attempt + 1}/${MAX_RETRIES + 1}), ` +
            `retrying in ${Math.round(classification.retryAfterMs)}ms`
          );
          await sleep(classification.retryAfterMs);
          continue;
        }
        if (classification.label === 'timeout' || classification.label === 'server_error') {
          retryCount++;
          continue; // Will re-enter the loop and use backoffDelay
        }
      }

      // Non-retryable or exhausted retries — throw for caller to handle
      const errorMsg = classification.label === 'rate_limit'
        ? `Gemini API rate limit exceeded after ${MAX_RETRIES + 1} attempts`
        : classification.label === 'auth_error'
          ? `Gemini API authentication failed: ${err.message}`
          : `Gemini analysis failed: ${err.message}`;

      // Attach metadata for the caller
      const enriched = new Error(errorMsg);
      (enriched as any).retryCount = retryCount;
      (enriched as any).wasRateLimited = wasRateLimited;
      (enriched as any).classification = classification.label;
      throw enriched;
    }
  }

  // Should not reach here, but just in case
  throw lastError || new Error('Gemini analysis failed after all retries');
}

// ── Chat ──

export async function chatWithContext(
  message: string,
  context: {
    timeline?: any[];
    entities?: any[];
    contradictions?: any[];
    evidence?: Evidence[];
  },
): Promise<{ message: string; suggestedQuestions: string[] }> {
  const genModel = getModel();

  const contextStr = JSON.stringify(context, null, 2);
  const fullPrompt = `${CHAT_SYSTEM_PROMPT}

## Investigation Context

${contextStr}

## User Question

${message}

## Response

Provide a concise, investigative answer. Then suggest 2-3 follow-up questions as a JSON array under a "suggestedQuestions" key at the end.`;

  // Try chat with retry for rate limits (with timeout)
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        await sleep(backoffDelay(attempt));
      }

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini chat request timed out')), REQUEST_TIMEOUT_MS),
      );

      const result = await Promise.race([
        genModel.generateContent(fullPrompt),
        timeoutPromise,
      ]) as Awaited<ReturnType<typeof genModel.generateContent>>;
      const response = await result.response;
      const text = response.text();

      // Extract suggested questions if present
      let mainMessage = text;
      let suggestedQuestions: string[] = [];

      try {
        const questionsMatch = text.match(/"suggestedQuestions"\s*:\s*(\[.*?\])\s*}$/s);
        if (questionsMatch) {
          suggestedQuestions = JSON.parse(questionsMatch[1]);
          mainMessage = text.replace(/"suggestedQuestions"\s*:\s*\[.*?\]\s*}$/s, '').trim();
          mainMessage = mainMessage.replace(/,\s*$/, '');
        }
      } catch { /* ignore parse issues */ }

      return { message: mainMessage, suggestedQuestions };

    } catch (err: any) {
      lastError = err;
      const classification = classifyGeminiError(err);
      if (classification.retryable && attempt < MAX_RETRIES) {
        const delay = classification.label === 'rate_limit'
          ? classification.retryAfterMs
          : backoffDelay(attempt);
        logger.warn(`Gemini chat retry ${attempt + 1}/${MAX_RETRIES + 1} (${classification.label})`);
        await sleep(delay);
        continue;
      }
      // Non-retryable or exhausted
      break;
    }
  }

  // If all retries failed, return a fallback message
  logger.error(`Gemini chat failed after retries: ${lastError?.message?.substring(0, 100)}`);
  return {
    message: `Unable to process chat request. ${lastError?.message || 'Unknown error'}`,
    suggestedQuestions: ['Try asking a different question', 'Upload more evidence for context'],
  };
}
