export type CardStatus = 'new' | 'learning' | 'review' | 'mature';

export type Rating = 'again' | 'hard' | 'good' | 'easy';

export interface Subject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  id: string;
  subjectId: string;
  question: string;
  answer: string;
  status: CardStatus;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  dueAt: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
}

export interface ReviewLogEntry {
  id: string;
  cardId: string;
  rating: Rating;
  reviewedAt: string;
  intervalDaysBefore: number;
  intervalDaysAfter: number;
}

export interface SubjectWithCounts extends Subject {
  totalCards: number;
  dueToday: number;
  newCards: number;
}
