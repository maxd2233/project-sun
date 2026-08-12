import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Check, Clock, Lock, Undo2 } from 'lucide-react';
import { useAppState } from '../../store/context';
import { completeToday, undoToday } from '../../store/actions';
import {
  getMissionPhase,
  getMissionState,
  isNearMissionTime,
  missionHintText,
  MISSION_PHASE_LABEL,
} from '../../services/mission';
import { isCompleted } from '../../services/records';
import { useNow } from '../../hooks/useNow';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import { formatCountdown, msUntil, toDateKey } from '../../lib/date';
import { pickRandom } from '../../lib/random';
import { CELEBRATION_MESSAGES } from '../../config/messages';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MissionCelebration } from './MissionCelebration';

interface DailyMissionCardProps {
  /** True while the completion celebration runs. */
  celebrating: boolean;
  onCelebratingChange: (value: boolean) => void;
}

/**
 * Today's mission. Drives the state machine
 * pendiente → cerca → disponible → completada and the celebration sequence.
 *
 * The card owns a 1s clock so only it re-renders on tick. The day is
 * derived live from that clock (never assumed from context), so midnight
 * rollover, timezone changes and DST are always respected. Reaching the
 * scheduled time only *unlocks* the button — completing stays manual.
 */
export function DailyMissionCard({
  celebrating,
  onCelebratingChange,
}: DailyMissionCardProps) {
  const { state, dispatch } = useAppState();
  const { mission } = state;
  const reduceMotion = usePrefersReducedMotion();
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

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
    timerRef.current = window.setTimeout(() => onCelebratingChange(false), 2300);
  };

  const handleUndo = () => {
    dispatch(undoToday(todayKey));
  };

  if (!mission.enabled) {
    return (
      <Card className="mission-card">
        <p className="page__desc">La misión diaria está desactivada.</p>
      </Card>
    );
  }

  const badgeClass =
    missionState === 'completed'
      ? 'badge--success'
      : missionState === 'available'
        ? 'badge--accent badge--pulse'
        : near
          ? 'badge--accent badge--pulse'
          : 'badge--muted';

  return (
    <motion.div
      animate={celebrating ? { scale: 1.03 } : { scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 17 }}
    >
      <Card className={`mission-card${near ? ' mission-card--near' : ''}`}>
        <div className="mission-card__header">
          <span className="mission-card__title">{mission.title}</span>
          <span className={`badge ${badgeClass}`}>{MISSION_PHASE_LABEL[phase]}</span>
        </div>

        <div className="mission-card__time">
          <Clock size={26} aria-hidden="true" />
          {mission.scheduledTime}
        </div>

        {celebrating ? (
          <MissionCelebration
            xpEarned={todayRecord?.xpEarned ?? 0}
            message={message ?? ''}
            reduceMotion={reduceMotion}
          />
        ) : missionState === 'completed' ? (
          <div className="complete-panel">
            <motion.p
              className="complete-panel__title"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            >
              {missionHintText(mission, now, isTodayCompleted)}
            </motion.p>
            <p className="complete-panel__sub">
              Ganaste {todayRecord?.xpEarned ?? 0} XP hoy · un día más sumado a la racha
            </p>
            <Button variant="secondary" onClick={handleUndo} aria-label="Deshacer la misión de hoy">
              <Undo2 size={18} aria-hidden="true" />
              Deshacer
            </Button>
          </div>
        ) : (
          <>
            <p className="mission-card__hint">{missionHintText(mission, now, isTodayCompleted)}</p>
            {missionState === 'pending' && (
              <p className="mission-card__countdown">
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
                MARCAR COMO HECHA
              </Button>
            </motion.div>
          </>
        )}
      </Card>
    </motion.div>
  );
}
