import { useEffect, useRef, useState } from 'react';

/**
 * Count-up animation: whenever `target` changes, eases from the previous
 * value to the new one. Returns the currently displayed value.
 * Ignores reduced-motion only via callers that skip it; safe to use with
 * short durations regardless.
 */
export function useAnimatedNumber(target: number, durationMs = 900): number {
  const [display, setDisplay] = useState(target);
  const previousRef = useRef(target);

  useEffect(() => {
    const from = previousRef.current;
    const to = target;
    if (from === to) {
      setDisplay(to);
      return;
    }

    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(from + (to - from) * eased);
      setDisplay(value);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        previousRef.current = to;
        setDisplay(to);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return display;
}
