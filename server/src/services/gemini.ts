import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import type { ExtractedData, Evidence } from '../../../shared/types';
import { buildAnalysisPrompt, CHAT_SYSTEM_PROMPT } from '../../../shared/types/prompts';
import fs from 'fs';

let model: GenerativeModel | null = null;

function getModel(): GenerativeModel {
  if (!model) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
  }
  return model;
}

function fileToGenerativePart(filePath: string, mimeType: string) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString('base64'),
      mimeType,
    },
  };
}

export async function analyzeEvidence(
  evidence: Evidence[],
): Promise<{ data: ExtractedData; processingTimeMs: number }> {
  const startTime = Date.now();
  const genModel = getModel();

  // Build evidence descriptions for the prompt (include file content for text evidence)
  const evidenceDescriptions = evidence.map(e => {
    let fileContent = '';
    if (e.filePath && fs.existsSync(e.filePath) && e.mimeType === 'text/plain') {
      try {
        fileContent = fs.readFileSync(e.filePath, 'utf8').trim();
      } catch {}
    }
    return {
      id: e.id,
      type: e.type,
      name: e.name,
      description: e.description,
      fileContent: fileContent.substring(0, 5000), // limit size
    };
  });

  const prompt = buildAnalysisPrompt(evidenceDescriptions);

  // Build multimodal content parts
  const contentParts: (string | ReturnType<typeof fileToGenerativePart>)[] = [prompt];

  // Add file data for multimodal evidence (images, audio, PDF)
  for (const ev of evidence) {
    if (ev.filePath && fs.existsSync(ev.filePath)) {
      try {
        const mimeType = ev.mimeType || 'application/octet-stream';
        if (mimeType.startsWith('image/') || mimeType.startsWith('audio/') || mimeType.includes('pdf')) {
          contentParts.push(fileToGenerativePart(ev.filePath, mimeType));
        }
      } catch (err) {
        console.warn(`Could not read file for evidence ${ev.id}:`, err);
      }
    }
  }

  // Add timeout to prevent hanging when API is rate-limited
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Gemini API request timed out after 12 seconds')), 12000)
  );

  const result = await Promise.race([
    genModel.generateContent(contentParts),
    timeoutPromise,
  ]) as Awaited<ReturnType<typeof genModel.generateContent>>;
  const response = await result.response;
  const text = response.text();

  // Parse the JSON from the response
  const jsonStr = extractJSON(text);
  let extracted: ExtractedData;

  try {
    extracted = JSON.parse(jsonStr);
    // Assign IDs to entities, events, contradictions, relationships
    extracted.entities = (extracted.entities || []).map((e: any, i: number) => ({
      ...e,
      id: `entity-${i}`,
    }));
    extracted.events = (extracted.events || []).map((e: any, i: number) => ({
      ...e,
      id: `event-${i}`,
    }));
    extracted.contradictions = (extracted.contradictions || []).map((c: any, i: number) => ({
      ...c,
      id: `contradiction-${i}`,
    }));
    extracted.relationships = (extracted.relationships || []).map((r: any, i: number) => ({
      ...r,
      id: `relationship-${i}`,
    }));
  } catch {
    // Fallback: create minimal structure
    extracted = {
      entities: [],
      events: [],
      contradictions: [],
      relationships: [],
      summary: 'Could not parse structured data from analysis.',
      rawAnalysis: text,
    };
  }

  return {
    data: extracted,
    processingTimeMs: Date.now() - startTime,
  };
}

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

  const result = await genModel.generateContent(fullPrompt);
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
      // Clean up trailing comma if needed
      mainMessage = mainMessage.replace(/,\s*$/, '');
    }
  } catch {
    // Ignore parsing issues
  }

  return { message: mainMessage, suggestedQuestions };
}

function extractJSON(text: string): string {
  // Try to find JSON object in the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];

  // Try code blocks
  const codeMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeMatch) return codeMatch[1];

  return text;
}
