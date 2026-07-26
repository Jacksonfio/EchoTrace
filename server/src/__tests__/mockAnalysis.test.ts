import { describe, it, expect } from 'vitest';
import { mockAnalyze } from '../services/mockAnalysis';
import type { Evidence } from '../../../shared/types';

function makeEvidence(overrides: Partial<Evidence> = {}): Evidence {
  return {
    id: overrides.id || 'ev-default',
    name: overrides.name || 'evidence.txt',
    type: overrides.type || 'text' as any,
    mimeType: overrides.mimeType || 'text/plain',
    filePath: overrides.filePath || '',
    description: overrides.description || '',
    uploadedAt: overrides.uploadedAt || new Date().toISOString(),
    investigationId: overrides.investigationId || 'inv-default',
    sizeBytes: overrides.sizeBytes || 0,
  };
}

describe('mockAnalyze', () => {
  it('should return empty structure for empty evidence', () => {
    const result = mockAnalyze([]);
    expect(result.entities).toBeDefined();
    expect(result.events).toBeDefined();
    expect(result.contradictions).toBeDefined();
    expect(result.relationships).toBeDefined();
    expect(result.summary).toContain('0 evidence');
  });

  it('should extract person entities from evidence with descriptive text', () => {
    const evidence = [
      makeEvidence({
        id: 'ev-1',
        name: 'Witness statement',
        description: 'Mr. Johnson said he saw a red SUV at the intersection.',
      }),
    ];
    const result = mockAnalyze(evidence);
    expect(result.entities.length).toBeGreaterThanOrEqual(1);
    const person = result.entities.find(e => e.name.includes('Johnson'));
    expect(person).toBeDefined();
    expect(person!.type).toBe('Person');
  });

  it('should extract vehicle entities from color + vehicle patterns', () => {
    const evidence = [
      makeEvidence({
        id: 'ev-2',
        name: 'Report',
        description: 'A blue SUV was speeding down the road.',
      }),
    ];
    const result = mockAnalyze(evidence);
    const vehicle = result.entities.find(e => e.type === 'Vehicle');
    expect(vehicle).toBeDefined();
    expect(vehicle!.name.toLowerCase()).toContain('blue');
  });

  it('should detect color contradictions between evidence', () => {
    const evidence = [
      makeEvidence({
        id: 'ev-3a',
        name: 'Witness 1',
        description: 'I saw a red SUV at the scene.',
      }),
      makeEvidence({
        id: 'ev-3b',
        name: 'Witness 2',
        description: 'The vehicle was a blue SUV.',
      }),
    ];
    const result = mockAnalyze(evidence);
    const contradiction = result.contradictions.find(c => c.category === 'visual');
    expect(contradiction).toBeDefined();
    expect(contradiction!.severity).toBe('high');
  });

  it('should detect temporal contradictions with multiple times', () => {
    const evidence = [
      makeEvidence({
        id: 'ev-4a',
        name: 'Log 1',
        description: 'Incident occurred at 8:00 AM.',
      }),
      makeEvidence({
        id: 'ev-4b',
        name: 'Log 2',
        description: 'Time of report: 9:30 AM.',
      }),
      makeEvidence({
        id: 'ev-4c',
        name: 'Log 3',
        description: 'Dispatch received at 10:15 PM.',
      }),
    ];
    const result = mockAnalyze(evidence);
    const temporal = result.contradictions.find(c => c.category === 'temporal');
    expect(temporal).toBeDefined();
  });

  it('should build relationships between persons and vehicles', () => {
    const evidence = [
      makeEvidence({
        id: 'ev-5',
        description: 'Mrs. Smith was driving a red sedan.',
      }),
    ];
    const result = mockAnalyze(evidence);
    const personVehicleRel = result.relationships.find(r => r.relation === 'associated_with');
    expect(personVehicleRel).toBeDefined();
    expect(personVehicleRel!.confidence).toBeGreaterThan(0);
  });

  it('should create timeline events from evidence', () => {
    const evidence = [
      makeEvidence({ id: 'ev-6a', name: 'First photo', description: 'Taken at 08:42 AM' }),
      makeEvidence({ id: 'ev-6b', name: 'Second photo', description: 'Taken at 08:44 AM' }),
    ];
    const result = mockAnalyze(evidence);
    expect(result.events.length).toBeGreaterThanOrEqual(2);
    // Events should be sorted by time
    for (let i = 1; i < result.events.length; i++) {
      expect(result.events[i].time.localeCompare(result.events[i - 1].time)).toBeGreaterThanOrEqual(0);
    }
  });

  it('should build a coherent summary', () => {
    const evidence = [
      makeEvidence({
        id: 'ev-7',
        name: 'Final Report',
        description: 'Mr. Brown reported a silver truck hit the mailbox.',
      }),
    ];
    const result = mockAnalyze(evidence);
    expect(result.summary).toContain('1 evidence');
    expect(result.summary).toContain('timeline');
  });

  it('should handle evidence without descriptive text', () => {
    const evidence = [
      makeEvidence({ id: 'ev-8', name: 'image.png', description: '' }),
    ];
    const result = mockAnalyze(evidence);
    expect(result.entities.length).toBeGreaterThanOrEqual(1);
    expect(result.events.length).toBeGreaterThanOrEqual(1);
  });
});
