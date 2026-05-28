import { useEffect, useState, useCallback, useRef } from 'react';

// Универсальный хук - вызывает функцию-промис, складывает в state.
// Если deps меняются - перезапрашивает.
export function useFetch(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  const run = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fn();
      if (!mounted.current) return;
      setData(res?.data ?? res);
    } catch (e) {
      if (!mounted.current) return;
      setError(e);
    } finally {
      if (mounted.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mounted.current = true;
    run();
    return () => { mounted.current = false; };
  }, [run]);

  return { data, loading, error, refetch: run, setData };
}
