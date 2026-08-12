import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Check, Clock, Lock, Undo2 } from 'lucide-react';
import { useAppState } from '../../store/context';
import { completeToday, undoToday } from '../../store/actions';
import {
  getMissionPhase,
  getMissionState,
  isNearMissionTime,
} from '../../services/mission';
import { isCompleted } from '../../services/records';
import { useNow } from '../../hooks/useNow';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import { formatCountdown, msUntil, toDateKey } from '../../lib/date';
import { pickRandom } from '../../lib/random';
import { CELEBRATION_MESSAGES } from '../../config/messages';
import { Button } from '../../components/ui/Button';
import { MissionCelebration } from './MissionCelebration';
import { StreakFlame } from '../streak/StreakFlame';

/**
 * How long the visual celebration plays after pressing the button.
 * Deliberately short and integrated into the Home (1–2s).
 */
const CELEBRATION_MS = 1900;

interface MissionHeroProps {
  /** True while the completion celebration runs. */
  celebrating: boolean;
  onCelebratingChange: (value: boolean) => void;
}

/**
 * The protagonist of the Home: today's mission, told in one obvious line.
 *
 *   antes   → "Tu misión será a las 14:00"
 *   casi    → "Ya casi ☀️"
 *   es hora → "ES HORA" + the one big button
 *   listo   → "COMPLETADA ✓"
 *
 * Reaching the scheduled hour only unlocks the button — completing stays
 * a manual, deliberate act (the reducer blocks duplicates forever).
 */
export function MissionHero({ celebrating, onCelebratingChange }: MissionHeroProps) {
  const { state, dispatch } = useAppState();
  const { mission } = state;
  const reduceMotion = usePrefersReducedMotion();
  const timerRef = useRef<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const now = useNow(1000);
  const todayKey = toDateKey(now);
  const todayRecord = state.records[todayKey];
  const isTodayCompleted = isCompleted(todayRecord);
  const missionState = getMissionState(mission, now, isTodayCompleted);
  const phase = getMissionPhase(mission, now, isTodayCompleted);
  const near = isNearMissionTime(mission, now, isTodayCompleted);
  const countdownMs = msUntil(mission.scheduledTime, now);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const handleComplete = () => {
    if (missionState !== 'available' || celebrating) return;
    setMessage(pickRandom(CELEBRATION_MESSAGES));
    onCelebratingChange(true);
    dispatch(completeToday(todayKey));
    timerRef.current = window.setTimeout(
      () => onCelebratingChange(false),
      CELEBRATION_MS,
    );
  };

  const handleUndo = () => {
    dispatch(undoToday(todayKey));
  };

  if (!mission.enabled) {
    return (
      <section className="mission-hero" aria-label="Misión diaria">
        <p className="mission-hero__hint">La misión diaria está desactivada.</p>
      </section>
    );
  }

  const streak = state.progress.currentStreak;

  let status: string;
  if (phase === 'available') status = 'ES HORA';
  else if (phase === 'near') status = 'Ya casi ☀️';
  else if (phase === 'completed') status = 'COMPLETADA ✓';
  else status = `Tu misión será a las ${mission.scheduledTime}`;

  return (
    <motion.section
      className={`mission-hero mission-hero--${phase}${
        near ? ' mission-hero--near' : ''
      }${celebrating ? ' mission-hero--celebrating' : ''}`}
      aria-label="Misión de hoy"
      animate={celebrating ? { scale: 1.02 } : { scale: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 16 }}
    >
      <div className="mission-hero__head">
        <span className="mission-hero__tag">{mission.title}</span>
        <span className="mission-hero__clock" aria-label={`Hora programada: ${mission.scheduledTime}`}>
          <Clock size={15} aria-hidden="true" />
          {mission.scheduledTime}
        </span>
        {!celebrating && <StreakFlame streak={streak} celebrating={false} />}
      </div>

      {celebrating ? (
        <div className="mission-hero__celebration">
          <motion.p
            className="mission-hero__celeb-title"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            DÍA {streak} COMPLETADO
          </motion.p>
          <MissionCelebration
            xpEarned={todayRecord?.xpEarned ?? 0}
            message={message ?? ''}
            reduceMotion={reduceMotion}
          />
          <StreakFlame streak={streak} celebrating variant="lg" />
        </div>
      ) : missionState === 'completed' ? (
        <div className="mission-hero__done">
          <motion.p
            className="mission-hero__status"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {status}
          </motion.p>
          <p className="mission-hero__hint">
            Ganaste {todayRecord?.xpEarned ?? 0} XP hoy · un día más sumado a la racha
          </p>
          <Button variant="secondary" size="sm" onClick={handleUndo} aria-label="Deshacer la misión de hoy">
            <Undo2 size={16} aria-hidden="true" />
            Deshacer
          </Button>
        </div>
      ) : (
        <div className="mission-hero__pending">
          <motion.p
            className="mission-hero__status"
            key={status}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {status}
          </motion.p>

          {(phase === 'pending' || phase === 'near') && (
            <p className="mission-hero__countdown">
              Se desbloquea en {formatCountdown(countdownMs)}
            </p>
          )}

          <motion.div whileTap={reduceMotion ? undefined : { scale: 0.96 }}>
            <Button
              variant="primary"
              size="lg"
              block
              disabled={missionState === 'pending'}
              className={missionState === 'available' ? 'btn--pulse' : ''}
              onClick={handleComplete}
            >
              {missionState === 'pending' ? (
                <Lock size={20} aria-hidden="true" />
              ) : (
                <Check size={20} aria-hidden="true" />
              )}
              {missionState === 'pending' ? 'ESPERANDO EL MOMENTO' : 'YA LA TOMÉ ✓'}
            </Button>
          </motion.div>
        </div>
      )}
    </motion.section>
  );
}