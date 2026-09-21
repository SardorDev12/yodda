import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'yodda.db';
const SCHEMA_VERSION = 1;

export async function migrateDatabase(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;
  if (currentVersion >= SCHEMA_VERSION) return;

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY NOT NULL,
      subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      interval_days INTEGER NOT NULL DEFAULT 0,
      ease_factor REAL NOT NULL DEFAULT 2.5,
      repetitions INTEGER NOT NULL DEFAULT 0,
      due_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY NOT NULL,
      card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      rating TEXT NOT NULL,
      reviewed_at TEXT NOT NULL,
      interval_days_before INTEGER NOT NULL,
      interval_days_after INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_cards_due_at ON cards(due_at);
    CREATE INDEX IF NOT EXISTS idx_cards_subject_id ON cards(subject_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_card_id ON reviews(card_id);
  `);

  const existing = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM subjects');
  if (!existing || existing.count === 0) {
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT INTO subjects (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
      'general',
      'General',
      now,
      now
    );
  }

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}
