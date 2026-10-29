import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useDataVersion } from '@/providers/DataVersionProvider';

/**
 * Loads data on focus and whenever the shared data version bumps (realtime / local writes).
 * Keeps showing the previous data while refetching so lists don't flash.
 */
export function useRefetch<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const { version } = useDataVersion();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);
  const fetchRef = useRef(fetcher);
  fetchRef.current = fetcher;

  const run = useCallback(() => {
    const id = ++seq.current;
    fetchRef.current()
      .then((d) => {
        if (id !== seq.current) return;
        setData(d);
        setError(null);
      })
      .catch((e: unknown) => {
        if (id === seq.current) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (id === seq.current) setLoading(false);
      });
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useFocusEffect(useCallback(run, [run, version, ...deps]));

  const retry = useCallback(() => {
    setLoading(true);
    run();
  }, [run]);

  return { data, error, loading, retry, reload: run };
}
