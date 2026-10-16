import type { RealtimeChannel } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';

interface DataContextValue {
  /** Bumps whenever books/subjects/cards change for this user, on this
   * device or another. Screens depend on it in their fetch effects so a
   * realtime push triggers an immediate refetch — this is what keeps
   * mobile and web in sync, since there is no local copy of the data. */
  version: number;
}

const DataContext = createContext<DataContextValue>({ version: 0 });

export function DataProvider({ userId, children }: { userId: string | null; children: ReactNode }) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!supabase || !userId) return;
    const bump = () => setVersion((v) => v + 1);
    const channels: RealtimeChannel[] = [
      supabase
        .channel(`data-books-${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'books', filter: `user_id=eq.${userId}` }, bump)
        .subscribe(),
      supabase
        .channel(`data-subjects-${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects', filter: `user_id=eq.${userId}` }, bump)
        .subscribe(),
      supabase
        .channel(`data-cards-${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cards', filter: `user_id=eq.${userId}` }, bump)
        .subscribe(),
    ];
    return () => {
      for (const channel of channels) supabase!.removeChannel(channel);
    };
  }, [userId]);

  return <DataContext.Provider value={{ version }}>{children}</DataContext.Provider>;
}

export function useDataVersion(): number {
  return useContext(DataContext).version;
}
