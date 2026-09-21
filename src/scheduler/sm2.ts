import type { CardStatus } from '@/types';
import type { Scheduler, SchedulerInput, SchedulerOutput } from './types';

const MIN_EASE = 1.3;
const DEFAULT_EASE = 2.5;
const MATURE_THRESHOLD_DAYS = 21;

function statusForInterval(intervalDays: number, repetitions: number): CardStatus {
  if (repetitions === 0) return 'learning';
  if (intervalDays >= MATURE_THRESHOLD_DAYS) return 'mature';
  return 'review';
}

/**
 * SM-2-derived scheduler (Anki-style four-button variant). Kept behind the
 * Scheduler interface so it can be swapped for FSRS later without touching
 * callers.
 */
export const sm2Scheduler: Scheduler = {
  scheduleNextReview(input: SchedulerInput, now: Date = new Date()): SchedulerOutput {
    const easeFactor = input.easeFactor || DEFAULT_EASE;
    let repetitions = input.repetitions;
    let intervalDays = input.intervalDays;
    let nextEase = easeFactor;

    if (input.rating === 'again') {
      repetitions = 0;
      intervalDays = 1;
      nextEase = Math.max(MIN_EASE, easeFactor - 0.2);
    } else {
      repetitions += 1;
      nextEase =
        input.rating === 'hard'
          ? Math.max(MIN_EASE, easeFactor - 0.15)
          : input.rating === 'easy'
            ? easeFactor + 0.15
            : easeFactor;

      if (repetitions === 1) {
        intervalDays = input.rating === 'easy' ? 4 : 1;
      } else if (repetitions === 2) {
        intervalDays = input.rating === 'easy' ? 9 : input.rating === 'hard' ? 3 : 6;
      } else {
        const multiplier = input.rating === 'hard' ? 1.2 : input.rating === 'easy' ? nextEase * 1.3 : nextEase;
        intervalDays = Math.round(Math.max(intervalDays, 1) * multiplier);
      }
    }

    intervalDays = Math.max(1, intervalDays);
    const dueAt = new Date(now);
    dueAt.setDate(dueAt.getDate() + intervalDays);

    return {
      status: statusForInterval(intervalDays, repetitions),
      intervalDays,
      easeFactor: Math.round(nextEase * 100) / 100,
      repetitions,
      dueAt: dueAt.toISOString(),
    };
  },
};
