import { useId, useMemo, type CSSProperties, type ReactNode } from 'react';
import { motion } from 'motion/react';
import type { CompanionStage } from './evolution';
import type { CompanionMood } from './state';

/**
 * Solín's original artwork: a small round sun creature drawn entirely with
 * SVG shapes (no images, no copyrighted characters). The palette is driven
 * by CSS custom properties set on the container (`.companion`), so the day
 * and night forms are just two color sets.
 *
 * The face switches on `mood`; the body on `stage` (rays, crown, scale,
 * aura, sparkles come from the stage config in `evolution.ts`).
 */

interface SolínArtworkProps {
  mood: CompanionMood;
  stage: CompanionStage;
  reduceMotion: boolean;
}

/** Short triangle ray around the body. */
function rayPath(count: number, index: number): string {
  const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
  const tipX = 100 + Math.cos(angle) * 66;
  const tipY = 100 + Math.sin(angle) * 66;
  const b1X = 100 + Math.cos(angle - 0.14) * 50;
  const b1Y = 100 + Math.sin(angle - 0.14) * 50;
  const b2X = 100 + Math.cos(angle + 0.14) * 50;
  const b2Y = 100 + Math.sin(angle + 0.14) * 50;
  return `M ${b1X} ${b1Y} L ${tipX} ${tipY} L ${b2X} ${b2Y} Z`;
}

/** Four-point sparkle star path centered at (cx, cy). */
function starPath(cx: number, cy: number, r: number): string {
  const h = r * 0.3;
  return (
    `M ${cx} ${cy - r} ` +
    `L ${cx + h} ${cy - h} ` +
    `L ${cx + r} ${cy} ` +
    `L ${cx + h} ${cy + h} ` +
    `L ${cx} ${cy + r} ` +
    `L ${cx - h} ${cy + h} ` +
    `L ${cx - r} ${cy} ` +
    `L ${cx - h} ${cy - h} Z`
  );
}

const FILL_BOX = { transformBox: 'fill-box', transformOrigin: 'center' } as CSSProperties;

/** Gentle closed eyes + zzz, used at night while the mission waits. */
function Zzz({ reduceMotion }: { reduceMotion: boolean }) {
  const glyphs = [
    { x: 152, y: 62, size: 16, delay: 0 },
    { x: 160, y: 46, size: 13, delay: 0.3 },
    { x: 166, y: 32, size: 10, delay: 0.6 },
  ];
  return (
    <g>
      {glyphs.map((g) => (
        <motion.text
          key={g.y}
          x={g.x}
          y={g.y}
          fontSize={g.size}
          fill="var(--solin-face)"
          fontStyle="italic"
          fontWeight="800"
          animate={reduceMotion ? undefined : { y: [0, -6, 0], opacity: [0.35, 1, 0.35] }}
          transition={{
            duration: 2.2,
            delay: g.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          z
        </motion.text>
      ))}
    </g>
  );
}

/** Twinkling stars behind the night forms. */
function NightStars({ reduceMotion }: { reduceMotion: boolean }) {
  const stars = useMemo(
    () => [
      { x: 26, y: 44, r: 7, delay: 0 },
      { x: 172, y: 56, r: 5, delay: 0.8 },
      { x: 44, y: 152, r: 6, delay: 1.4 },
      { x: 158, y: 146, r: 5, delay: 0.4 },
      { x: 186, y: 102, r: 4, delay: 1.8 },
    ],
    [],
  );
  return (
    <g>
      {stars.map((s, i) => (
        <motion.path
          key={i}
          d={starPath(s.x, s.y, s.r)}
          fill="var(--solin-star)"
          animate={reduceMotion ? undefined : { opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 2.4, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </g>
  );
}

/** Legendary crown. */
function Crown() {
  return (
    <g>
      <path
        d="M76 56 L76 38 L88 48 L100 32 L112 48 L124 38 L124 56 Z"
        fill="var(--solin-crown)"
        stroke="var(--solin-crown-dark)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="100" cy="44" r="3.2" fill="#f87171" />
    </g>
  );
}

/** Sleeping cap for the `resting` form. */
function NightCap() {
  return (
    <g>
      <path
        d="M72 68 Q78 40 100 30 Q122 40 128 68 Q116 80 100 81 Q84 80 72 68 Z"
        fill="var(--solin-cap)"
      />
      <circle cx="100" cy="30" r="7" fill="#f8fafc" />
    </g>
  );
}

/** Open eyes that blink every few seconds. */
function OpenEyes({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <motion.g
      style={FILL_BOX}
      animate={reduceMotion ? undefined : { scaleY: [1, 1, 0.12, 1, 1] }}
      transition={{ duration: 4.8, times: [0, 0.44, 0.48, 0.53, 1], repeat: Infinity, ease: 'easeInOut' }}
    >
      <circle cx="82" cy="97" r="6" fill="var(--solin-face)" />
      <circle cx="118" cy="97" r="6" fill="var(--solin-face)" />
      <circle cx="84" cy="95" r="2.2" fill="#fff" />
      <circle cx="120" cy="95" r="2.2" fill="#fff" />
    </motion.g>
  );
}

/** Happy "∩" eyes. */
function HappyEyes() {
  return (
    <g>
      <path d="M72 96 Q82 86 92 96" stroke="var(--solin-face)" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M108 96 Q118 86 128 96" stroke="var(--solin-face)" strokeWidth="5" fill="none" strokeLinecap="round" />
    </g>
  );
}

/** Closed sleepy eyes. */
function RestingEyes() {
  return (
    <g>
      <path d="M76 99 Q82 92 88 99" stroke="var(--solin-face)" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M112 99 Q118 92 124 99" stroke="var(--solin-face)" strokeWidth="4" fill="none" strokeLinecap="round" />
    </g>
  );
}

/** Star-shaped sparkle eyes for achievement unlock. */
function StarEyes() {
  return (
    <g fill="var(--solin-face)">
      <path d={starPath(82, 96, 8)} />
      <path d={starPath(118, 96, 8)} />
    </g>
  );
}

/** Face parts selected by mood. */
function Face({ mood, reduceMotion }: { mood: CompanionMood; reduceMotion: boolean }) {
  let eyes: ReactNode;
  switch (mood) {
    case 'happy':
    case 'celebrating':
      eyes = <HappyEyes />;
      break;
    case 'resting':
      eyes = <RestingEyes />;
      break;
    case 'unlocking':
      eyes = <StarEyes />;
      break;
    default:
      eyes = <OpenEyes reduceMotion={reduceMotion} />;
  }

  let mouth: React.ReactNode;
  switch (mood) {
    case 'celebrating':
      mouth = <path d="M83 113 Q100 144 117 113 Z" fill="var(--solin-face)" />;
      break;
    case 'happy':
    case 'unlocking':
      mouth = <path d="M86 115 Q100 141 114 115 Z" fill="var(--solin-face)" />;
      break;
    case 'resting':
      mouth = <ellipse cx="100" cy="126" rx="3.5" ry="4.5" fill="var(--solin-face)" />;
      break;
    case 'waiting':
      mouth = <path d="M92 119 Q100 125 108 119" stroke="var(--solin-face)" strokeWidth="4.5" fill="none" strokeLinecap="round" />;
      break;
    default:
      mouth = <path d="M90 117 Q100 126 110 117" stroke="var(--solin-face)" strokeWidth="4.5" fill="none" strokeLinecap="round" />;
  }

  return (
    <g>
      {eyes}
      {mouth}
      {mood === 'waiting' && (
        <motion.path
          d="M136 74 Q141 86 136 91 Q131 86 136 74 Z"
          fill="#7dd3fc"
          style={FILL_BOX}
          animate={reduceMotion ? undefined : { scale: [1, 1.12, 1] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {mood === 'resting' && <Zzz reduceMotion={reduceMotion} />}
    </g>
  );
}

const blushActive = (mood: CompanionMood): boolean =>
  mood === 'happy' || mood === 'celebrating' || mood === 'night';

/** The full Solín artwork: aura-less SVG creature + face + stage extras. */
export function SolinArtwork({ mood, stage, reduceMotion }: SolínArtworkProps) {
  const gradientId = `solin-core-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const rays = useMemo(
    () => Array.from({ length: stage.rays }, (_, i) => rayPath(stage.rays, i)),
    [stage.rays],
  );

  return (
    <svg
      className="solin-svg"
      viewBox="0 0 200 200"
      role="img"
      aria-label="Solín, tu mascota virtual"
    >
      <defs>
        <radialGradient id={gradientId} cx="34%" cy="30%" r="80%">
          <stop offset="0%" stopColor="var(--solin-core-light)" />
          <stop offset="55%" stopColor="var(--solin-core)" />
          <stop offset="100%" stopColor="var(--solin-core-dark)" />
        </radialGradient>
      </defs>

      {(mood === 'night' || mood === 'resting') && (
        <NightStars reduceMotion={reduceMotion} />
      )}

      {rays.map((d, i) => (
        <path key={i} d={d} fill="var(--solin-core)" opacity="0.9" />
      ))}

      <circle
        cx="100"
        cy="100"
        r="46"
        fill={`url(#${gradientId})`}
        stroke="var(--solin-core-dark)"
        strokeWidth="3"
      />

      <ellipse
        cx="84"
        cy="82"
        rx="17"
        ry="11"
        fill="rgba(255, 255, 255, 0.35)"
        transform="rotate(-18 84 82)"
      />

      {(stage.blush || blushActive(mood)) && (
        <g fill="var(--solin-blush)" opacity="0.6">
          <circle cx="74" cy="110" r="6" />
          <circle cx="126" cy="110" r="6" />
        </g>
      )}

      <Face mood={mood} reduceMotion={reduceMotion} />

      {stage.crown && <Crown />}
      {mood === 'resting' && <NightCap />}
    </svg>
  );
}
