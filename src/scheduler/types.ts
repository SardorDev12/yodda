import type { CardStatus, Rating } from '@/types';

export interface SchedulerInput {
  status: CardStatus;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  rating: Rating;
}

export interface SchedulerOutput {
  status: CardStatus;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  dueAt: string;
}

/**
 * Swappable scheduling strategy. The app only ever talks to this interface,
 * so the algorithm (SM-2 today, FSRS later) can change without touching
 * review/db code.
 */
export interface Scheduler {
  scheduleNextReview(input: SchedulerInput, now?: Date): SchedulerOutput;
}
