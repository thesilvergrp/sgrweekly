import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  status: AsyncStatus;
  data: T | undefined;
  error: unknown;
  isLoading: boolean;
  reload: () => void;
}

/**
 * Runs an async loader, cancels it on unmount or when the key changes, and
 * exposes a stable `reload`. Aborts are never surfaced as errors.
 */
export function useAsync<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  deps: unknown[],
  options: { enabled?: boolean; initialData?: T } = {},
): AsyncState<T> {
  const { enabled = true, initialData } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [error, setError] = useState<unknown>(undefined);
  const [status, setStatus] = useState<AsyncStatus>(enabled ? 'loading' : 'idle');
  const [nonce, setNonce] = useState(0);

  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      return;
    }

    const controller = new AbortController();
    let active = true;

    setStatus('loading');
    setError(undefined);

    loaderRef
      .current(controller.signal)
      .then((result) => {
        if (!active) return;
        setData(result);
        setStatus('success');
      })
      .catch((cause) => {
        if (!active || controller.signal.aborted) return;
        setError(cause);
        setStatus('error');
      });

    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, nonce, ...deps]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  return useMemo(
    () => ({ status, data, error, isLoading: status === 'loading', reload }),
    [status, data, error, reload],
  );
}
