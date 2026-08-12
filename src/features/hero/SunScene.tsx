import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import { pickRandom } from '../../lib/random';
import { SunHero } from './SunHero';

const HOLD_MS = 650;
const NOTE_HOLD_MS = 2000;
const TAP_COOLDOWN_MS = 1400;

const HOLD_LINES = [
  '¿Qué estás haciendo? 😊',
  'El sol no se apura. ☀️',
  '¿Le diste al sol? Vale. 🔆',
];

const TAP_LINES = [
  'También tenés a Solín para eso 😄',
  '¿El sol? Buen gusto. 🌞',
  'Sigo arriba. Como siempre. ☀️',
];

interface SunSceneProps {
  /** True while the completion celebration runs. */
  celebrating: boolean;
  /** True while the mission is within the "near" window. */
  near: boolean;
}

/**
 * The sun as a small interactive surprise inside the Home scene: hold it
 * to get a reaction, tap it lightly for another. Purely optional — the
 * sun stays a gentle part of the world and never demands attention.
 */
export function SunScene({ celebrating, near }: SunSceneProps) {
  const reduceMotion = usePrefersReducedMotion();
  const [note, setNote] = useState<string | null>(null);
  const [token, setToken] = useState(0);

  const holdTimer = useRef<number | null>(null);
  const noteTimer = useRef<number | null>(null);
  const heldRef = useRef(false);
  const lastTapAt = useRef(0);

  useEffect(
    () => () => {
      if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
      if (noteTimer.current !== null) window.clearTimeout(noteTimer.current);
    },
    [],
  );

  const showNote = useCallback((line: string) => {
    setNote(line);
    setToken((t) => t + 1);
    if (noteTimer.current !== null) window.clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => setNote(null), NOTE_HOLD_MS);
  }, []);

  const clearHold = useCallback(() => {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }, []);

  const handlePointerDown = useCallback(() => {
    if (reduceMotion) return;
    heldRef.current = false;
    clearHold();
    holdTimer.current = window.setTimeout(() => {
      heldRef.current = true;
      showNote(pickRandom(HOLD_LINES));
    }, HOLD_MS);
  }, [clearHold, reduceMotion, showNote]);

  const handleClick = useCallback(() => {
    if (heldRef.current) return;
    const now = Date.now();
    if (now - lastTapAt.current < TAP_COOLDOWN_MS) return;
    lastTapAt.current = now;
    showNote(pickRandom(TAP_LINES));
    (document.activeElement as HTMLElement | null)?.blur();
  }, [showNote]);

  return (
    <motion.button
      type="button"
      className={`sun-scene${celebrating ? ' sun-scene--celebrating' : ''}${near ? ' sun-scene--near' : ''}`}
      aria-label="El sol de la escena. Se puede tocar."
      onPointerDown={handlePointerDown}
      onPointerUp={clearHold}
      onPointerLeave={clearHold}
      onPointerCancel={clearHold}
      onClick={handleClick}
      whileTap={!reduceMotion ? { scale: 0.96 } : undefined}
      transition={{ type: 'spring', stiffness: 320, damping: 17 }}
    >
      <SunHero celebrating={celebrating} near={near} />

      <AnimatePresence>
        {note && (
          <motion.span
            key={token}
            className="sun-scene__note"
            role="status"
            aria-live="polite"
            initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.86 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
          >
            {note}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}