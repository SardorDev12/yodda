import { supabase } from '@/lib/supabase';
import { scheduler } from '@/scheduler';
import type { Book, BookWithCounts, Card, CardStatus, Rating, Subject, SubjectWithCounts } from '@/types';

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
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

export async function listBooks(userId: string): Promise<BookWithCounts[]> {
  const db = requireClient();
  const now = new Date().toISOString();
  const [{ data: books, error: booksErr }, { data: subjects, error: subjErr }, { data: cards, error: cardsErr }] =
    await Promise.all([
      db.from('books').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      db.from('subjects').select('id, book_id').eq('user_id', userId),
      db.from('cards').select('subject_id, due_at').eq('user_id', userId).eq('deleted', false),
    ]);
  if (booksErr) throw booksErr;
  if (subjErr) throw subjErr;
  if (cardsErr) throw cardsErr;

  const subjectToBook = new Map<string, string>();
  for (const s of subjects ?? []) subjectToBook.set(s.id, s.book_id);
  const unitCount = new Map<string, number>();
  for (const s of subjects ?? []) unitCount.set(s.book_id, (unitCount.get(s.book_id) ?? 0) + 1);
  const totalCards = new Map<string, number>();
  const dueToday = new Map<string, number>();
  for (const c of cards ?? []) {
    const bookId = subjectToBook.get(c.subject_id);
    if (!bookId) continue;
    totalCards.set(bookId, (totalCards.get(bookId) ?? 0) + 1);
    if (c.due_at <= now) dueToday.set(bookId, (dueToday.get(bookId) ?? 0) + 1);
  }

  return (books ?? []).map((row) => ({
    ...rowToBook(row),
    unitCount: unitCount.get(row.id) ?? 0,
    totalCards: totalCards.get(row.id) ?? 0,
    dueToday: dueToday.get(row.id) ?? 0,
  }));
}

export async function createBook(userId: string, name: string): Promise<Book> {
  const db = requireClient();
  const id = newId();
  const now = new Date().toISOString();
  const { error } = await db
    .from('books')
    .insert({ id, user_id: userId, name: name.trim(), created_at: now, updated_at: now });
  if (error) throw error;
  return { id, name: name.trim(), createdAt: now, updatedAt: now };
}

export async function updateBook(userId: string, bookId: string, name: string): Promise<void> {
  const db = requireClient();
  const { error } = await db
    .from('books')
    .update({ name: name.trim(), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', bookId);
  if (error) throw error;
}

export async function getBook(userId: string, bookId: string): Promise<Book | null> {
  const db = requireClient();
  const { data, error } = await db.from('books').select('*').eq('user_id', userId).eq('id', bookId).maybeSingle();
  if (error) throw error;
  return data ? rowToBook(data) : null;
}

export async function deleteBook(userId: string, bookId: string): Promise<void> {
  const db = requireClient();
  const { data: subjects, error: subjErr } = await db
    .from('subjects')
    .select('id')
    .eq('user_id', userId)
    .eq('book_id', bookId);
  if (subjErr) throw subjErr;
  const subjectIds = (subjects ?? []).map((s) => s.id);
  if (subjectIds.length > 0) {
    const { error } = await db.from('cards').delete().eq('user_id', userId).in('subject_id', subjectIds);
    if (error) throw error;
  }
  await db.from('subjects').delete().eq('user_id', userId).eq('book_id', bookId);
  await db.from('books').delete().eq('user_id', userId).eq('id', bookId);
}

export async function listSubjects(userId: string, bookId?: string): Promise<SubjectWithCounts[]> {
  const db = requireClient();
  const now = new Date().toISOString();
  let subjectQuery = db.from('subjects').select('*').eq('user_id', userId).order('created_at', { ascending: true });
  if (bookId) subjectQuery = subjectQuery.eq('book_id', bookId);
  const [{ data: subjects, error: subjErr }, { data: cards, error: cardsErr }] = await Promise.all([
    subjectQuery,
    db.from('cards').select('subject_id, due_at, status').eq('user_id', userId).eq('deleted', false),
  ]);
  if (subjErr) throw subjErr;
  if (cardsErr) throw cardsErr;

  const totalCards = new Map<string, number>();
  const dueToday = new Map<string, number>();
  const newCards = new Map<string, number>();
  for (const c of cards ?? []) {
    totalCards.set(c.subject_id, (totalCards.get(c.subject_id) ?? 0) + 1);
    if (c.due_at <= now) dueToday.set(c.subject_id, (dueToday.get(c.subject_id) ?? 0) + 1);
    if (c.status === 'new') newCards.set(c.subject_id, (newCards.get(c.subject_id) ?? 0) + 1);
  }

  return (subjects ?? []).map((row) => ({
    ...rowToSubject(row),
    totalCards: totalCards.get(row.id) ?? 0,
    dueToday: dueToday.get(row.id) ?? 0,
    newCards: newCards.get(row.id) ?? 0,
  }));
}

export async function getSubject(userId: string, subjectId: string): Promise<Subject | null> {
  const db = requireClient();
  const { data, error } = await db.from('subjects').select('*').eq('user_id', userId).eq('id', subjectId).maybeSingle();
  if (error) throw error;
  return data ? rowToSubject(data) : null;
}

export async function createSubject(userId: string, bookId: string, name: string): Promise<Subject> {
  const db = requireClient();
  const id = newId();
  const now = new Date().toISOString();
  const { error } = await db
    .from('subjects')
    .insert({ id, user_id: userId, book_id: bookId, name: name.trim(), created_at: now, updated_at: now });
  if (error) throw error;
  return { id, bookId, name: name.trim(), createdAt: now, updatedAt: now };
}

export async function updateSubject(userId: string, subjectId: string, name: string): Promise<void> {
  const db = requireClient();
  const { error } = await db
    .from('subjects')
    .update({ name: name.trim(), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', subjectId);
  if (error) throw error;
}

export async function deleteSubject(userId: string, subjectId: string): Promise<void> {
  const db = requireClient();
  await db.from('cards').delete().eq('user_id', userId).eq('subject_id', subjectId);
  await db.from('subjects').delete().eq('user_id', userId).eq('id', subjectId);
}

export async function createCard(
  userId: string,
  input: { subjectId: string; question: string; answer: string }
): Promise<Card> {
  const db = requireClient();
  const id = newId();
  const now = new Date().toISOString();
  const row = {
    id,
    user_id: userId,
    subject_id: input.subjectId,
    question: input.question.trim(),
    answer: input.answer.trim(),
    status: 'new' as CardStatus,
    interval_days: 0,
    ease_factor: 2.5,
    repetitions: 0,
    due_at: now,
    created_at: now,
    updated_at: now,
    deleted: false,
  };
  const { error } = await db.from('cards').insert(row);
  if (error) throw error;
  return rowToCard(row);
}

export async function listCardsBySubject(userId: string, subjectId: string): Promise<Card[]> {
  const db = requireClient();
  const { data, error } = await db
    .from('cards')
    .select('*')
    .eq('user_id', userId)
    .eq('subject_id', subjectId)
    .eq('deleted', false)
    .order('due_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToCard);
}

export async function getDueCards(userId: string, limit = 100): Promise<Card[]> {
  const db = requireClient();
  const now = new Date().toISOString();
  const { data, error } = await db
    .from('cards')
    .select('*')
    .eq('user_id', userId)
    .eq('deleted', false)
    .lte('due_at', now)
    .order('due_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(rowToCard);
}

/**
 * On-demand review queue, ignoring due_at — lets a user revise whenever
 * they want instead of only what's currently due. Optionally scoped to one
 * subject. Ratings still feed the scheduler like a normal review.
 */
export async function getRevisionCards(userId: string, subjectId?: string, limit = 200): Promise<Card[]> {
  const db = requireClient();
  let query = db.from('cards').select('*').eq('user_id', userId).eq('deleted', false);
  if (subjectId) query = query.eq('subject_id', subjectId);
  const { data, error } = await query.order('due_at', { ascending: true }).limit(limit);
  if (error) throw error;
  return (data ?? []).map(rowToCard);
}

/**
 * Same as getRevisionCards, but scoped to every unit inside one book
 * rather than a single unit.
 */
export async function getRevisionCardsByBook(userId: string, bookId: string, limit = 200): Promise<Card[]> {
  const db = requireClient();
  const { data: subjects, error: subjErr } = await db.from('subjects').select('id').eq('user_id', userId).eq('book_id', bookId);
  if (subjErr) throw subjErr;
  const subjectIds = (subjects ?? []).map((s) => s.id);
  if (subjectIds.length === 0) return [];
  const { data, error } = await db
    .from('cards')
    .select('*')
    .eq('user_id', userId)
    .eq('deleted', false)
    .in('subject_id', subjectIds)
    .order('due_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(rowToCard);
}

export interface HomeStats {
  dueToday: number;
  newCards: number;
  dueTomorrow: number;
  dueThisWeek: number;
  mature: number;
}

export async function getHomeStats(userId: string): Promise<HomeStats> {
  const db = requireClient();
  const { data, error } = await db
    .from('cards')
    .select('status, due_at')
    .eq('user_id', userId)
    .eq('deleted', false);
  if (error) throw error;

  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const tomorrowEnd = new Date(todayEnd);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
  const weekEnd = new Date(todayEnd);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const stats: HomeStats = { dueToday: 0, newCards: 0, dueTomorrow: 0, dueThisWeek: 0, mature: 0 };
  for (const row of data ?? []) {
    const dueAt = new Date(row.due_at);
    if (dueAt <= todayEnd) stats.dueToday++;
    if (row.status === 'new') stats.newCards++;
    if (dueAt > todayEnd && dueAt <= tomorrowEnd) stats.dueTomorrow++;
    if (dueAt > todayEnd && dueAt <= weekEnd) stats.dueThisWeek++;
    if (row.status === 'mature') stats.mature++;
  }
  return stats;
}

export async function recordReview(userId: string, card: Card, rating: Rating): Promise<Card> {
  const db = requireClient();
  const result = scheduler.scheduleNextReview({
    status: card.status,
    intervalDays: card.intervalDays,
    easeFactor: card.easeFactor,
    repetitions: card.repetitions,
    rating,
  });
  const now = new Date().toISOString();

  const { error } = await db
    .from('cards')
    .update({
      status: result.status,
      interval_days: result.intervalDays,
      ease_factor: result.easeFactor,
      repetitions: result.repetitions,
      due_at: result.dueAt,
      updated_at: now,
    })
    .eq('user_id', userId)
    .eq('id', card.id);
  if (error) throw error;

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

export async function deleteCard(userId: string, cardId: string): Promise<void> {
  const db = requireClient();
  const { error } = await db
    .from('cards')
    .update({ deleted: true, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', cardId);
  if (error) throw error;
}

export async function getCard(userId: string, cardId: string): Promise<Card | null> {
  const db = requireClient();
  const { data, error } = await db.from('cards').select('*').eq('user_id', userId).eq('id', cardId).maybeSingle();
  if (error) throw error;
  return data ? rowToCard(data) : null;
}

export async function updateCard(
  userId: string,
  cardId: string,
  input: { question: string; answer: string }
): Promise<void> {
  const db = requireClient();
  const { error } = await db
    .from('cards')
    .update({ question: input.question.trim(), answer: input.answer.trim(), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', cardId);
  if (error) throw error;
}

export async function getAllBooks(userId: string): Promise<Book[]> {
  const db = requireClient();
  const { data, error } = await db.from('books').select('*').eq('user_id', userId).order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToBook);
}

export async function getAllSubjects(userId: string): Promise<Subject[]> {
  const db = requireClient();
  const { data, error } = await db.from('subjects').select('*').eq('user_id', userId).order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToSubject);
}

export async function getAllCards(userId: string): Promise<Card[]> {
  const db = requireClient();
  const { data, error } = await db.from('cards').select('*').eq('user_id', userId).order('updated_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToCard);
}

/** Inserts if absent; updates only if the incoming row is newer. Used by backup import. */
export async function upsertBook(userId: string, book: Book): Promise<void> {
  const db = requireClient();
  const { data: existing } = await db.from('books').select('updated_at').eq('user_id', userId).eq('id', book.id).maybeSingle();
  if (existing && new Date(existing.updated_at) >= new Date(book.updatedAt)) return;
  await db
    .from('books')
    .upsert({ id: book.id, user_id: userId, name: book.name, created_at: book.createdAt, updated_at: book.updatedAt });
}

export async function upsertSubject(userId: string, subject: Subject): Promise<void> {
  const db = requireClient();
  const { data: existing } = await db
    .from('subjects')
    .select('updated_at')
    .eq('user_id', userId)
    .eq('id', subject.id)
    .maybeSingle();
  if (existing && new Date(existing.updated_at) >= new Date(subject.updatedAt)) return;
  await db.from('subjects').upsert({
    id: subject.id,
    user_id: userId,
    book_id: subject.bookId,
    name: subject.name,
    created_at: subject.createdAt,
    updated_at: subject.updatedAt,
  });
}

export async function upsertCard(userId: string, card: Card): Promise<void> {
  const db = requireClient();
  const { data: existing } = await db.from('cards').select('updated_at').eq('user_id', userId).eq('id', card.id).maybeSingle();
  if (existing && new Date(existing.updated_at) >= new Date(card.updatedAt)) return;
  await db.from('cards').upsert({
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
  });
}

export async function getSetting(userId: string, key: string): Promise<string | null> {
  const db = requireClient();
  const { data, error } = await db.from('user_settings').select('data').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  const value = data?.data?.[key];
  return typeof value === 'string' ? value : null;
}

export async function setSetting(userId: string, key: string, value: string): Promise<void> {
  const db = requireClient();
  const { data: existing } = await db.from('user_settings').select('data').eq('user_id', userId).maybeSingle();
  const nextData = { ...(existing?.data ?? {}), [key]: value };
  const { error } = await db
    .from('user_settings')
    .upsert({ user_id: userId, data: nextData, updated_at: new Date().toISOString() });
  if (error) throw error;
}
