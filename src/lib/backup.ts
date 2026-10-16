import { File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';

import { getAllBooks, getAllCards, getAllSubjects, upsertBook, upsertCard, upsertSubject } from '@/db/queries';
import type { Book, Card, Subject } from '@/types';

const FORMAT_VERSION = 2;

interface BackupFile {
  app: 'yodda';
  formatVersion: number;
  exportedAt: string;
  books: Book[];
  subjects: Subject[];
  cards: Card[];
}

function timestampForFilename(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

/**
 * Writes every book/subject/card to a JSON file and opens the OS share
 * sheet — a manual, portable snapshot of the cloud data (e.g. to move
 * into a different account, or just keep an offline copy), separate
 * from the automatic cross-device sync that already happens via Supabase.
 */
export async function exportBackup(userId: string): Promise<void> {
  const [books, subjects, cards] = await Promise.all([getAllBooks(userId), getAllSubjects(userId), getAllCards(userId)]);

  const data: BackupFile = {
    app: 'yodda',
    formatVersion: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    books,
    subjects,
    cards,
  };

  const file = new File(Paths.cache, `yodda-backup-${timestampForFilename()}.json`);
  if (file.exists) file.delete();
  file.write(JSON.stringify(data, null, 2));

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Yodda backup',
  });
}

export interface ImportResult {
  books: number;
  subjects: number;
  cards: number;
}

/**
 * Lets the user pick a previously exported backup file and merges it into
 * their account. Upserts are last-write-wins by `updatedAt`, so importing
 * the same file twice, or onto an account that already has some of the
 * same cards, is safe and idempotent.
 */
export async function importBackup(userId: string): Promise<ImportResult | null> {
  const picked = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
  if (picked.canceled || !picked.assets[0]) return null;

  const file = new File(picked.assets[0].uri);
  const text = await file.text();

  let data: BackupFile;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('invalid-json');
  }
  if (data.app !== 'yodda' || !Array.isArray(data.subjects) || !Array.isArray(data.cards)) {
    throw new Error('not-a-yodda-backup');
  }

  for (const book of data.books ?? []) {
    await upsertBook(userId, book);
  }
  for (const subject of data.subjects) {
    await upsertSubject(userId, subject.bookId ? subject : { ...subject, bookId: 'general-book' });
  }
  for (const card of data.cards) {
    await upsertCard(userId, card);
  }

  return { books: data.books?.length ?? 0, subjects: data.subjects.length, cards: data.cards.length };
}
