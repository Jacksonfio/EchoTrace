import { v4 as uuidv4 } from 'uuid';
import type {
  Investigation,
  InvestigationDetail,
  Evidence,
  ExtractedData,
  EvidenceType,
} from '../../../shared/types';
import initSqlJs, { type Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { logger } from './logger';

const DB_PATH = process.env.__ECHOTRACE_DB_PATH__ || path.resolve(__dirname, '../../../data/echotrace.db');

class Store {
  private db: Database | null = null;
  private ready = false;

  async init(): Promise<void> {
    try {
      const SQL = await initSqlJs();
      
      // Ensure data directory exists
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Load existing DB or create new one
      if (fs.existsSync(DB_PATH)) {
        const buffer = fs.readFileSync(DB_PATH);
        this.db = new SQL.Database(buffer);
        logger.info(`Loaded existing database from ${DB_PATH}`);
      } else {
        this.db = new SQL.Database();
        logger.info(`Created new database at ${DB_PATH}`);
      }

      this.initializeSchema();
      this.ready = true;
    } catch (err) {
      logger.error('Failed to initialize database:', err);
      throw err;
    }
  }

  private initializeSchema(): void {
    if (!this.db) return;

    this.db.run(`
      CREATE TABLE IF NOT EXISTS investigations (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'draft',
        user_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        evidence_count INTEGER DEFAULT 0
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS evidence (
        id TEXT PRIMARY KEY,
        investigation_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT,
        mime_type TEXT,
        file_path TEXT,
        description TEXT,
        size_bytes INTEGER DEFAULT 0,
        uploaded_at TEXT NOT NULL,
        FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS extracted_data (
        investigation_id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    this.db.run('PRAGMA journal_mode=WAL');
    this.save();
  }

  private save(): void {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, Buffer.from(data));
    } catch (err) {
      logger.error('Failed to save database:', err);
    }
  }

  // ===== Users =====

  createUser(email: string, name: string, passwordHash: string): { id: string; email: string; name: string } {
    if (!this.db) throw new Error('Database not initialized');
    const id = uuidv4();
    const now = new Date().toISOString();
    this.db.run(
      'INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, email, name, passwordHash, now],
    );
    this.save();
    return { id, email, name };
  }

  getUserByEmail(email: string): { id: string; email: string; name: string; passwordHash: string } | undefined {
    if (!this.db) return undefined;
    const result = this.db.exec('SELECT id, email, name, password_hash FROM users WHERE email = ?', [email]);
    if (!result.length || !result[0].values.length) return undefined;
    const row = result[0].values[0];
    return { id: row[0] as string, email: row[1] as string, name: row[2] as string, passwordHash: row[3] as string };
  }

  getUserById(id: string): { id: string; email: string; name: string } | undefined {
    if (!this.db) return undefined;
    const result = this.db.exec('SELECT id, email, name FROM users WHERE id = ?', [id]);
    if (!result.length || !result[0].values.length) return undefined;
    const row = result[0].values[0];
    return { id: row[0] as string, email: row[1] as string, name: row[2] as string };
  }

  // ===== Investigations =====

  createInvestigation(title: string, description?: string, userId?: string): Investigation {
    if (!this.db) throw new Error('Database not initialized');
    const id = uuidv4();
    const now = new Date().toISOString();
    this.db.run(
      'INSERT INTO investigations (id, title, description, status, user_id, created_at, updated_at, evidence_count) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
      [id, title, description || null, 'draft', userId || null, now, now],
    );
    this.save();
    return { id, title, description, status: 'draft', createdAt: now, updatedAt: now, evidenceCount: 0, userId };
  }

  getInvestigation(id: string): Investigation | undefined {
    if (!this.db) return undefined;
    const rows = this.db.exec(
      'SELECT id, title, description, status, created_at, updated_at, evidence_count FROM investigations WHERE id = ?',
      [id],
    );
    if (!rows.length || !rows[0].values.length) return undefined;
    const r = rows[0].values[0];
    return {
      id: r[0] as string,
      title: r[1] as string,
      description: r[2] as string | undefined,
      status: r[3] as Investigation['status'],
      createdAt: r[4] as string,
      updatedAt: r[5] as string,
      evidenceCount: r[6] as number,
    };
  }

  getInvestigationDetail(id: string): InvestigationDetail | undefined {
    const inv = this.getInvestigation(id);
    if (!inv) return undefined;

    const evidence = this.getInvestigationEvidence(id);
    const extracted = this.getExtractedData(id);

    return {
      ...inv,
      evidence,
      timeline: extracted?.events?.sort((a, b) => a.time.localeCompare(b.time)) || [],
      entities: extracted?.entities || [],
      contradictions: extracted?.contradictions || [],
      relationships: extracted?.relationships || [],
    };
  }

  listInvestigations(userId?: string): Investigation[] {
    if (!this.db) return [];
    const query = userId
      ? 'SELECT id, title, description, status, created_at, updated_at, evidence_count, user_id FROM investigations WHERE user_id = ? ORDER BY updated_at DESC'
      : 'SELECT id, title, description, status, created_at, updated_at, evidence_count, user_id FROM investigations ORDER BY updated_at DESC';
    const params = userId ? [userId] : [];
    const rows = this.db.exec(query, params);
    if (!rows.length) return [];
    return rows[0].values.map((r: any[]) => ({
      id: r[0] as string,
      title: r[1] as string,
      description: r[2] as string | undefined,
      status: r[3] as Investigation['status'],
      createdAt: r[4] as string,
      updatedAt: r[5] as string,
      evidenceCount: r[6] as number,
      userId: r[7] as string | undefined,
    }));
  }

  // ===== Evidence =====

  addEvidence(investigationId: string, evidence: Evidence): void {
    if (!this.db) throw new Error('Database not initialized');
    this.db.run(
      'INSERT INTO evidence (id, investigation_id, name, type, mime_type, file_path, description, size_bytes, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [evidence.id, investigationId, evidence.name, evidence.type, evidence.mimeType, evidence.filePath, evidence.description || null, evidence.sizeBytes || 0, evidence.uploadedAt || new Date().toISOString()],
    );
    // Update count
    this.db.run('UPDATE investigations SET evidence_count = evidence_count + 1, updated_at = ? WHERE id = ?',
      [new Date().toISOString(), investigationId]);
    this.save();
  }

  getEvidence(id: string): Evidence | undefined {
    if (!this.db) return undefined;
    const rows = this.db.exec(
      'SELECT e.id, e.name, e.type, e.mime_type, e.file_path, e.description, e.uploaded_at, e.investigation_id, e.size_bytes FROM evidence e WHERE e.id = ?',
      [id],
    );
    if (!rows.length || !rows[0].values.length) return undefined;
    const row: any[] = rows[0].values[0];
    return {
      id: row[0] as string,
      name: row[1] as string,
      type: row[2] as EvidenceType,
      mimeType: row[3] as string,
      filePath: row[4] as string,
      description: row[5] as string | undefined,
      uploadedAt: row[6] as string,
      investigationId: row[7] as string,
      sizeBytes: (row[8] as number) || 0,
    };
  }

  getInvestigationEvidence(investigationId: string): Evidence[] {
    if (!this.db) return [];
    const rows = this.db.exec(
      'SELECT id, name, type, mime_type, file_path, description, uploaded_at, investigation_id, size_bytes FROM evidence WHERE investigation_id = ? ORDER BY uploaded_at ASC',
      [investigationId],
    );
    if (!rows.length) return [];
    return rows[0].values.map((r: any[]) => ({
      id: r[0] as string,
      name: r[1] as string,
      type: r[2] as EvidenceType,
      mimeType: r[3] as string,
      filePath: r[4] as string,
      description: r[5] as string | undefined,
      uploadedAt: r[6] as string,
      investigationId: r[7] as string,
      sizeBytes: (r[8] as number) || 0,
    }));
  }

  // ===== Extracted Data =====

  setExtractedData(investigationId: string, data: ExtractedData): void {
    if (!this.db) throw new Error('Database not initialized');
    const now = new Date().toISOString();
    const json = JSON.stringify(data);
    
    // Upsert
    const existing = this.db.exec('SELECT 1 FROM extracted_data WHERE investigation_id = ?', [investigationId]);
    if (existing.length && existing[0].values.length) {
      this.db.run('UPDATE extracted_data SET data = ?, created_at = ? WHERE investigation_id = ?', [json, now, investigationId]);
    } else {
      this.db.run('INSERT INTO extracted_data (investigation_id, data, created_at) VALUES (?, ?, ?)', [investigationId, json, now]);
    }
    
    this.db.run('UPDATE investigations SET status = ?, updated_at = ? WHERE id = ?', ['complete', now, investigationId]);
    this.save();
  }

  getExtractedData(investigationId: string): ExtractedData | undefined {
    if (!this.db) return undefined;
    const rows = this.db.exec('SELECT data FROM extracted_data WHERE investigation_id = ?', [investigationId]);
    if (!rows.length || !rows[0].values.length) return undefined;
    try {
      const row = rows[0].values[0];
      return JSON.parse(row[0] as string);
    } catch {
      return undefined;
    }
  }

  updateInvestigationStatus(id: string, status: Investigation['status']): void {
    if (!this.db) return;
    this.db.run('UPDATE investigations SET status = ?, updated_at = ? WHERE id = ?', [status, new Date().toISOString(), id]);
    this.save();
  }

  deleteInvestigation(id: string): boolean {
    if (!this.db) return false;
    try {
      this.db.run('DELETE FROM extracted_data WHERE investigation_id = ?', [id]);
      this.db.run('DELETE FROM evidence WHERE investigation_id = ?', [id]);
      this.db.run('DELETE FROM investigations WHERE id = ?', [id]);
      this.save();
      return true;
    } catch (err) {
      logger.error('Failed to delete investigation:', err);
      return false;
    }
  }

  clearAll(): void {
    if (!this.db) return;
    this.db.run('DELETE FROM extracted_data');
    this.db.run('DELETE FROM evidence');
    this.db.run('DELETE FROM investigations');
    // Don't delete users
    this.save();
  }

  close(): void {
    if (this.db) {
      this.save();
      this.db.close();
      this.db = null;
      this.ready = false;
    }
  }
}

export const store = new Store();
