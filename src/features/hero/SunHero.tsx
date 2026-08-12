import { useMemo, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { getDaySegment, type DaySegment } from '../../lib/date';
import { useNow } from '../../hooks/useNow';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';
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

const BURST_COLORS = ['#fbbf24', '#f59e0b', '#fb923c', '#fde68a', '#ffffff'];

interface SunHeroProps {
  /** True while the completion celebration runs. */
  celebrating: boolean;
  /** True while the mission is within the "near" window. */
  near?: boolean;
}

/**
 * The animated sun: glow, rotating rays, drifting particles and a burst
 * on completion. Pure visual — never blocks interaction. It owns a coarse
 * 60s clock to adapt its palette to the time of day without re-rendering
 * the rest of the page.
 */
export function SunHero({ celebrating, near = false }: SunHeroProps) {
  const reduceMotion = usePrefersReducedMotion();
  const now = useNow(60_000);
  const segment = getDaySegment(now);
  const theme = SEGMENT_THEME[segment];

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

  const burstParticles = useMemo(
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
        };
      }),
    // Rebuild once per celebration burst.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [celebrating],
  );

  const style: CSSProperties = {
    '--sun-color-light': theme.coreLight,
    '--sun-color': theme.core,
    '--sun-color-dark': theme.coreDark,
    '--sun-glow': theme.glow,
  } as CSSProperties;

  return (
    <div
      className={`sun-hero${celebrating ? ' sun-hero--celebrating' : ''}${near ? ' sun-hero--near' : ''}`}
      style={style}
      aria-hidden="true"
    >
      <div className="sun-hero__glow" />
      <div className="sun-hero__rays" />

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

      <AnimatePresence>
        {celebrating &&
          !reduceMotion &&
          burstParticles.map((p, i) => (
            <motion.span
              key={`burst-${i}`}
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
      </AnimatePresence>

      <div className="sun-hero__core">
        <div className="sun-hero__shine" />
      </div>
    </div>
  );
}
