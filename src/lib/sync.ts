import type { RealtimeChannel } from '@supabase/supabase-js';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  ensureBookExists,
  ensureSubjectExists,
  getAllBooksForSync,
  getAllCardsForSync,
  listSubjects,
  upsertCardFromRemote,
} from '@/db/queries';
import { supabase } from '@/lib/supabase';
import type { Book, Card, Subject } from '@/types';

function bookToRow(book: Book, userId: string) {
  return { id: book.id, user_id: userId, name: book.name, created_at: book.createdAt, updated_at: book.updatedAt };
}

function subjectToRow(subject: Subject, userId: string) {
  return {
    id: subject.id,
    user_id: userId,
    book_id: subject.bookId,
    name: subject.name,
    created_at: subject.createdAt,
    updated_at: subject.updatedAt,
  };
}

function cardToRow(card: Card, userId: string) {
  return {
    id: card.id,
    user_id: userId,
    subject_id: card.subjectId,
    question: card.question,
    answer: card.answer,
    status: card.status,
    interval_days: card.intervalDays,
    ease_factor: card.easeFactor,
    repetitions: card.repetitions,
    due_at: card.dueAt,
    created_at: card.createdAt,
    updated_at: card.updatedAt,
    deleted: card.deleted,
  };
}

function rowToBook(row: any): Book {
  return { id: row.id, name: row.name, createdAt: row.created_at, updatedAt: row.updated_at };
}

function rowToSubject(row: any): Subject {
  return { id: row.id, bookId: row.book_id, name: row.name, createdAt: row.created_at, updatedAt: row.updated_at };
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

/**
 * Push every local row to Supabase (upsert) then pull every remote row
 * back in (last-write-wins merge by updated_at, via the same functions
 * backup import already uses). Cheap full-table sync, fine for a
 * single-user, modest-sized dataset; a cursor/delta sync can replace
 * this later without changing callers.
 */
export async function runFullSync(db: SQLiteDatabase, userId: string): Promise<void> {
  if (!supabase) return;

  const [localBooks, localSubjects, localCards] = await Promise.all([
    getAllBooksForSync(db),
    listSubjects(db),
    getAllCardsForSync(db),
  ]);

  if (localBooks.length > 0) {
    await supabase.from('books').upsert(localBooks.map((b) => bookToRow(b, userId)));
  }
  if (localSubjects.length > 0) {
    await supabase.from('subjects').upsert(localSubjects.map((s) => subjectToRow(s, userId)));
  }
  if (localCards.length > 0) {
    await supabase.from('cards').upsert(localCards.map((c) => cardToRow(c, userId)));
  }

  const [{ data: remoteBooks }, { data: remoteSubjects }, { data: remoteCards }] = await Promise.all([
    supabase.from('books').select('*').eq('user_id', userId),
    supabase.from('subjects').select('*').eq('user_id', userId),
    supabase.from('cards').select('*').eq('user_id', userId),
  ]);

  for (const row of remoteBooks ?? []) await ensureBookExists(db, rowToBook(row));
  for (const row of remoteSubjects ?? []) await ensureSubjectExists(db, rowToSubject(row));
  for (const row of remoteCards ?? []) await upsertCardFromRemote(db, rowToCard(row));
}

/** Push the full local dataset up. Call after any local mutation while signed in. */
export async function pushAll(db: SQLiteDatabase, userId: string): Promise<void> {
  if (!supabase) return;
  const [books, subjects, cards] = await Promise.all([getAllBooksForSync(db), listSubjects(db), getAllCardsForSync(db)]);
  await Promise.all([
    books.length > 0 ? supabase.from('books').upsert(books.map((b) => bookToRow(b, userId))) : null,
    subjects.length > 0 ? supabase.from('subjects').upsert(subjects.map((s) => subjectToRow(s, userId))) : null,
    cards.length > 0 ? supabase.from('cards').upsert(cards.map((c) => cardToRow(c, userId))) : null,
  ]);
}

let channels: RealtimeChannel[] = [];

/**
 * Subscribe to this user's own rows changing on another device and merge
 * them in as they arrive. Last-write-wins by updated_at, same as a full
 * sync's pull side.
 */
export function startRealtimeSync(db: SQLiteDatabase, userId: string): void {
  if (!supabase) return;
  stopRealtimeSync();

  const books = supabase
    .channel('sync-books')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'books', filter: `user_id=eq.${userId}` },
      (payload) => {
        if (payload.new && 'id' in payload.new) ensureBookExists(db, rowToBook(payload.new));
      }
    )
    .subscribe();

  const subjects = supabase
    .channel('sync-subjects')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'subjects', filter: `user_id=eq.${userId}` },
      (payload) => {
        if (payload.new && 'id' in payload.new) ensureSubjectExists(db, rowToSubject(payload.new));
      }
    )
    .subscribe();

  const cards = supabase
    .channel('sync-cards')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'cards', filter: `user_id=eq.${userId}` },
      (payload) => {
        if (payload.new && 'id' in payload.new) upsertCardFromRemote(db, rowToCard(payload.new));
      }
    )
    .subscribe();

  channels = [books, subjects, cards];
}

export function stopRealtimeSync(): void {
  if (!supabase) return;
  for (const channel of channels) supabase.removeChannel(channel);
  channels = [];
}
