import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'yodda.db';
const SCHEMA_VERSION = 3;

export async function migrateDatabase(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;
  if (currentVersion >= SCHEMA_VERSION) return;

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY NOT NULL,
      book_id TEXT NOT NULL DEFAULT 'general-book' REFERENCES books(id) ON DELETE CASCADE,
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

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_cards_due_at ON cards(due_at);
    CREATE INDEX IF NOT EXISTS idx_cards_subject_id ON cards(subject_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_card_id ON reviews(card_id);
  `);

  // Pre-existing databases (schema v2 and earlier) already have a
  // `subjects` table from before the `book_id` column existed — the
  // CREATE TABLE IF NOT EXISTS above is a no-op for them, so add it here.
  const subjectColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(subjects)');
  if (!subjectColumns.some((c) => c.name === 'book_id')) {
    await db.execAsync(
      "ALTER TABLE subjects ADD COLUMN book_id TEXT NOT NULL DEFAULT 'general-book' REFERENCES books(id) ON DELETE CASCADE"
    );
  }
  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_subjects_book_id ON subjects(book_id)');

  const now = new Date().toISOString();

  const existingBook = await db.getFirstAsync<{ id: string }>("SELECT id FROM books WHERE id = 'general-book'");
  if (!existingBook) {
    await db.runAsync(
      'INSERT INTO books (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
      'general-book',
      'General',
      now,
      now
    );
  }

  const existingSubject = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM subjects');
  if (!existingSubject || existingSubject.count === 0) {
    await db.runAsync(
      'INSERT INTO subjects (id, book_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      'general',
      'general-book',
      'General',
      now,
      now
    );
  }

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}
