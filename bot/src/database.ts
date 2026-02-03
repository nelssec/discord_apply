import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { DATABASE_PATH } from './config.js';
import type {
  Form,
  FormRow,
  Question,
  QuestionRow,
  Application,
  ApplicationRow,
  Guild,
  parseForm,
  parseQuestion,
  parseApplication,
} from '../../shared/types.js';

const schemaPath = resolve(__dirname, '../../shared/schema.sql');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DATABASE_PATH);
    db.pragma('journal_mode = WAL');
    const schema = readFileSync(schemaPath, 'utf-8');
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

export function upsertGuild(id: string, name: string, icon: string | null, ownerId: string): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO guilds (id, name, icon, owner_id)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name = ?, icon = ?, owner_id = ?
  `).run(id, name, icon, ownerId, name, icon, ownerId);
}

export function getGuild(id: string): Guild | null {
  const db = getDb();
  return db.prepare('SELECT * FROM guilds WHERE id = ?').get(id) as Guild | null;
}

export function getFormsByGuild(guildId: string): Form[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM forms WHERE guild_id = ?').all(guildId) as FormRow[];
  return rows.map(parseFormRow);
}

export function getEnabledFormsByGuild(guildId: string): Form[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM forms WHERE guild_id = ? AND enabled = 1').all(guildId) as FormRow[];
  return rows.map(parseFormRow);
}

export function getFormById(id: number): Form | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM forms WHERE id = ?').get(id) as FormRow | undefined;
  return row ? parseFormRow(row) : null;
}

export function getFormByName(guildId: string, name: string): Form | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM forms WHERE guild_id = ? AND name = ? COLLATE NOCASE').get(guildId, name) as FormRow | undefined;
  return row ? parseFormRow(row) : null;
}

export function createForm(
  guildId: string,
  name: string,
  description?: string
): number {
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

export function createApplication(
  formId: number,
  guildId: string,
  userId: string,
  username: string,
  answers: Record<string, string>,
  options?: { discriminator?: string; avatar?: string; ticketChannelId?: string }
): number {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO applications (form_id, guild_id, user_id, username, discriminator, avatar, answers, ticket_channel_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    formId,
    guildId,
    userId,
    username,
    options?.discriminator || null,
    options?.avatar || null,
    JSON.stringify(answers),
    options?.ticketChannelId || null
  );
  return result.lastInsertRowid as number;
}

export function getApplicationById(id: number): Application | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as ApplicationRow | undefined;
  return row ? parseApplicationRow(row) : null;
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

export function getPendingApplicationByUserAndForm(userId: string, formId: number): Application | null {
  const db = getDb();
  const row = db.prepare(
    'SELECT * FROM applications WHERE user_id = ? AND form_id = ? AND status = ? ORDER BY created_at DESC LIMIT 1'
  ).get(userId, formId, 'pending') as ApplicationRow | undefined;
  return row ? parseApplicationRow(row) : null;
}

export function getLastApplicationByUserAndForm(userId: string, formId: number): Application | null {
  const db = getDb();
  const row = db.prepare(
    'SELECT * FROM applications WHERE user_id = ? AND form_id = ? ORDER BY created_at DESC LIMIT 1'
  ).get(userId, formId) as ApplicationRow | undefined;
  return row ? parseApplicationRow(row) : null;
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

export function updateApplicationTicket(id: number, ticketChannelId: string | null): void {
  const db = getDb();
  db.prepare('UPDATE applications SET ticket_channel_id = ? WHERE id = ?').run(ticketChannelId, id);
}

export function getApplicationByTicket(ticketChannelId: string): Application | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM applications WHERE ticket_channel_id = ?').get(ticketChannelId) as ApplicationRow | undefined;
  return row ? parseApplicationRow(row) : null;
}
