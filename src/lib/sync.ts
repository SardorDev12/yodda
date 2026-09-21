import type { SQLiteDatabase } from 'expo-sqlite';

import { ensureSubjectExists, getAllCardsForSync, listSubjects, upsertCardFromRemote } from '@/db/queries';
import { supabase } from '@/lib/supabase';
import type { Card, Subject } from '@/types';

function cardToRemoteRow(card: Card, userId: string) {
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

function subjectToRemoteRow(subject: Subject, userId: string) {
  return {
    id: subject.id,
    user_id: userId,
    name: subject.name,
    created_at: subject.createdAt,
    updated_at: subject.updatedAt,
  };
}

function remoteRowToCard(row: any): Card {
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
 * Simple last-write-wins sync: push everything local, pull everything
 * remote, merge by `updated_at`. Good enough for a single-user MVP; a
 * proper delta/cursor sync can replace this later without changing callers.
 */
export async function runFullSync(db: SQLiteDatabase, userId: string): Promise<{ pushed: number; pulled: number }> {
  if (!supabase) return { pushed: 0, pulled: 0 };

  const [localSubjects, localCards] = await Promise.all([listSubjects(db), getAllCardsForSync(db)]);

  if (localSubjects.length > 0) {
    await supabase.from('subjects').upsert(localSubjects.map((s) => subjectToRemoteRow(s, userId)));
  }
  if (localCards.length > 0) {
    await supabase.from('cards').upsert(localCards.map((c) => cardToRemoteRow(c, userId)));
  }

  const [{ data: remoteSubjects }, { data: remoteCards }] = await Promise.all([
    supabase.from('subjects').select('*').eq('user_id', userId),
    supabase.from('cards').select('*').eq('user_id', userId),
  ]);

  for (const row of remoteSubjects ?? []) {
    await ensureSubjectExists(db, {
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
  for (const row of remoteCards ?? []) {
    await upsertCardFromRemote(db, remoteRowToCard(row));
  }

  return { pushed: localCards.length, pulled: remoteCards?.length ?? 0 };
}

export async function pushNewSubject(subject: Subject, userId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('subjects').upsert(subjectToRemoteRow(subject, userId));
}

export async function pushCard(card: Card, userId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('cards').upsert(cardToRemoteRow(card, userId));
}
