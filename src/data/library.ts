import { supabase } from '@/lib/supabase';
import { DEFAULT_EASE, scheduler } from '@/lib/scheduler';
import type {
  Book,
  BookWithCounts,
  Card,
  HomeStats,
  Rating,
  Subject,
  SubjectWithCounts,
} from '@/lib/types';
import { fromCard, toBook, toCard, toSubject } from './mappers';

const PAGE = 1000;

/** Supabase caps a response at 1000 rows; page through until exhausted. */
async function fetchAll<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
}

const now = () => new Date().toISOString();

interface CardLite {
  subject_id: string;
  status: string;
  due_at: string;
}

const liteCards = (subjectIds?: string[]) =>
  fetchAll<CardLite>((from, to) => {
    let q = supabase
      .from('cards')
      .select('subject_id,status,due_at')
      .eq('deleted', false)
      .order('id')
      .range(from, to);
    if (subjectIds) q = q.in('subject_id', subjectIds);
    return q;
  });

/* ------------------------------- Books ------------------------------- */

export async function getBooksWithCounts(): Promise<BookWithCounts[]> {
  const [books, subjects, cards] = await Promise.all([
    supabase.from('books').select('*').order('created_at').then(({ data, error }) => {
      if (error) throw new Error(error.message);
      return (data ?? []).map(toBook);
    }),
    fetchAll<{ id: string; book_id: string }>((f, t) =>
      supabase.from('subjects').select('id,book_id').order('id').range(f, t),
    ),
    liteCards(),
  ]);
  const t = Date.now();
  const bookOfSubject = new Map(subjects.map((s) => [s.id, s.book_id]));
  const agg = new Map<string, { total: number; due: number }>();
  for (const c of cards) {
    const bookId = bookOfSubject.get(c.subject_id);
    if (!bookId) continue;
    const a = agg.get(bookId) ?? { total: 0, due: 0 };
    a.total += 1;
    if (new Date(c.due_at).getTime() <= t) a.due += 1;
    agg.set(bookId, a);
  }
  return books.map((b) => ({
    ...b,
    unitCount: subjects.filter((s) => s.book_id === b.id).length,
    totalCards: agg.get(b.id)?.total ?? 0,
    dueToday: agg.get(b.id)?.due ?? 0,
  }));
}

export async function getBook(id: string): Promise<Book | null> {
  const { data, error } = await supabase.from('books').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toBook(data) : null;
}

export async function createBook(name: string): Promise<void> {
  const { error } = await supabase.from('books').insert({ name: name.trim() });
  if (error) throw new Error(error.message);
}

export async function renameBook(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('books').update({ name: name.trim(), updated_at: now() }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteBook(id: string): Promise<void> {
  const { error } = await supabase.from('books').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/* ------------------------------ Subjects ----------------------------- */

export async function getSubjectsWithCounts(bookId: string): Promise<SubjectWithCounts[]> {
  const { data, error } = await supabase.from('subjects').select('*').eq('book_id', bookId).order('created_at');
  if (error) throw new Error(error.message);
  const subjects = (data ?? []).map(toSubject);
  if (!subjects.length) return [];
  const cards = await liteCards(subjects.map((s) => s.id));
  const t = Date.now();
  return subjects.map((s) => {
    const mine = cards.filter((c) => c.subject_id === s.id);
    return {
      ...s,
      totalCards: mine.length,
      dueToday: mine.filter((c) => new Date(c.due_at).getTime() <= t).length,
      newCards: mine.filter((c) => c.status === 'new').length,
    };
  });
}

export async function getSubject(id: string): Promise<(Subject & { bookName: string }) | null> {
  const { data, error } = await supabase.from('subjects').select('*, books(name)').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return { ...toSubject(data), bookName: (data as { books?: { name?: string } }).books?.name ?? '' };
}

export async function createSubject(bookId: string, name: string): Promise<void> {
  const { error } = await supabase.from('subjects').insert({ book_id: bookId, name: name.trim() });
  if (error) throw new Error(error.message);
}

export async function renameSubject(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('subjects').update({ name: name.trim(), updated_at: now() }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteSubject(id: string): Promise<void> {
  const { error } = await supabase.from('subjects').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/* -------------------------------- Cards ------------------------------ */

export async function getCards(subjectId: string): Promise<Card[]> {
  return (
    await fetchAll<unknown>((f, t) =>
      supabase
        .from('cards')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('deleted', false)
        .order('created_at', { ascending: false })
        .order('id')
        .range(f, t),
    )
  ).map(toCard);
}

export async function getCard(id: string): Promise<Card | null> {
  const { data, error } = await supabase.from('cards').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data && !data.deleted ? toCard(data) : null;
}

export async function createCard(subjectId: string, question: string, answer: string): Promise<void> {
  const { error } = await supabase.from('cards').insert({
    subject_id: subjectId,
    question: question.trim(),
    answer: answer.trim(),
    status: 'new',
    interval_days: 0,
    ease_factor: DEFAULT_EASE,
    repetitions: 0,
    due_at: now(),
  });
  if (error) throw new Error(error.message);
}

export async function updateCardText(id: string, question: string, answer: string): Promise<void> {
  const { error } = await supabase
    .from('cards')
    .update({ question: question.trim(), answer: answer.trim(), updated_at: now() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

/** Soft delete: the row stays, flagged `deleted`. */
export async function deleteCard(id: string): Promise<void> {
  const { error } = await supabase.from('cards').update({ deleted: true, updated_at: now() }).eq('id', id);
  if (error) throw new Error(error.message);
}

/* ------------------------------- Review ------------------------------ */

export interface ReviewScope {
  mode: 'due' | 'revise';
  subjectId?: string;
  bookId?: string;
}

export async function getReviewQueue(scope: ReviewScope): Promise<Card[]> {
  let subjectIds: string[] | undefined;
  if (scope.subjectId) {
    subjectIds = [scope.subjectId];
  } else if (scope.bookId) {
    const { data, error } = await supabase.from('subjects').select('id').eq('book_id', scope.bookId);
    if (error) throw new Error(error.message);
    subjectIds = (data ?? []).map((s) => s.id);
    if (!subjectIds.length) return [];
  }
  const rows = await fetchAll<unknown>((f, t) => {
    let q = supabase.from('cards').select('*').eq('deleted', false);
    if (subjectIds) q = q.in('subject_id', subjectIds);
    if (scope.mode === 'due') q = q.lte('due_at', now());
    return q.order('due_at').order('id').range(f, t);
  });
  const cards = rows.map(toCard);
  if (scope.mode === 'revise') {
    // Revision ignores due dates; shuffle so it doesn't always replay the same order.
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
  }
  return cards;
}

export function previewRating(card: Card, rating: Rating) {
  return scheduler.schedule(card, rating, new Date());
}

export async function recordReview(card: Card, rating: Rating): Promise<Card> {
  const next = previewRating(card, rating);
  const patch = {
    status: next.status,
    interval_days: next.intervalDays,
    ease_factor: next.easeFactor,
    repetitions: next.repetitions,
    due_at: next.dueAt.toISOString(),
    updated_at: now(),
  };
  const { error } = await supabase.from('cards').update(patch).eq('id', card.id);
  if (error) throw new Error(error.message);
  return {
    ...card,
    status: next.status,
    intervalDays: next.intervalDays,
    easeFactor: next.easeFactor,
    repetitions: next.repetitions,
    dueAt: patch.due_at,
    updatedAt: patch.updated_at,
  };
}

/* -------------------------------- Home ------------------------------- */

export async function getHomeStats(): Promise<HomeStats> {
  const cards = await liteCards();
  const t = new Date();
  const endOfToday = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1).getTime() - 1;
  const endOfTomorrow = endOfToday + 86_400_000;
  const endOfWeek = endOfToday + 7 * 86_400_000;
  const stats: HomeStats = { dueToday: 0, dueTomorrow: 0, dueThisWeek: 0, mature: 0 };
  for (const c of cards) {
    const due = new Date(c.due_at).getTime();
    if (c.status === 'mature') stats.mature += 1;
    if (due <= t.getTime()) stats.dueToday += 1;
    else if (due > endOfToday && due <= endOfTomorrow) stats.dueTomorrow += 1;
    if (due > t.getTime() && due <= endOfWeek) stats.dueThisWeek += 1;
  }
  return stats;
}
