import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  getDaySegment,
  msUntil,
  toDateKey,
  type DaySegment,
} from '../../lib/date';
import type { DateKey } from '../../types';
import { useNow } from '../../hooks/useNow';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import { useAppState } from '../../store/context';
import { getMissionState } from '../../services/mission';
import { pickRandom, randomRange } from '../../lib/random';
import '../../styles/sun.css';

interface SunTheme {
  coreLight: string;
  core: string;
  coreDark: string;
  glow: string;
}

/** The sun adapts its palette to the time of day; at night it becomes a warm moon. */
const SEGMENT_THEME: Record<DaySegment, SunTheme> = {
  dawn: {
    coreLight: '#fef3c7',
    core: '#fbbf24',
    coreDark: '#d97706',
    glow: 'rgba(251, 191, 36, 0.5)',
  },
  day: {
    coreLight: '#fef9c3',
    core: '#f59e0b',
    coreDark: '#b45309',
    glow: 'rgba(245, 158, 11, 0.6)',
  },
  dusk: {
    coreLight: '#fed7aa',
    core: '#fb923c',
    coreDark: '#c2410c',
    glow: 'rgba(251, 146, 60, 0.55)',
  },
  night: {
    coreLight: '#fff3d2',
    core: '#fcd87f',
    coreDark: '#d9a545',
    glow: 'rgba(252, 216, 127, 0.5)',
  },
};

/** Base "aliveness" per day segment (reuses the existing time system). */
const SEGMENT_INTENSITY: Record<DaySegment, number> = {
  dawn: 0.52,
  day: 0.7,
  dusk: 0.4,
  night: 0.1,
};

/** How many minutes before the scheduled hour the sun starts intensifying. */
const INTENSE_WINDOW_MIN = 60;
/** How long the "ES HORA" reaction plays (≈1.5s). */
const HORA_MS = 1600;
/** How long the tap/hold kick pulse plays. */
const KICK_MS = 700;

const BURST_COLORS = ['#fbbf24', '#f59e0b', '#fb923c', '#fde68a', '#ffffff'];
const HORA_COLORS = ['#fff7d6', '#ffe28a', '#ffb84d', '#ffd9a0', '#ffffff'];
const KICK_COLORS = ['#ffe9a8', '#ffc46b', '#ffffff'];

interface SunHeroProps {
  /** True while the completion celebration runs. */
  celebrating: boolean;
  /** True while the mission is within the "near" window. */
  near?: boolean;
  /** Increment to replay the tap/hold kick pulse. */
  kickKey?: number;
}

interface BurstParticle {
  angle: number;
  distance: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
}

interface Flare {
  id: number;
  angle: number;
  size: number;
  height: number;
  duration: number;
  delay: number;
  base: number;
}

/** Clamp the visual intensity to a safe, readable range. */
function clampIntensity(n: number): number {
  return Math.min(1, Math.max(0.06, n));
}

/**
 * 0..1 — how "alive" the sun feels right now. Built on the existing clock
 * and the mission's own scheduled time: calm at dawn, bright at day, a slow
 * ramp over the last hour before the mission becomes available, then quiet
 * through dusk and night. Pure math — no second time system.
 */
function sunIntensity(now: Date, scheduledTime: string): number {
  let intensity = SEGMENT_INTENSITY[getDaySegment(now)];
  const remainingMs = msUntil(scheduledTime, now);
  const windowMs = INTENSE_WINDOW_MIN * 60_000;
  if (remainingMs > 0 && remainingMs <= windowMs) {
    intensity += (1 - remainingMs / windowMs) * 0.32;
  } else if (remainingMs === 0) {
    intensity += 0.32;
  }
  return clampIntensity(intensity);
}

/** Radial burst of warm particles used by every reaction. */
function SunBurst({ particles, token }: { particles: BurstParticle[]; token: number }) {
  return (
    <>
      {particles.map((p, i) => (
        <motion.span
          key={`${token}-${i}`}
          className="sun-hero__burst"
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
          animate={{
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
            opacity: [0, 1, 1, 0],
            scale: 1,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
          style={{ width: p.size, height: p.size, background: p.color }}
        />
      ))}
    </>
  );
}

/**
 * The living sun: a layered, code-first star with a deep core, breathing
 * coronas, slow rays, organic flares and a wide halo that spills light down
 * onto Solín's valley. It owns a coarse 1s clock to adapt to the hour, and
 * reacts to the mission hour ("ES HORA"), the completion celebration and
 * taps/holds. Purely visual — never blocks interaction.
 */
export function SunHero({ celebrating, near = false, kickKey = 0 }: SunHeroProps) {
  const { state, isTodayCompleted } = useAppState();
  const reduceMotion = usePrefersReducedMotion();
  const now = useNow(1000);

  const segment = getDaySegment(now);
  const theme = SEGMENT_THEME[segment];
  const intensity = sunIntensity(now, state.mission.scheduledTime);
  const missionState = getMissionState(state.mission, now, isTodayCompleted);
  const todayKey = toDateKey(now);

  // "ES HORA" — the moment the mission becomes available. Guarded in render
  // (React's official "adjust state when props change" pattern) so it fires
  // once per day without effect races.
  const horaFiredRef = useRef<DateKey | null>(null);
  const [horaActive, setHoraActive] = useState(false);
  const [horaToken, setHoraToken] = useState(0);

  if (!reduceMotion && missionState === 'available' && horaFiredRef.current !== todayKey) {
    horaFiredRef.current = todayKey;
    setHoraToken((t) => t + 1);
    setHoraActive(true);
  }

  useEffect(() => {
    if (!horaActive) return;
    const id = window.setTimeout(() => setHoraActive(false), HORA_MS);
    return () => window.clearTimeout(id);
  }, [horaActive, horaToken]);

  // Tap / hold kick pulse (driven by SunScene).
  const [kickActive, setKickActive] = useState(false);

  useEffect(() => {
    if (kickKey === 0 || reduceMotion) return;
    setKickActive(true);
  }, [kickKey, reduceMotion]);

  useEffect(() => {
    if (!kickActive) return;
    const id = window.setTimeout(() => setKickActive(false), KICK_MS);
    return () => window.clearTimeout(id);
  }, [kickActive]);

  const ambientParticles = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        id: i,
        x: `${pickRandom([8, 20, 78, 90, 12, 88, 26, 74])}%`,
        y: `${pickRandom([10, 16, 22, 70, 78, 84, 30, 62])}%`,
        size: pickRandom([4, 5, 6, 7, 8]),
        duration: randomRange(3.5, 6.5),
        delay: randomRange(0, 2),
        floatX: randomRange(-10, 10),
        floatY: randomRange(-12, 6),
      })),
    // Regenerate only when the day segment changes (palette shift).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [segment],
  );

  const flares = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const angle = (360 / 6) * i + randomRange(-15, 15);
        return {
          id: i,
          angle,
          size: randomRange(7, 11),
          height: randomRange(24, 38),
          duration: randomRange(8, 14),
          delay: randomRange(0, 4),
          base: randomRange(0.55, 0.9),
        } satisfies Flare;
      }),
    // Regenerate only when the day segment changes so IDs stay stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [segment],
  );

  const celebrationParticles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const angle = (Math.PI * 2 * i) / 14 + randomRange(-0.15, 0.15);
        const distance = randomRange(70, 130);
        return {
          angle,
          distance,
          size: randomRange(5, 11),
          color: pickRandom(BURST_COLORS),
          delay: randomRange(0, 0.08),
          duration: randomRange(0.7, 1.15),
        } satisfies BurstParticle;
      }),
    // Rebuild once per celebration burst.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [celebrating],
  );

  const horaParticles = useMemo(() => {
    if (horaToken === 0) return [];
    return Array.from({ length: 12 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 12 + randomRange(-0.14, 0.14);
      const distance = randomRange(115, 180);
      return {
        angle,
        distance,
        size: randomRange(4, 8),
        color: pickRandom(HORA_COLORS),
        delay: randomRange(0.1, 0.5),
        duration: randomRange(0.85, 1.3),
      } satisfies BurstParticle;
    });
  }, [horaToken]);

  const kickParticles = useMemo(() => {
    if (kickKey === 0) return [];
    return Array.from({ length: 7 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 7 + randomRange(-0.2, 0.2);
      const distance = randomRange(55, 100);
      return {
        angle,
        distance,
        size: randomRange(3, 6),
        color: pickRandom(KICK_COLORS),
        delay: randomRange(0, 0.12),
        duration: randomRange(0.5, 0.8),
      } satisfies BurstParticle;
    });
  }, [kickKey]);

  const style = {
    '--sun-color-light': theme.coreLight,
    '--sun-color': theme.core,
    '--sun-color-dark': theme.coreDark,
    '--sun-glow': theme.glow,
    '--sun-intensity': intensity.toFixed(3),
  } as CSSProperties;

  const className = [
    'sun-hero',
    celebrating ? 'sun-hero--celebrating' : '',
    near ? 'sun-hero--near' : '',
    horaActive && !reduceMotion ? 'sun-hero--hora' : '',
    kickActive && !reduceMotion ? 'sun-hero--kick' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className} style={style} aria-hidden="true">
      <div className="sun-hero__halo" />
      <div className="sun-hero__pool" />
      <div className="sun-hero__glow" />

      <div className="sun-hero__corona sun-hero__corona--outer" />
      <div className="sun-hero__corona sun-hero__corona--mid" />
      <div className="sun-hero__corona sun-hero__corona--inner" />

      <div className="sun-hero__rays" />
      <div className="sun-hero__rays sun-hero__rays--reverse" />

      <div className="sun-hero__flares">
        {flares.map((f) => (
          <div
            key={f.id}
            className="sun-hero__flare"
            style={
              {
                '--flare-angle': `${f.angle}deg`,
              } as CSSProperties
            }
          >
            <div
              className="sun-hero__flare-body"
              style={
                {
                  '--flare-size': `${f.size}px`,
                  '--flare-height': `${f.height}px`,
                  '--flare-duration': `${f.duration}s`,
                  '--flare-delay': `${f.delay}s`,
                  '--flare-base': `${f.base}`,
                } as CSSProperties
              }
            />
          </div>
        ))}
      </div>

      {ambientParticles.map((p) => (
        <span
          key={p.id}
          className="sun-hero__particle"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            '--float-duration': `${p.duration}s`,
            '--float-delay': `${p.delay}s`,
            '--float-x': `${p.floatX}px`,
            '--float-y': `${p.floatY}px`,
          } as CSSProperties}
        />
      ))}

      <div className="sun-hero__core">
        <div className="sun-hero__texture" />
        <div className="sun-hero__shine" />
        <div className="sun-hero__inner-glow" />
        <div className="sun-hero__rim" />
      </div>

      <div className="sun-hero__pulse" />

      <AnimatePresence>
        {celebrating && !reduceMotion && (
          <SunBurst key="celebration" particles={celebrationParticles} token={0} />
        )}
        {horaActive && !reduceMotion && (
          <SunBurst key={`hora-${horaToken}`} particles={horaParticles} token={horaToken} />
        )}
        {kickActive && !reduceMotion && (
          <SunBurst key={`kick-${kickKey}`} particles={kickParticles} token={kickKey} />
        )}
      </AnimatePresence>
    </div>
  );
}
