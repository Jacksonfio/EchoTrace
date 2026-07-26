// ===== Core Domain Types =====

export type EvidenceType = 'image' | 'audio' | 'pdf' | 'screenshot' | 'video_frame' | 'text' | 'map';
export type InvestigationStatus = 'draft' | 'active' | 'analyzing' | 'complete' | 'archived';

export interface Evidence {
  id: string;
  investigationId: string;
  type: EvidenceType;
  name: string;
  description?: string;
  fileUrl?: string;
  filePath?: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string; // ISO timestamp
  extracted?: ExtractedData;
  tags?: string[];
}

export interface EvidenceUpload {
  file: File;
  type: EvidenceType;
  description?: string;
}

// ===== Extraction Types =====

export interface Entity {
  id: string;
  type: 'Person' | 'Vehicle' | 'Object' | 'Location' | 'Organization' | 'Other';
  name: string;
  description?: string;
  mentions: string[]; // evidence IDs where this entity appears
  confidence: number; // 0-1
  metadata?: Record<string, string>;
}

export interface TimelineEvent {
  id: string;
  time: string; // HH:MM or ISO timestamp
  date?: string; // YYYY-MM-DD
  description: string;
  evidenceIds: string[];
  entityIds: string[];
  confidence: number; // 0-1
  eventType?: 'observation' | 'statement' | 'inference' | 'contradiction';
}

export interface Contradiction {
  id: string;
  description: string;
  evidenceIds: string[]; // the two+ pieces of evidence that contradict
  entities: string[];
  category: 'temporal' | 'visual' | 'statement' | 'location' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  resolution?: string;
}

export interface Relationship {
  id: string;
  sourceId: string; // entity or evidence ID
  targetId: string; // entity or evidence ID
  relation: string; // e.g., "appears_in", "mentions", "contradicts", "confirms"
  confidence: number;
  description?: string;
}

export interface ExtractedData {
  entities: Entity[];
  events: TimelineEvent[];
  contradictions: Contradiction[];
  relationships: Relationship[];
  summary: string;
  rawAnalysis?: string;
}

// ===== Investigation Types =====

export interface Investigation {
  id: string;
  title: string;
  description?: string;
  status: InvestigationStatus;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  evidenceCount: number;
  tags?: string[];
}

export interface InvestigationDetail extends Investigation {
  evidence: Evidence[];
  timeline: TimelineEvent[];
  entities: Entity[];
  contradictions: Contradiction[];
  relationships: Relationship[];
}

// ===== API Types =====

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AnalysisRequest {
  investigationId: string;
  evidenceIds: string[];
}

export interface AnalysisResponse {
  investigationId: string;
  extractedData: ExtractedData;
  processingTimeMs: number;
}

export interface ChatRequest {
  investigationId: string;
  message: string;
  context?: {
    timeline?: TimelineEvent[];
    entities?: Entity[];
    contradictions?: Contradiction[];
  };
}

export interface ChatResponse {
  message: string;
  relatedEntities?: Entity[];
  relatedEvents?: TimelineEvent[];
  suggestedQuestions?: string[];
}

// ===== Graph Types =====

export interface GraphNode {
  id: string;
  type: 'entity' | 'evidence' | 'event' | 'contradiction';
  label: string;
  metadata?: {
    entityType?: string;
    evidenceType?: string;
    confidence?: number;
    severity?: string;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  confidence?: number;
}
