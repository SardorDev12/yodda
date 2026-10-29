import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';

interface DataVersionValue {
  version: number;
  bump(): void;
}

const DataVersionContext = createContext<DataVersionValue>({ version: 0, bump: () => undefined });

/**
 * One shared counter. Realtime changes on books/subjects/cards (and local writes) bump it;
 * screens list `version` in their fetch deps and refetch.
 */
export function DataVersionProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [version, setVersion] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bump = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVersion((v) => v + 1), 150);
  }, []);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`data-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, bump)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, bump)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, bump)
      .subscribe();
    return () => {
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
  }, [userId, bump]);

  const value = useMemo(() => ({ version, bump }), [version, bump]);
  return <DataVersionContext.Provider value={value}>{children}</DataVersionContext.Provider>;
}

export const useDataVersion = () => useContext(DataVersionContext);
