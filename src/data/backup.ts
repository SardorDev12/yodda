import { supabase } from '@/lib/supabase';
import type { Book, Card, Subject } from '@/lib/types';
import { fromCard, toBook, toCard, toSubject } from './mappers';

export const BACKUP_APP = 'yodda';
export const BACKUP_FORMAT_VERSION = 1;

export interface BackupFile {
  app: typeof BACKUP_APP;
  formatVersion: number;
  exportedAt: string;
  books: Book[];
  subjects: Subject[];
  cards: Card[];
}

export class BackupError extends Error {
  constructor(public code: 'invalid' | 'tooNew') {
    super(code);
  }
}

async function all<T>(table: string, map: (r: unknown) => T): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('id')
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []).map(map));
    if (!data || data.length < 1000) return out;
  }
}

export async function buildBackup(): Promise<BackupFile> {
  const [books, subjects, cards] = await Promise.all([
    all('books', toBook),
    all('subjects', toSubject),
    all('cards', toCard),
  ]);
  return {
    app: BACKUP_APP,
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    books,
    subjects,
    cards,
  };
}

export function parseBackup(text: string): BackupFile {
  let raw: Partial<BackupFile>;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new BackupError('invalid');
  }
  if (!raw || raw.app !== BACKUP_APP || typeof raw.formatVersion !== 'number') throw new BackupError('invalid');
  if (raw.formatVersion > BACKUP_FORMAT_VERSION) throw new BackupError('tooNew');
  if (!Array.isArray(raw.books) || !Array.isArray(raw.subjects) || !Array.isArray(raw.cards)) {
    throw new BackupError('invalid');
  }
  return raw as BackupFile;
}

async function existingTimes(table: string, ids: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await supabase.from(table).select('id,updated_at').in('id', ids.slice(i, i + 200));
    if (error) throw new Error(error.message);
    for (const r of data ?? []) map.set(r.id, new Date(r.updated_at).getTime());
  }
  return map;
}

/** Upserts rows that are new or newer than what's stored (last-write-wins). Safe to re-run. */
async function upsertNewer<T extends { id: string; updatedAt: string }>(
  table: string,
  rows: T[],
  toRow: (r: T) => object,
): Promise<number> {
  const known = await existingTimes(table, rows.map((r) => r.id));
  const fresh = rows.filter((r) => {
    const have = known.get(r.id);
    return have === undefined || new Date(r.updatedAt).getTime() > have;
  });
  for (let i = 0; i < fresh.length; i += 200) {
    const { error } = await supabase.from(table).upsert(fresh.slice(i, i + 200).map(toRow));
    if (error) throw new Error(error.message);
  }
  return fresh.length;
}

export async function restoreBackup(file: BackupFile) {
  const books = await upsertNewer('books', file.books, (b) => ({
    id: b.id,
    name: b.name,
    created_at: b.createdAt,
    updated_at: b.updatedAt,
  }));
  const subjects = await upsertNewer('subjects', file.subjects, (s) => ({
    id: s.id,
    book_id: s.bookId,
    name: s.name,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  }));
  const cards = await upsertNewer('cards', file.cards, fromCard);
  return { books, subjects, cards };
}
