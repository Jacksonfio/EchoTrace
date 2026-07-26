import { v4 as uuidv4 } from 'uuid';
import type {
  Investigation,
  InvestigationDetail,
  Evidence,
  ExtractedData,
} from '../../../shared/types';

// In-memory store — replace with Firebase/Firestore for production
class Store {
  private investigations: Map<string, Investigation> = new Map();
  private evidenceMap: Map<string, Evidence> = new Map();
  private extractedDataMap: Map<string, ExtractedData> = new Map();
  private evidenceByInvestigation: Map<string, string[]> = new Map();

  createInvestigation(title: string, description?: string): Investigation {
    const now = new Date().toISOString();
    const investigation: Investigation = {
      id: uuidv4(),
      title,
      description,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      evidenceCount: 0,
    };
    this.investigations.set(investigation.id, investigation);
    this.evidenceByInvestigation.set(investigation.id, []);
    return investigation;
  }

  getInvestigation(id: string): Investigation | undefined {
    return this.investigations.get(id);
  }

  getInvestigationDetail(id: string): InvestigationDetail | undefined {
    const investigation = this.investigations.get(id);
    if (!investigation) return undefined;

    const evidenceIds = this.evidenceByInvestigation.get(id) || [];
    const evidence = evidenceIds.map(eid => this.evidenceMap.get(eid)).filter(Boolean) as Evidence[];
    const extracted = this.extractedDataMap.get(id);

    return {
      ...investigation,
      evidence,
      timeline: extracted?.events?.sort((a, b) => a.time.localeCompare(b.time)) || [],
      entities: extracted?.entities || [],
      contradictions: extracted?.contradictions || [],
      relationships: extracted?.relationships || [],
    };
  }

  listInvestigations(): Investigation[] {
    return Array.from(this.investigations.values())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  addEvidence(investigationId: string, evidence: Evidence): void {
    this.evidenceMap.set(evidence.id, evidence);
    const ids = this.evidenceByInvestigation.get(investigationId) || [];
    ids.push(evidence.id);
    this.evidenceByInvestigation.set(investigationId, ids);

    const inv = this.investigations.get(investigationId);
    if (inv) {
      inv.evidenceCount = ids.length;
      inv.updatedAt = new Date().toISOString();
    }
  }

  getEvidence(id: string): Evidence | undefined {
    return this.evidenceMap.get(id);
  }

  getInvestigationEvidence(investigationId: string): Evidence[] {
    const ids = this.evidenceByInvestigation.get(investigationId) || [];
    return ids.map(id => this.evidenceMap.get(id)).filter(Boolean) as Evidence[];
  }

  setExtractedData(investigationId: string, data: ExtractedData): void {
    this.extractedDataMap.set(investigationId, data);
    const inv = this.investigations.get(investigationId);
    if (inv) {
      inv.status = 'complete';
      inv.updatedAt = new Date().toISOString();
    }
  }

  getExtractedData(investigationId: string): ExtractedData | undefined {
    return this.extractedDataMap.get(investigationId);
  }

  updateInvestigationStatus(id: string, status: Investigation['status']): void {
    const inv = this.investigations.get(id);
    if (inv) {
      inv.status = status;
      inv.updatedAt = new Date().toISOString();
    }
  }

  deleteInvestigation(id: string): boolean {
    const existed = this.investigations.has(id);
    // Get evidence IDs BEFORE deletion
    const evidenceIds = this.evidenceByInvestigation.get(id) || [];
    // Clean up associated data
    this.investigations.delete(id);
    this.evidenceByInvestigation.delete(id);
    this.extractedDataMap.delete(id);
    evidenceIds.forEach(eid => this.evidenceMap.delete(eid));
    return existed;
  }

  clearAll(): void {
    this.investigations.clear();
    this.evidenceMap.clear();
    this.extractedDataMap.clear();
    this.evidenceByInvestigation.clear();
  }
}

export const store = new Store();
