import { useEffect, useMemo, useRef } from "react";

/**
 * Returns a debounced version of `fn` that fires `delay`ms after the last call.
 * Used for autosaving journal text (~400ms) without UI jank. The returned
 * function carries a `flush()` to persist immediately (e.g. on blur/unmount).
 */
export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  delay = 400,
): ((...args: A) => void) & { flush: () => void } {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<A | null>(null);

  const debounced = useMemo(() => {
    const run = (...args: A) => {
      pending.current = args;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        const a = pending.current;
        pending.current = null;
        if (a) fnRef.current(...a);
      }, delay);
    };
    (run as typeof run & { flush: () => void }).flush = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      const a = pending.current;
      pending.current = null;
      if (a) fnRef.current(...a);
    };
    return run as typeof run & { flush: () => void };
  }, [delay]);

  // Flush any pending save on unmount.
  useEffect(() => () => debounced.flush(), [debounced]);

  return debounced;
}
