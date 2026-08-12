import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import { useAppState } from '../../store/context';
import { registerCompanionVisit } from '../../store/actions';
import { useNow } from '../../hooks/useNow';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import { getMissionState, isNearMissionTime } from '../../services/mission';
import { getDaySegment } from '../../lib/date';
import {
  getCompanionBaseMood,
  getCompanionVisitKind,
  isNightSegment,
  type CompanionMood,
} from './state';
import { getStageProgress } from './evolution';
import { createMessagePicker, type CompanionMoodKey } from './messages';
import { SolinArtwork } from './visual';
import {
  AchievementBurst,
  CelebrationBurst,
  PokeBurst,
} from './animations';
import { COMPANION_EASE, breathePreset, floatPreset } from './presets';
import '../../styles/companion.css';

/** How long a transient reaction (and its bubble) stays on screen. */
const TRANSIENT_HOLD_MS = 2800;
/** Refresh idle/waiting chatter every so often to feel alive. */
const CHATTER_INTERVAL_MS = 20000;
/** Taps remain playful, but cannot spam message changes or visual bursts. */
const POKE_COOLDOWN_MS = 2200;
const SESSION_VISIT_KEY = 'project-sun:solin-session-visited';

interface CompanionProps {
  /** Show the speech bubble. */
  bubble?: boolean;
  /** Allow tap/click reactions. */
  interactive?: boolean;
  /** Extra className for layout tweaks. */
  className?: string;
  /** Override the artwork aria-label. */
  label?: string;
}

/** Decorative orbiting sparkles that scale with the evolution stage. */
function OrbitingSparkles({ count, reduceMotion }: { count: number; reduceMotion: boolean }) {
  if (count <= 0) return null;
  return (
    <div className="companion__orbit" aria-hidden="true">
      <motion.div
        className="companion__orbit-ring"
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
      >
        {Array.from({ length: count }, (_, i) => (
          <span
            key={i}
            className="companion__orbit-spark"
            style={{ transform: `rotate(${(360 / count) * i}deg) translateY(-52px)` }}
          >
            {i % 2 === 0 ? '✦' : '✧'}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/**
 * Solín, the PROJECT SUN companion. Reusable: drop it anywhere and it
 * reacts on its own to the mission state, time of day, completion,
 * achievement unlocks and taps. Visual, state, messages and animations are
 * separated in `./visual`, `./state`, `./messages` and `./animations`.
 */
export function Companion({
  bubble = true,
  interactive = true,
  className = '',
  label,
}: CompanionProps) {
  const { state, isTodayCompleted, dispatch } = useAppState();
  const now = useNow(30_000);
  const reduceMotion = usePrefersReducedMotion();

  const pickerRef = useRef<ReturnType<typeof createMessagePicker> | null>(null);
  if (pickerRef.current === null) pickerRef.current = createMessagePicker();
  const picker = pickerRef.current;

  const missionState = getMissionState(state.mission, now, isTodayCompleted);
  const segment = getDaySegment(now);
  const night = isNightSegment(segment);
  const baseMood = getCompanionBaseMood(missionState, segment);
  const nearMissionTime = isNearMissionTime(state.mission, now, isTodayCompleted);

  const stageInfo = useMemo(
    () => getStageProgress(state.progress.totalCompleted),
    [state.progress.totalCompleted],
  );

  const [transient, setTransient] = useState<CompanionMood | null>(null);
  const [message, setMessage] = useState<string>(() => picker(baseMood));
  const [messageToken, setMessageToken] = useState(0);
  const [jumpKey, setJumpKey] = useState(0);
  const [burst, setBurst] = useState<{
    type: 'celebrate' | 'achievement' | 'poke';
    token: number;
  } | null>(null);

  const burstCounter = useRef(0);
  const transientTimer = useRef<number | null>(null);
  const prevCompleted = useRef(isTodayCompleted);
  const prevStreak = useRef(state.progress.currentStreak);
  const prevUnlocks = useRef(Object.keys(state.progress.achievementUnlocks).length);
  const prevStage = useRef(stageInfo.stage.id);
  const prevNearMission = useRef(nearMissionTime);
  const visitKind = useRef(getCompanionVisitKind(state.companion, now));
  const lastPokeAt = useRef(0);
  const pokeCountRef = useRef(0);
  const baseMoodRef = useRef(baseMood);
  baseMoodRef.current = baseMood;

  useEffect(
    () => () => {
      if (transientTimer.current !== null) window.clearTimeout(transientTimer.current);
    },
    [],
  );

  const showMoodMessage = useCallback(
    (key: CompanionMoodKey) => {
      setMessage(picker(key));
      setMessageToken((t) => t + 1);
    },
    [picker],
  );

  const fireBurst = useCallback((type: 'celebrate' | 'achievement' | 'poke') => {
    burstCounter.current += 1;
    setBurst({ type, token: burstCounter.current });
  }, []);

  const startTransient = useCallback(
    (mood: CompanionMood, key: CompanionMoodKey, holdMs: number) => {
      setTransient(mood);
      showMoodMessage(key);
      if (transientTimer.current !== null) window.clearTimeout(transientTimer.current);
      transientTimer.current = window.setTimeout(() => {
        setTransient(null);
        setMessage(picker(baseMoodRef.current));
        setMessageToken((t) => t + 1);
        transientTimer.current = null;
      }, holdMs);
    },
    [picker, showMoodMessage],
  );

  // One greeting per browser session. The small memory lives in app state so
  // it survives reloads, while sessionStorage prevents duplicate greetings
  // when Solín appears on more than one screen.
  useEffect(() => {
    if (window.sessionStorage.getItem(SESSION_VISIT_KEY)) return;
    window.sessionStorage.setItem(SESSION_VISIT_KEY, '1');
    startTransient('idle', visitKind.current, 4200);
    dispatch(registerCompanionVisit());
  }, [dispatch, startTransient]);

  // React to completion, achievement unlocks and evolution, in that priority.
  useEffect(() => {
    const unlockCount = Object.keys(state.progress.achievementUnlocks).length;
    const unlocksGrew = prevUnlocks.current < unlockCount;
    const becameCompleted = !prevCompleted.current && isTodayCompleted;
    const streakGrew = prevStreak.current < state.progress.currentStreak;
    const stageGrew = prevStage.current !== stageInfo.stage.id;

    prevCompleted.current = isTodayCompleted;
    prevStreak.current = state.progress.currentStreak;
    prevUnlocks.current = unlockCount;
    prevStage.current = stageInfo.stage.id;

    if (unlocksGrew) {
      startTransient('unlocking', 'unlocking', TRANSIENT_HOLD_MS + 400);
      fireBurst('achievement');
      setJumpKey((k) => k + 1);
      return;
    }
    if (becameCompleted) {
      const streakNow = state.progress.currentStreak;
      const reaction =
        streakNow === 2 ? 'streaktwo' : streakGrew && streakNow > 1 ? 'streak' : 'celebrating';
      startTransient('celebrating', reaction, TRANSIENT_HOLD_MS);
      fireBurst('celebrate');
      setJumpKey((k) => k + 1);
      return;
    }
    if (stageGrew) {
      showMoodMessage('evolution');
      setJumpKey((k) => k + 1);
    }
  }, [
    isTodayCompleted,
    state.progress.currentStreak,
    state.progress.achievementUnlocks,
    stageInfo.stage.id,
    startTransient,
    fireBurst,
    showMoodMessage,
  ]);

  // The near window is a real mission transition, not a permanent animation:
  // one soft reaction is enough until the mission becomes available.
  useEffect(() => {
    const justBecameNear = !prevNearMission.current && nearMissionTime;
    prevNearMission.current = nearMissionTime;
    if (justBecameNear && transient === null) {
      showMoodMessage('near');
      fireBurst('poke');
      setJumpKey((key) => key + 1);
    }
  }, [nearMissionTime, transient, showMoodMessage, fireBurst]);

  // Periodic chatter while waiting so the personality stays alive. With a
  // small chance the line is one of the emotional "care" messages instead —
  // present, never spam.
  useEffect(() => {
    if (baseMood !== 'waiting' && baseMood !== 'idle') return undefined;
    const id = window.setInterval(() => {
      showMoodMessage(Math.random() < 0.08 ? 'care' : baseMoodRef.current);
    }, CHATTER_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [baseMood, showMoodMessage]);

  const handlePoke = useCallback(() => {
    if (!interactive) return;
    const elapsed = Date.now() - lastPokeAt.current;
    if (elapsed < POKE_COOLDOWN_MS) return;
    lastPokeAt.current = Date.now();

    pokeCountRef.current += 1;
    fireBurst('poke');
    setJumpKey((k) => k + 1);

    // The visual response is always immediate; the bubble is intentional
    // and asks for the night / escalation lines first.
    if (night) {
      if (Math.random() < 0.9) showMoodMessage('sleeppoke');
      return;
    }
    const pokes = pokeCountRef.current;
    if (pokes === 3 || pokes === 6 || pokes === 9) {
      showMoodMessage('pokehard');
    } else if (Math.random() < 0.7) {
      showMoodMessage('poke');
    }
  }, [interactive, night, showMoodMessage, fireBurst]);

  const mood = transient ?? baseMood;
  const { stage } = stageInfo;

  return (
    <div
      className={`companion${night ? ' companion--night' : ''}${className ? ` ${className}` : ''}`}
      style={{ '--solin-scale': stage.scale } as CSSProperties}
    >
      {bubble && (
        <div className="companion__bubble" role="status" aria-live="polite">
          <motion.p
            key={messageToken}
            className="companion__bubble-text"
            initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22, ease: COMPANION_EASE }}
          >
            {message}
          </motion.p>
        </div>
      )}

      <div className="companion__scene">
        <motion.button
          type="button"
          className="companion__stage"
          onClick={handlePoke}
          aria-label={label ?? (interactive ? 'Tocar a Solín' : 'Solín, tu mascota virtual')}
          whileTap={interactive && !reduceMotion ? { scale: 0.94 } : undefined}
        >
          {stage.aura !== 'none' && (
            <span className={`companion__aura companion__aura--${stage.aura}`} aria-hidden="true" />
          )}

          <motion.div
            className="companion__float"
            animate={reduceMotion ? undefined : floatPreset.animate}
            transition={reduceMotion ? undefined : floatPreset.transition}
          >
          <motion.div
            className="companion__breathe"
            animate={reduceMotion ? undefined : breathePreset.animate}
            transition={reduceMotion ? undefined : breathePreset.transition}
          >
            <motion.div
              className="companion__art"
              key={jumpKey}
              initial={reduceMotion ? false : { scale: 0.86, y: 0 }}
              animate={
                reduceMotion
                  ? { scale: 1 }
                  : mood === 'celebrating' || mood === 'unlocking'
                    ? { scale: [0.9, 1.1, 1], y: [0, -18, 0] }
                    : { scale: 1, y: 0 }
              }
              transition={reduceMotion ? { duration: 0.01 } : { duration: 0.9, ease: COMPANION_EASE }}
            >
              <SolinArtwork mood={mood} stage={stage} reduceMotion={reduceMotion} />
            </motion.div>
          </motion.div>
        </motion.div>

          <OrbitingSparkles count={stage.sparkles} reduceMotion={reduceMotion} />
        </motion.button>

        {burst?.type === 'celebrate' && (
          <CelebrationBurst token={burst.token} reduceMotion={reduceMotion} />
        )}
        {burst?.type === 'achievement' && (
          <AchievementBurst token={burst.token} reduceMotion={reduceMotion} />
        )}
        {burst?.type === 'poke' && <PokeBurst token={burst.token} reduceMotion={reduceMotion} />}
      </div>
    </div>
  );
}
