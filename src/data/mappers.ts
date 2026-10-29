import type { Book, Card, Subject } from '@/lib/types';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const toBook = (r: any): Book => ({
  id: r.id,
  name: r.name,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const toSubject = (r: any): Subject => ({
  id: r.id,
  bookId: r.book_id,
  name: r.name,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const toCard = (r: any): Card => ({
  id: r.id,
  subjectId: r.subject_id,
  question: r.question,
  answer: r.answer,
  status: r.status,
  intervalDays: r.interval_days,
  easeFactor: r.ease_factor,
  repetitions: r.repetitions,
  dueAt: r.due_at,
  deleted: r.deleted,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const fromCard = (c: Card) => ({
  id: c.id,
  subject_id: c.subjectId,
  question: c.question,
  answer: c.answer,
  status: c.status,
  interval_days: c.intervalDays,
  ease_factor: c.easeFactor,
  repetitions: c.repetitions,
  due_at: c.dueAt,
  deleted: c.deleted,
  created_at: c.createdAt,
  updated_at: c.updatedAt,
});
