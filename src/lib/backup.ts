import { File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';

import { ensureSubjectExists, getAllCardsForSync, listSubjects, upsertCardFromRemote } from '@/db/queries';
import type { Card, Subject } from '@/types';

const FORMAT_VERSION = 1;

interface BackupFile {
  app: 'yodda';
  formatVersion: number;
  exportedAt: string;
  subjects: Subject[];
  cards: Card[];
}

function timestampForFilename(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

/**
 * Writes every subject and card to a JSON file and opens the OS share
 * sheet so the user can save/send it anywhere (Drive, email, Bluetooth,
 * another messaging app, etc.) — enough to move data to a new phone
 * without any backend of our own.
 */
export async function exportBackup(db: SQLiteDatabase): Promise<void> {
  const [subjects, cards] = await Promise.all([listSubjects(db), getAllCardsForSync(db)]);

  const data: BackupFile = {
    app: 'yodda',
    formatVersion: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
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
  subjects: number;
  cards: number;
}

/**
 * Lets the user pick a previously exported backup file and merges it in.
 * Upserts are last-write-wins by `updatedAt`, so importing the same file
 * twice (or importing onto a phone that already has some of the same
 * cards) is safe and idempotent.
 */
export async function importBackup(db: SQLiteDatabase): Promise<ImportResult | null> {
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

  for (const subject of data.subjects) {
    await ensureSubjectExists(db, subject);
  }
  for (const card of data.cards) {
    await upsertCardFromRemote(db, card);
  }

  return { subjects: data.subjects.length, cards: data.cards.length };
}
