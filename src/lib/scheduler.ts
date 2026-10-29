import type { CardStatus, Rating } from './types';

export const MIN_EASE = 1.3;
export const DEFAULT_EASE = 2.5;
export const MATURE_INTERVAL_DAYS = 21;

export interface SchedulingState {
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
}

export interface SchedulingResult extends SchedulingState {
  status: CardStatus;
  dueAt: Date;
}

/** Swappable so an FSRS implementation can replace SM-2 without touching callers. */
export interface Scheduler {
  schedule(state: SchedulingState, rating: Rating, now: Date): SchedulingResult;
}

const DAY_MS = 86_400_000;
const round2 = (n: number) => Math.round(n * 100) / 100;

function statusFor(intervalDays: number, repetitions: number): CardStatus {
  if (intervalDays >= MATURE_INTERVAL_DAYS) return 'mature';
  if (repetitions >= 2) return 'review';
  return 'learning';
}

export const sm2Scheduler: Scheduler = {
  schedule(state, rating, now) {
    let { easeFactor, repetitions, intervalDays } = state;

    if (rating === 'again') {
      repetitions = 0;
      intervalDays = 1;
      easeFactor = Math.max(MIN_EASE, easeFactor - 0.2);
    } else {
      repetitions += 1;
      const delta = rating === 'hard' ? -0.15 : rating === 'easy' ? 0.15 : 0;
      easeFactor = Math.max(MIN_EASE, easeFactor + delta);

      if (repetitions === 1) {
        intervalDays = rating === 'easy' ? 4 : 1;
      } else if (repetitions === 2) {
        intervalDays = rating === 'hard' ? 3 : rating === 'easy' ? 9 : 6;
      } else {
        const multiplier =
          rating === 'hard' ? 1.2 : rating === 'good' ? easeFactor : easeFactor * 1.3;
        intervalDays = Math.max(1, Math.round(Math.max(state.intervalDays, 1) * multiplier));
      }
    }

    easeFactor = round2(easeFactor);
    return {
      intervalDays,
      easeFactor,
      repetitions,
      status: statusFor(intervalDays, repetitions),
      dueAt: new Date(now.getTime() + intervalDays * DAY_MS),
    };
  },
};

export const scheduler: Scheduler = sm2Scheduler;

/** Short label such as "1d" / "3w" / "2mo" for the rating buttons. */
export function formatInterval(days: number): string {
  if (days < 14) return `${days}d`;
  if (days < 60) return `${Math.round(days / 7)}w`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${Math.round((days / 365) * 10) / 10}y`;
}
