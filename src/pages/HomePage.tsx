import { useState } from 'react';
import { motion } from 'motion/react';
import { useAppState } from '../store/context';
import { useNow } from '../hooks/useNow';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';
import { getDaySegment, greeting } from '../lib/date';
import { isNearMissionTime } from '../services/mission';
import { LiveClock } from '../components/ui/LiveClock';
import { Atmosphere } from '../features/atmosphere/Atmosphere';
import { SunScene } from '../features/hero/SunScene';
import { Companion } from '../features/companion/Companion';
import { MissionHero } from '../features/mission/MissionHero';

/** Brand + greeting + the live clock. Only the clock ticks every second. */
function HomeHeader() {
  const { state } = useAppState();
  const reduceMotion = usePrefersReducedMotion();
  const now = useNow(60_000);

  return (
    <motion.header
      className="scene-top"
      initial={reduceMotion ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div>
        <p className="scene-brand">PROJECT SUN</p>
        <p className="scene-greet">
          {greeting(now)}, {state.settings.userName}
        </p>
      </div>
      <LiveClock />
    </motion.header>
  );
}

/**
 * The whole Home is one living scene, from the sky down to the mission:
 *
 *   cielo / atmósfera → sol → Solín → misión
 *
 * The atmosphere fills the viewport and answers to the hour. Solín is the
 * character; the mission is the one thing to do; the streak is felt as
 * progress, not as a grid of numbers. Everything else lives behind the
 * existing navigation and stays out of the stage.
 */
export function HomePage() {
  const { state, isTodayCompleted } = useAppState();
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationToken, setCelebrationToken] = useState(0);

  const now = useNow(60_000);
  const segment = getDaySegment(now);
  const darkSky = segment === 'night';
  const near = isNearMissionTime(state.mission, now, isTodayCompleted);

  const handleCelebratingChange = (value: boolean) => {
    if (value && !celebrating) setCelebrationToken((t) => t + 1);
    setCelebrating(value);
  };

  return (
    <div
      className={`page home${darkSky ? ' home--skydark' : ''}${
        celebrating ? ' home--celebrating' : ''
      }`}
    >
      <Atmosphere segment={segment} near={near} celebrationToken={celebrationToken} />

      <div className="home-content">
        <HomeHeader />

        <div className="home-scene">
          <div className="home-sky">
            <SunScene celebrating={celebrating} near={near} />
          </div>

          <div className="home-valley">
            <span className="home-valley__halo" aria-hidden="true" />
            <Companion className="companion--home" label="Solín, tu compañero" />
          </div>
        </div>

        <MissionHero
          celebrating={celebrating}
          onCelebratingChange={handleCelebratingChange}
        />
      </div>
    </div>
  );
}