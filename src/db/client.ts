import * as SQLite from 'expo-sqlite';

import { DATABASE_NAME, migrateDatabase } from './schema';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Shared connection for code outside the React tree (e.g. sync, notifications).
 * Screens should prefer `useSQLiteContext()` from the SQLiteProvider instead.
 */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(async (db) => {
      await migrateDatabase(db);
      return db;
    });
  }
  return dbPromise;
}
