import Database from 'better-sqlite3';
import { resolve } from 'path';

const DATABASE_PATH = process.env.DATABASE_PATH || resolve(process.cwd(), '../data/guild_apps.db');

const schema = `
CREATE TABLE IF NOT EXISTS guilds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  owner_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS forms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  enabled INTEGER DEFAULT 1,
  log_channel_id TEXT,
  ticket_category_id TEXT,
  manager_role_ids TEXT,
  required_role_ids TEXT,
  restricted_role_ids TEXT,
  ping_role_ids TEXT,
  accept_role_ids TEXT,
  deny_role_ids TEXT,
  remove_role_ids TEXT,
  completion_message TEXT,
  accept_message TEXT,
  deny_message TEXT,
  cooldown_seconds INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (guild_id) REFERENCES guilds(id)
);

CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  form_id INTEGER NOT NULL,
  label TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  placeholder TEXT,
  required INTEGER DEFAULT 1,
  options TEXT,
  position INTEGER NOT NULL,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  form_id INTEGER NOT NULL,
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  discriminator TEXT,
  avatar TEXT,
  answers TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  ticket_channel_id TEXT,
  reviewer_id TEXT,
  reviewer_username TEXT,
  reason TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  resolved_at TEXT,
  FOREIGN KEY (form_id) REFERENCES forms(id),
  FOREIGN KEY (guild_id) REFERENCES guilds(id)
);

CREATE TABLE IF NOT EXISTS user_sessions (
  user_id TEXT PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  guilds TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_applications_guild ON applications(guild_id);
CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_forms_guild ON forms(guild_id);
`;

interface FormRow {
  id: number;
  guild_id: string;
  name: string;
  description: string | null;
  enabled: number;
  log_channel_id: string | null;
  ticket_category_id: string | null;
  manager_role_ids: string | null;
  required_role_ids: string | null;
  restricted_role_ids: string | null;
  ping_role_ids: string | null;
  accept_role_ids: string | null;
  deny_role_ids: string | null;
  remove_role_ids: string | null;
  completion_message: string | null;
  accept_message: string | null;
  deny_message: string | null;
  cooldown_seconds: number;
  created_at: string;
}

interface QuestionRow {
  id: number;
  form_id: number;
  label: string;
  type: string;
  placeholder: string | null;
  required: number;
  options: string | null;
  position: number;
}

interface ApplicationRow {
  id: number;
  form_id: number;
  guild_id: string;
  user_id: string;
  username: string;
  discriminator: string | null;
  avatar: string | null;
  answers: string;
  status: string;
  ticket_channel_id: string | null;
  reviewer_id: string | null;
  reviewer_username: string | null;
  reason: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface Form {
  id: number;
  guild_id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  log_channel_id: string | null;
  ticket_category_id: string | null;
  manager_role_ids: string[];
  required_role_ids: string[];
  restricted_role_ids: string[];
  ping_role_ids: string[];
  accept_role_ids: string[];
  deny_role_ids: string[];
  remove_role_ids: string[];
  completion_message: string | null;
  accept_message: string | null;
  deny_message: string | null;
  cooldown_seconds: number;
  created_at: string;
}

export interface Question {
  id: number;
  form_id: number;
  label: string;
  type: 'text' | 'paragraph' | 'choice';
  placeholder: string | null;
  required: boolean;
  options: string[] | null;
  position: number;
}

export interface Application {
  id: number;
  form_id: number;
  guild_id: string;
  user_id: string;
  username: string;
  discriminator: string | null;
  avatar: string | null;
  answers: Record<string, string>;
  status: 'pending' | 'accepted' | 'denied';
  ticket_channel_id: string | null;
  reviewer_id: string | null;
  reviewer_username: string | null;
  reason: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner_id: string;
  created_at: string;
}

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DATABASE_PATH);
    db.pragma('journal_mode = WAL');
    db.exec(schema);
  }
  return db;
}

function parseFormRow(row: FormRow): Form {
  return {
    ...row,
    enabled: Boolean(row.enabled),
    manager_role_ids: row.manager_role_ids ? JSON.parse(row.manager_role_ids) : [],
    required_role_ids: row.required_role_ids ? JSON.parse(row.required_role_ids) : [],
    restricted_role_ids: row.restricted_role_ids ? JSON.parse(row.restricted_role_ids) : [],
    ping_role_ids: row.ping_role_ids ? JSON.parse(row.ping_role_ids) : [],
    accept_role_ids: row.accept_role_ids ? JSON.parse(row.accept_role_ids) : [],
    deny_role_ids: row.deny_role_ids ? JSON.parse(row.deny_role_ids) : [],
    remove_role_ids: row.remove_role_ids ? JSON.parse(row.remove_role_ids) : [],
  };
}

function parseQuestionRow(row: QuestionRow): Question {
  return {
    ...row,
    type: row.type as 'text' | 'paragraph' | 'choice',
    required: Boolean(row.required),
    options: row.options ? JSON.parse(row.options) : null,
  };
}

function parseApplicationRow(row: ApplicationRow): Application {
  return {
    ...row,
    answers: JSON.parse(row.answers),
    status: row.status as 'pending' | 'accepted' | 'denied',
  };
}

export function getGuild(id: string): Guild | null {
  const db = getDb();
  return db.prepare('SELECT * FROM guilds WHERE id = ?').get(id) as Guild | null;
}

export function upsertGuild(id: string, name: string, icon: string | null, ownerId: string): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO guilds (id, name, icon, owner_id)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name = ?, icon = ?, owner_id = ?
  `).run(id, name, icon, ownerId, name, icon, ownerId);
}

export function getFormsByGuild(guildId: string): Form[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM forms WHERE guild_id = ? ORDER BY created_at DESC').all(guildId) as FormRow[];
  return rows.map(parseFormRow);
}

export function getFormById(id: number): Form | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM forms WHERE id = ?').get(id) as FormRow | undefined;
  return row ? parseFormRow(row) : null;
}

export function createForm(guildId: string, name: string, description?: string): number {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO forms (guild_id, name, description)
    VALUES (?, ?, ?)
  `).run(guildId, name, description || null);
  return result.lastInsertRowid as number;
}

export function updateForm(id: number, updates: Partial<{
  name: string;
  description: string | null;
  enabled: boolean;
  log_channel_id: string | null;
  ticket_category_id: string | null;
  manager_role_ids: string[];
  required_role_ids: string[];
  restricted_role_ids: string[];
  ping_role_ids: string[];
  accept_role_ids: string[];
  deny_role_ids: string[];
  remove_role_ids: string[];
  completion_message: string | null;
  accept_message: string | null;
  deny_message: string | null;
  cooldown_seconds: number;
}>): void {
  const db = getDb();
  const setClauses: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue;

    if (key.endsWith('_ids') && Array.isArray(value)) {
      setClauses.push(`${key} = ?`);
      values.push(JSON.stringify(value));
    } else if (key === 'enabled') {
      setClauses.push(`${key} = ?`);
      values.push(value ? 1 : 0);
    } else {
      setClauses.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (setClauses.length === 0) return;

  values.push(id);
  db.prepare(`UPDATE forms SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteForm(id: number): void {
  const db = getDb();
  db.prepare('DELETE FROM forms WHERE id = ?').run(id);
}

export function getQuestionsByForm(formId: number): Question[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM questions WHERE form_id = ? ORDER BY position').all(formId) as QuestionRow[];
  return rows.map(parseQuestionRow);
}

export function createQuestion(
  formId: number,
  label: string,
  type: 'text' | 'paragraph' | 'choice' = 'text',
  position: number,
  options?: { placeholder?: string; required?: boolean; choices?: string[] }
): number {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO questions (form_id, label, type, placeholder, required, options, position)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    formId,
    label,
    type,
    options?.placeholder || null,
    options?.required !== false ? 1 : 0,
    options?.choices ? JSON.stringify(options.choices) : null,
    position
  );
  return result.lastInsertRowid as number;
}

export function updateQuestion(id: number, updates: Partial<{
  label: string;
  type: 'text' | 'paragraph' | 'choice';
  placeholder: string | null;
  required: boolean;
  options: string[] | null;
  position: number;
}>): void {
  const db = getDb();
  const setClauses: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue;

    if (key === 'options') {
      setClauses.push(`${key} = ?`);
      values.push(value ? JSON.stringify(value) : null);
    } else if (key === 'required') {
      setClauses.push(`${key} = ?`);
      values.push(value ? 1 : 0);
    } else {
      setClauses.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (setClauses.length === 0) return;

  values.push(id);
  db.prepare(`UPDATE questions SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteQuestion(id: number): void {
  const db = getDb();
  db.prepare('DELETE FROM questions WHERE id = ?').run(id);
}

export function deleteQuestionsByForm(formId: number): void {
  const db = getDb();
  db.prepare('DELETE FROM questions WHERE form_id = ?').run(formId);
}

export function getApplicationsByGuild(guildId: string, status?: string): Application[] {
  const db = getDb();
  let query = 'SELECT * FROM applications WHERE guild_id = ?';
  const params: unknown[] = [guildId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params) as ApplicationRow[];
  return rows.map(parseApplicationRow);
}

export function getApplicationById(id: number): Application | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as ApplicationRow | undefined;
  return row ? parseApplicationRow(row) : null;
}

export function getApplicationsByUser(userId: string, guildId?: string): Application[] {
  const db = getDb();
  let query = 'SELECT * FROM applications WHERE user_id = ?';
  const params: unknown[] = [userId];

  if (guildId) {
    query += ' AND guild_id = ?';
    params.push(guildId);
  }

  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params) as ApplicationRow[];
  return rows.map(parseApplicationRow);
}

export function updateApplicationStatus(
  id: number,
  status: 'accepted' | 'denied',
  reviewerId: string,
  reviewerUsername: string,
  reason?: string
): void {
  const db = getDb();
  db.prepare(`
    UPDATE applications
    SET status = ?, reviewer_id = ?, reviewer_username = ?, reason = ?, resolved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, reviewerId, reviewerUsername, reason || null, id);
}

export function getApplicationStats(guildId: string): { pending: number; accepted: number; denied: number } {
  const db = getDb();
  const pending = db.prepare('SELECT COUNT(*) as count FROM applications WHERE guild_id = ? AND status = ?').get(guildId, 'pending') as { count: number };
  const accepted = db.prepare('SELECT COUNT(*) as count FROM applications WHERE guild_id = ? AND status = ?').get(guildId, 'accepted') as { count: number };
  const denied = db.prepare('SELECT COUNT(*) as count FROM applications WHERE guild_id = ? AND status = ?').get(guildId, 'denied') as { count: number };

  return {
    pending: pending.count,
    accepted: accepted.count,
    denied: denied.count,
  };
}
