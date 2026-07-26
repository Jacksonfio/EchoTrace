import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { store } from '../services/store';
import path from 'path';
import fs from 'fs';

// Use a separate test database
const TEST_DB_PATH = path.resolve(__dirname, '../../../data/test-echotrace.db');

describe('Store', () => {
  beforeAll(async () => {
    // Override DB path before init using env var
    process.env.__ECHOTRACE_DB_PATH__ = TEST_DB_PATH;
    await store.init();
  });

  afterAll(() => {
    store.close();
    // Clean up test database
    try {
      if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
      if (fs.existsSync(TEST_DB_PATH + '-wal')) fs.unlinkSync(TEST_DB_PATH + '-wal');
      if (fs.existsSync(TEST_DB_PATH + '-shm')) fs.unlinkSync(TEST_DB_PATH + '-shm');
    } catch {}
  });

  beforeEach(() => {
    // Clear all data between tests (but not users table)
    store.clearAll();
  });

  describe('Investigations', () => {
    it('should create an investigation', () => {
      const inv = store.createInvestigation('Test Case', 'A test investigation');
      expect(inv).toBeDefined();
      expect(inv.title).toBe('Test Case');
      expect(inv.description).toBe('A test investigation');
      expect(inv.status).toBe('draft');
      expect(inv.id).toBeTruthy();
      expect(inv.createdAt).toBeTruthy();
    });

    it('should create an investigation without description', () => {
      const inv = store.createInvestigation('Minimum Case');
      expect(inv.title).toBe('Minimum Case');
      expect(inv.description).toBeUndefined();
      expect(inv.status).toBe('draft');
    });

    it('should list investigations', () => {
      store.createInvestigation('Case 1');
      store.createInvestigation('Case 2');
      const list = store.listInvestigations();
      expect(list.length).toBeGreaterThanOrEqual(2);
    });

    it('should list investigations filtered by userId', () => {
      store.createInvestigation('User Case', undefined, 'user-1');
      store.createInvestigation('Other Case', undefined, 'user-2');
      const userList = store.listInvestigations('user-1');
      expect(userList.length).toBeGreaterThanOrEqual(1);
      expect(userList.every(i => i.userId === 'user-1')).toBe(true);
    });

    it('should get an investigation by id', () => {
      const created = store.createInvestigation('Get Test');
      const found = store.getInvestigation(created.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(created.id);
      expect(found!.title).toBe('Get Test');
    });

    it('should return undefined for non-existent investigation', () => {
      const found = store.getInvestigation('non-existent-id');
      expect(found).toBeUndefined();
    });

    it('should get investigation detail with empty evidence', () => {
      const created = store.createInvestigation('Detail Test');
      const detail = store.getInvestigationDetail(created.id);
      expect(detail).toBeDefined();
      expect(detail!.evidence).toEqual([]);
      expect(detail!.timeline).toEqual([]);
      expect(detail!.entities).toEqual([]);
      expect(detail!.contradictions).toEqual([]);
    });

    it('should update investigation status', () => {
      const inv = store.createInvestigation('Status Test');
      store.updateInvestigationStatus(inv.id, 'analyzing');
      const updated = store.getInvestigation(inv.id);
      expect(updated!.status).toBe('analyzing');
    });

    it('should delete an investigation', () => {
      const inv = store.createInvestigation('Delete Test');
      expect(store.getInvestigation(inv.id)).toBeDefined();
      const deleted = store.deleteInvestigation(inv.id);
      expect(deleted).toBe(true);
      expect(store.getInvestigation(inv.id)).toBeUndefined();
    });

    it('should return true even when deleting non-existent investigation (idempotent)', () => {
      const result = store.deleteInvestigation('non-existent');
      expect(result).toBe(true);
    });

    it('should clear all investigations', () => {
      store.createInvestigation('Case A');
      store.createInvestigation('Case B');
      store.clearAll();
      expect(store.listInvestigations().length).toBe(0);
    });
  });

  describe('Evidence', () => {
    it('should add evidence to an investigation', () => {
      const inv = store.createInvestigation('Evidence Test');
      const evidence = {
        id: 'ev-1',
        name: 'photo.jpg',
        type: 'image' as any,
        mimeType: 'image/jpeg',
        filePath: '/uploads/photo.jpg',
        description: 'A test photo',
        uploadedAt: new Date().toISOString(),
        investigationId: inv.id,
        sizeBytes: 1024,
      };
      store.addEvidence(inv.id, evidence);
      const detail = store.getInvestigationDetail(inv.id);
      expect(detail!.evidence.length).toBe(1);
      expect(detail!.evidence[0].name).toBe('photo.jpg');
      expect(detail!.evidenceCount).toBe(1);
    });

    it('should get evidence by id', () => {
      const inv = store.createInvestigation('Get Evidence');
      const evidence = {
        id: 'ev-2',
        name: 'document.pdf',
        type: 'pdf' as any,
        mimeType: 'application/pdf',
        filePath: '/uploads/doc.pdf',
        uploadedAt: new Date().toISOString(),
        investigationId: inv.id,
        sizeBytes: 2048,
      };
      store.addEvidence(inv.id, evidence);
      const found = store.getEvidence('ev-2');
      expect(found).toBeDefined();
      expect(found!.name).toBe('document.pdf');
      expect(found!.sizeBytes).toBe(2048);
      expect(found!.investigationId).toBe(inv.id);
    });

    it('should return undefined for non-existent evidence', () => {
      const found = store.getEvidence('non-existent');
      expect(found).toBeUndefined();
    });

    it('should get all evidence for an investigation', () => {
      const inv = store.createInvestigation('List Evidence');
      store.addEvidence(inv.id, {
        id: 'ev-list-1', name: 'a.txt', type: 'text' as any,
        mimeType: 'text/plain', filePath: '', uploadedAt: new Date().toISOString(),
        investigationId: inv.id, sizeBytes: 100,
      });
      store.addEvidence(inv.id, {
        id: 'ev-list-2', name: 'b.txt', type: 'text' as any,
        mimeType: 'text/plain', filePath: '', uploadedAt: new Date().toISOString(),
        investigationId: inv.id, sizeBytes: 200,
      });
      const evidenceList = store.getInvestigationEvidence(inv.id);
      expect(evidenceList.length).toBe(2);
    });
  });

  describe('Extracted Data', () => {
    it('should set and get extracted data', () => {
      const inv = store.createInvestigation('Extraction Test');
      const data = {
        entities: [{ id: 'e1', type: 'Person' as any, name: 'John', mentions: [], confidence: 0.9, metadata: {} }],
        events: [{ id: 'evt1', time: '08:00', description: 'Event', evidenceIds: [], entityIds: [], confidence: 0.8, eventType: 'observation' as any }],
        contradictions: [],
        relationships: [],
        summary: 'Test summary',
      };
      store.setExtractedData(inv.id, data);
      const extracted = store.getExtractedData(inv.id);
      expect(extracted).toBeDefined();
      expect(extracted!.entities.length).toBe(1);
      expect(extracted!.entities[0].name).toBe('John');
      expect(extracted!.events.length).toBe(1);
      expect(extracted!.summary).toBe('Test summary');
    });

    it('should update investigation status on extraction', () => {
      const inv = store.createInvestigation('Status Update');
      store.setExtractedData(inv.id, {
        entities: [], events: [], contradictions: [], relationships: [], summary: 'Done',
      });
      const updated = store.getInvestigation(inv.id);
      expect(updated!.status).toBe('complete');
    });
  });

  describe('Users', () => {
    // Use unique emails for each test to avoid UNIQUE constraint conflicts
    const email1 = 'create-test-' + Date.now() + '@example.com';
    const email2 = 'find-test-' + Date.now() + '@example.com';
    const email3 = 'byid-test-' + Date.now() + '@example.com';

    it('should create a user', () => {
      const user = store.createUser(email1, 'Test User', 'hash123');
      expect(user.email).toBe(email1);
      expect(user.name).toBe('Test User');
      expect(user.id).toBeTruthy();
    });

    it('should get user by email', () => {
      store.createUser(email2, 'Find Me', 'hash456');
      const user = store.getUserByEmail(email2);
      expect(user).toBeDefined();
      expect(user!.email).toBe(email2);
      expect(user!.passwordHash).toBe('hash456');
    });

    it('should return undefined for unknown email', () => {
      const user = store.getUserByEmail('unknown-' + Date.now() + '@example.com');
      expect(user).toBeUndefined();
    });

    it('should get user by id', () => {
      const created = store.createUser(email3, 'By ID', 'hash789');
      const found = store.getUserById(created.id);
      expect(found).toBeDefined();
      expect(found!.email).toBe(email3);
      expect(found!.name).toBe('By ID');
    });
  });
});
