import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import {
  RARITY_META,
  getAchievement,
  type AchievementDef,
} from '../../config/achievements';
import { useAppState } from '../../store/context';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import '../../styles/achievements.css';

const OVERLAY_HOLD_MS = 4200;

/** Radial star burst around the icon, keyed to replay on every unlock. */
function UnlockBurst({ token, reduceMotion }: { token: number; reduceMotion: boolean }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const angle = (Math.PI * 2 * i) / 12 + (i % 3) * 0.18;
        return {
          angle,
          distance: 64 + (i % 4) * 18,
          size: 14 + (i % 3) * 6,
          delay: (i % 5) * 0.045,
        };
      }),
    // Rebuild once per unlock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token],
  );

  if (token === 0 || reduceMotion) return null;

  return (
    <div className="ach-overlay__bursts" aria-hidden="true">
      {particles.map((p, i) => (
        <motion.span
          key={`${token}-${i}`}
          className="ach-overlay__burst-star"
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.2, rotate: -30 }}
          animate={{
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
            opacity: [0, 1, 1, 0],
            scale: 1,
            rotate: 22,
          }}
          transition={{ duration: 1.15, delay: p.delay, ease: 'easeOut' }}
          style={{ fontSize: p.size }}
        >
          ✦
        </motion.span>
      ))}
    </div>
  );
}

/**
 * Full-screen overlay that plays whenever an achievement unlocks during the
 * session: overlay → animation → icon → title → description → +XP. Multiple
 * unlocks queue up and are shown one at a time. Unlocks that happened before
 * the app loaded (e.g. a migration) are registered silently.
 */
export function AchievementUnlockHost() {
  const { state } = useAppState();
  const reduceMotion = usePrefersReducedMotion();

  const [current, setCurrent] = useState<AchievementDef | null>(null);
  const [burstToken, setBurstToken] = useState(0);

  const seenRef = useRef<Set<string> | null>(null);
  const queueRef = useRef<string[]>([]);
  const timerRef = useRef<number | null>(null);
  const currentRef = useRef<AchievementDef | null>(null);
  currentRef.current = current;

  const advance = useCallback(() => {
    const nextId = queueRef.current.shift();
    if (!nextId) {
      setCurrent(null);
      return;
    }
    const def = getAchievement(nextId);
    if (!def) {
      advance();
      return;
    }
    setCurrent(def);
    setBurstToken((t) => t + 1);
  }, []);

  const dismiss = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setCurrent(null);
  }, []);

  // Detect new unlocks. The first run only records the already-unlocked ids
  // (retroactive unlocks from storage/migration never play the animation).
  useEffect(() => {
    const keys = Object.keys(state.progress.achievementUnlocks);
    let seen = seenRef.current;
    if (seen === null) {
      seen = new Set(keys);
      seenRef.current = seen;
      return;
    }
    const fresh = keys.filter((id) => !seen.has(id));
    for (const id of fresh) seen.add(id);
    if (fresh.length === 0) return;
    queueRef.current.push(...fresh);
    if (currentRef.current === null) advance();
  }, [state.progress.achievementUnlocks, advance]);

  // Auto-advance to the next queued unlock once the current one closes.
  useEffect(() => {
    if (current === null && queueRef.current.length > 0) advance();
  }, [current, advance]);

  // Auto-dismiss the visible overlay.
  useEffect(() => {
    if (current === null) return undefined;
    const id = window.setTimeout(dismiss, OVERLAY_HOLD_MS);
    timerRef.current = id;
    return () => window.clearTimeout(id);
  }, [current, dismiss]);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  return (
    <AnimatePresence>
      {current !== null && (
        <UnlockOverlay
          def={current}
          burstToken={burstToken}
          reduceMotion={reduceMotion}
          onDismiss={dismiss}
        />
      )}
    </AnimatePresence>
  );
}

interface UnlockOverlayProps {
  def: AchievementDef;
  burstToken: number;
  reduceMotion: boolean;
  onDismiss: () => void;
}

function UnlockOverlay({ def, burstToken, reduceMotion, onDismiss }: UnlockOverlayProps) {
  const Icon = def.icon;
  const meta = RARITY_META[def.rarity];

  return (
    <motion.div
      className="ach-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Logro desbloqueado: ${def.title}`}
      onClick={onDismiss}
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, transition: { duration: 0.2 } }}
    >
      <motion.div
        className="ach-overlay__card"
        onClick={(event) => event.stopPropagation()}
        initial={
          reduceMotion
            ? { opacity: 1 }
            : { scale: 0.6, y: 24, opacity: 0 }
        }
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={reduceMotion ? { opacity: 0 } : { scale: 0.85, opacity: 0 }}
        transition={
          reduceMotion
            ? { duration: 0.01 }
            : { type: 'spring', stiffness: 260, damping: 18 }
        }
      >
        <span className={`ach-overlay__rarity ${meta.className}`}>{meta.label}</span>

        <div className="ach-overlay__icon-wrap">
          <UnlockBurst token={burstToken} reduceMotion={reduceMotion} />
          <motion.span
            className={`ach-overlay__icon ${meta.className}`}
            initial={reduceMotion ? false : { scale: 0.3, rotate: -18 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={reduceMotion ? { duration: 0.01 } : { type: 'spring', stiffness: 300, damping: 12, delay: 0.1 }}
          >
            <Icon size={40} aria-hidden="true" />
          </motion.span>
        </div>

        <motion.p
          className="ach-overlay__heading"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0.01 } : { delay: 0.18, duration: 0.3 }}
        >
          ¡LOGRO DESBLOQUEADO!
        </motion.p>

        <motion.h3
          className="ach-overlay__title"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0.01 } : { delay: 0.28, duration: 0.3 }}
        >
          {def.title}
        </motion.h3>

        <motion.p
          className="ach-overlay__desc"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0.01 } : { delay: 0.38, duration: 0.3 }}
        >
          {def.description}
        </motion.p>

        <motion.span
          className="ach-overlay__xp"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={reduceMotion ? { duration: 0.01 } : { delay: 0.5, type: 'spring', stiffness: 320, damping: 14 }}
        >
          <Sparkles size={14} aria-hidden="true" />
          +{def.xp} XP
        </motion.span>

        <p className="ach-overlay__hint">Tocá para continuar</p>
      </motion.div>
    </motion.div>
  );
}
