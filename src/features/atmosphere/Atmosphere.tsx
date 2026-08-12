import { useMemo, type CSSProperties } from 'react';
import type { DaySegment } from '../../lib/date';
import { randomRange } from '../../lib/random';
import '../../styles/atmosphere.css';

/**
 * The living sky of the Home. A full-bleed backdrop that answers to the
 * time of day: segment palettes, a star field at night, soft drifting
 * motes during the day, a warm build-up near the mission hour and a gold
 * flash each time the mission is completed. Purely decorative and never
 * interactive — everything sits behind the page content.
 */

interface SkyTone {
  top: string;
  mid: string;
  bottom: string;
  warm: string;
  star: string | null;
  mote: boolean;
}

const SKY_TONES: Record<DaySegment, SkyTone> = {
  dawn: {
    top: '#8ec0ee',
    mid: '#d8ecff',
    bottom: '#ffe9c4',
    warm: 'rgba(255, 214, 140, 0.55)',
    star: null,
    mote: true,
  },
  day: {
    top: '#4fa9ec',
    mid: '#b8def9',
    bottom: '#fff2d2',
    warm: 'rgba(255, 214, 130, 0.7)',
    star: null,
    mote: true,
  },
  dusk: {
    top: '#5a48b8',
    mid: '#ffb076',
    bottom: '#ffd9a2',
    warm: 'rgba(255, 176, 118, 0.65)',
    star: null,
    mote: true,
  },
  night: {
    top: '#080d26',
    mid: '#1b2350',
    bottom: '#38336e',
    warm: 'rgba(252, 216, 124, 0.18)',
    star: '#fef7d8',
    mote: false,
  },
};

interface AtmosphereProps {
  segment: DaySegment;
  /** Within the "near" window of the mission — the sky starts to warm. */
  near: boolean;
  /** Increment to replay the completion flash. */
  celebrationToken: number;
}

export function Atmosphere({
  segment,
  near,
  celebrationToken,
}: AtmosphereProps) {
  const tone = SKY_TONES[segment];

  const stars = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        left: randomRange(2, 98),
        top: randomRange(4, 62),
        size: randomRange(1.5, 3),
        delay: randomRange(0, 3),
        duration: randomRange(2.2, 4.5),
      })),
    [],
  );

  const motes = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        left: randomRange(4, 96),
        top: randomRange(6, 70),
        size: randomRange(10, 22),
        delay: randomRange(0, 2.5),
        duration: randomRange(9, 16),
        dx: randomRange(-26, 26),
      })),
    [],
  );

  const style = {
    '--atmo-top': tone.top,
    '--atmo-mid': tone.mid,
    '--atmo-bottom': tone.bottom,
    '--atmo-warm': tone.warm,
    ...(tone.star ? { '--atmo-star': tone.star } : {}),
  } as CSSProperties;

  return (
    <div
      className={`atmo atmo--${segment}${near ? ' atmo--warming' : ''}`}
      style={style}
      aria-hidden="true"
    >
      <div className="atmo__sky" />
      <div className="atmo__haze" />

      {tone.star &&
        stars.map((s) => (
          <span
            key={s.id}
            className="atmo__star"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              '--twinkle-duration': `${s.duration}s`,
              '--twinkle-delay': `${s.delay}s`,
            } as CSSProperties}
          />
        ))}

      {tone.mote &&
        motes.map((m) => (
          <span
            key={m.id}
            className="atmo__mote"
            style={{
              left: `${m.left}%`,
              top: `${m.top}%`,
              width: m.size,
              height: m.size,
              '--mote-duration': `${m.duration}s`,
              '--mote-delay': `${m.delay}s`,
              '--mote-dx': `${m.dx}px`,
            } as CSSProperties}
          />
        ))}

      <div className="atmo__ground" />

      {celebrationToken > 0 && (
        <span key={celebrationToken} className="atmo__flash" />
      )}
    </div>
  );
}