import type { SQLiteDatabase } from 'expo-sqlite';

import { scheduler } from '@/scheduler';
import type { Card, Rating, Subject, SubjectWithCounts } from '@/types';

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function rowToCard(row: any): Card {
  return {
    id: row.id,
    subjectId: row.subject_id,
    question: row.question,
    answer: row.answer,
    status: row.status,
    intervalDays: row.interval_days,
    easeFactor: row.ease_factor,
    repetitions: row.repetitions,
    dueAt: row.due_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deleted: !!row.deleted,
  };
}

export async function listSubjects(db: SQLiteDatabase): Promise<SubjectWithCounts[]> {
  const now = new Date().toISOString();
  const rows = await db.getAllAsync<any>(
    `SELECT
        s.id, s.name, s.created_at, s.updated_at,
        COUNT(c.id) FILTER (WHERE c.deleted = 0) AS total_cards,
        COUNT(c.id) FILTER (WHERE c.deleted = 0 AND c.due_at <= ?) AS due_today,
        COUNT(c.id) FILTER (WHERE c.deleted = 0 AND c.status = 'new') AS new_cards
      FROM subjects s
      LEFT JOIN cards c ON c.subject_id = s.id
      GROUP BY s.id
      ORDER BY s.created_at ASC`,
    now
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    totalCards: row.total_cards,
    dueToday: row.due_today,
    newCards: row.new_cards,
  }));
}

export async function createSubject(db: SQLiteDatabase, name: string): Promise<Subject> {
  const id = newId();
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO subjects (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
    id,
    name.trim(),
    now,
    now
  );
  return { id, name: name.trim(), createdAt: now, updatedAt: now };
}

export async function createCard(
  db: SQLiteDatabase,
  input: { subjectId: string; question: string; answer: string }
): Promise<Card> {
  const id = newId();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO cards
      (id, subject_id, question, answer, status, interval_days, ease_factor, repetitions, due_at, created_at, updated_at, deleted)
     VALUES (?, ?, ?, ?, 'new', 0, 2.5, 0, ?, ?, ?, 0)`,
    id,
    input.subjectId,
    input.question.trim(),
    input.answer.trim(),
    now,
    now,
    now
  );
  const row = await db.getFirstAsync<any>('SELECT * FROM cards WHERE id = ?', id);
  return rowToCard(row);
}

export async function listCardsBySubject(db: SQLiteDatabase, subjectId: string): Promise<Card[]> {
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM cards WHERE subject_id = ? AND deleted = 0 ORDER BY due_at ASC',
    subjectId
  );
  return rows.map(rowToCard);
}

export async function getDueCards(db: SQLiteDatabase, limit = 100): Promise<Card[]> {
  const now = new Date().toISOString();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM cards WHERE deleted = 0 AND due_at <= ? ORDER BY due_at ASC LIMIT ?',
    now,
    limit
  );
  return rows.map(rowToCard);
}

/**
 * On-demand review queue, ignoring due_at — lets a user revise whenever
 * they want instead of only what's currently due. Optionally scoped to one
 * subject. Ratings still feed the scheduler like a normal review.
 */
export async function getRevisionCards(db: SQLiteDatabase, subjectId?: string, limit = 200): Promise<Card[]> {
  const rows = subjectId
    ? await db.getAllAsync<any>(
        'SELECT * FROM cards WHERE deleted = 0 AND subject_id = ? ORDER BY due_at ASC LIMIT ?',
        subjectId,
        limit
      )
    : await db.getAllAsync<any>('SELECT * FROM cards WHERE deleted = 0 ORDER BY due_at ASC LIMIT ?', limit);
  return rows.map(rowToCard);
}

export interface HomeStats {
  dueToday: number;
  newCards: number;
  dueTomorrow: number;
  dueThisWeek: number;
  mature: number;
}

export async function getHomeStats(db: SQLiteDatabase): Promise<HomeStats> {
  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const tomorrowEnd = new Date(todayEnd);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
  const weekEnd = new Date(todayEnd);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [dueToday, newCards, dueTomorrow, dueThisWeek, mature] = await Promise.all([
    db.getFirstAsync<{ n: number }>(
      "SELECT COUNT(*) as n FROM cards WHERE deleted = 0 AND due_at <= ?",
      todayEnd.toISOString()
    ),
    db.getFirstAsync<{ n: number }>("SELECT COUNT(*) as n FROM cards WHERE deleted = 0 AND status = 'new'"),
    db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) as n FROM cards WHERE deleted = 0 AND due_at > ? AND due_at <= ?',
      todayEnd.toISOString(),
      tomorrowEnd.toISOString()
    ),
    db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) as n FROM cards WHERE deleted = 0 AND due_at > ? AND due_at <= ?',
      todayEnd.toISOString(),
      weekEnd.toISOString()
    ),
    db.getFirstAsync<{ n: number }>("SELECT COUNT(*) as n FROM cards WHERE deleted = 0 AND status = 'mature'"),
  ]);

  return {
    dueToday: dueToday?.n ?? 0,
    newCards: newCards?.n ?? 0,
    dueTomorrow: dueTomorrow?.n ?? 0,
    dueThisWeek: dueThisWeek?.n ?? 0,
    mature: mature?.n ?? 0,
  };
}

export async function recordReview(db: SQLiteDatabase, card: Card, rating: Rating): Promise<Card> {
  const result = scheduler.scheduleNextReview({
    status: card.status,
    intervalDays: card.intervalDays,
    easeFactor: card.easeFactor,
    repetitions: card.repetitions,
    rating,
  });
  const now = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE cards SET status = ?, interval_days = ?, ease_factor = ?, repetitions = ?, due_at = ?, updated_at = ?
       WHERE id = ?`,
      result.status,
      result.intervalDays,
      result.easeFactor,
      result.repetitions,
      result.dueAt,
      now,
      card.id
    );
    await db.runAsync(
      `INSERT INTO reviews (id, card_id, rating, reviewed_at, interval_days_before, interval_days_after)
       VALUES (?, ?, ?, ?, ?, ?)`,
      newId(),
      card.id,
      rating,
      now,
      card.intervalDays,
      result.intervalDays
    );
  });

  return {
    ...card,
    status: result.status,
    intervalDays: result.intervalDays,
    easeFactor: result.easeFactor,
    repetitions: result.repetitions,
    dueAt: result.dueAt,
    updatedAt: now,
  };
}

export async function deleteCard(db: SQLiteDatabase, cardId: string): Promise<void> {
  await db.runAsync('UPDATE cards SET deleted = 1, updated_at = ? WHERE id = ?', new Date().toISOString(), cardId);
}

export async function getCard(db: SQLiteDatabase, cardId: string): Promise<Card | null> {
  const row = await db.getFirstAsync<any>('SELECT * FROM cards WHERE id = ?', cardId);
  return row ? rowToCard(row) : null;
}

export async function updateCard(
  db: SQLiteDatabase,
  cardId: string,
  input: { question: string; answer: string }
): Promise<void> {
  await db.runAsync(
    'UPDATE cards SET question = ?, answer = ?, updated_at = ? WHERE id = ?',
    input.question.trim(),
    input.answer.trim(),
    new Date().toISOString(),
    cardId
  );
}

export async function getAllCardsForSync(db: SQLiteDatabase): Promise<Card[]> {
  const rows = await db.getAllAsync<any>('SELECT * FROM cards ORDER BY updated_at ASC');
  return rows.map(rowToCard);
}

export async function upsertCardFromRemote(db: SQLiteDatabase, card: Card): Promise<void> {
  const existing = await db.getFirstAsync<any>('SELECT updated_at FROM cards WHERE id = ?', card.id);
  if (existing && new Date(existing.updated_at) >= new Date(card.updatedAt)) return;

  if (existing) {
    await db.runAsync(
      `UPDATE cards SET subject_id = ?, question = ?, answer = ?, status = ?, interval_days = ?, ease_factor = ?,
        repetitions = ?, due_at = ?, updated_at = ?, deleted = ? WHERE id = ?`,
      card.subjectId,
      card.question,
      card.answer,
      card.status,
      card.intervalDays,
      card.easeFactor,
      card.repetitions,
      card.dueAt,
      card.updatedAt,
      card.deleted ? 1 : 0,
      card.id
    );
  } else {
    await db.runAsync(
      `INSERT INTO cards (id, subject_id, question, answer, status, interval_days, ease_factor, repetitions,
        due_at, created_at, updated_at, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      card.id,
      card.subjectId,
      card.question,
      card.answer,
      card.status,
      card.intervalDays,
      card.easeFactor,
      card.repetitions,
      card.dueAt,
      card.createdAt,
      card.updatedAt,
      card.deleted ? 1 : 0
    );
  }
}

export async function ensureSubjectExists(db: SQLiteDatabase, subject: Subject): Promise<void> {
  const existing = await db.getFirstAsync<any>('SELECT id FROM subjects WHERE id = ?', subject.id);
  if (existing) return;
  await db.runAsync(
    'INSERT INTO subjects (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
    subject.id,
    subject.name,
    subject.createdAt,
    subject.updatedAt
  );
}

export async function getSetting(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key);
  return row?.value ?? null;
}

export async function setSetting(db: SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value
  );
}
