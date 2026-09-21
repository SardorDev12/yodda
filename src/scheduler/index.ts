import { sm2Scheduler } from './sm2';
import type { Scheduler } from './types';

export type { Scheduler, SchedulerInput, SchedulerOutput } from './types';

// Single place to swap the active scheduling algorithm (e.g. for FSRS).
export const scheduler: Scheduler = sm2Scheduler;
