import { debounce } from 'lodash-es';
import { useRef, useInsertionEffect, useCallback } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay?: number,
): (...funcArgs: Parameters<T>) => ReturnType<T> {
  const ref = useRef(fn);

  useInsertionEffect(() => {
    ref.current = debounce(fn, delay) as unknown as T;
  }, [fn, delay]);

  return useCallback((...args: Parameters<T>): ReturnType<T> => {
    const f = ref.current;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return f(...args);
  }, []);
}
