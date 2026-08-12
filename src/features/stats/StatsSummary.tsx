import { motion } from 'motion/react';
import { CalendarX2, Clock3 } from 'lucide-react';
import { useAppState } from '../../store/context';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import { monthLabel, monthStartKey, toDateKey } from '../../lib/date';
import {
  averageCompletionTime,
  completedCount,
  completedInMonth,
  completionRate,
  elapsedDays,
  lastMonthSummaries,
} from '../../services/stats';
import { Card } from '../../components/ui/Card';
import { Stat, StatRow } from '../../components/ui/Stat';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { EmptyState } from '../../components/ui/EmptyState';
import '../../styles/stats.css';

const CHART_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * All statistics are derived from the real records on demand — nothing is
 * stored. Layout: big-number cards, completion ring, a simple monthly
 * bar chart and the average registration time.
 */
export function StatsSummary() {
  const { state } = useAppState();
  const { records, progress } = state;
  const todayKey = toDateKey();
  const reduceMotion = usePrefersReducedMotion();

  const totalDone = completedCount(records);
  const rate = completionRate(records, todayKey);
  const possibleDays = elapsedDays(records, todayKey);
  const monthCount = completedInMonth(records, todayKey);
  const monthName = monthLabel(todayKey);
  const avgTime = averageCompletionTime(records);
  const summaries = lastMonthSummaries(records, 6, todayKey);
  const maxCount = Math.max(1, ...summaries.map((s) => s.completed));
  const currentMonth = monthStartKey(todayKey);

  const streak = useAnimatedNumber(progress.currentStreak);
  const xp = useAnimatedNumber(progress.xp);
  const doneAnimated = useAnimatedNumber(totalDone);
  const rateAnimated = useAnimatedNumber(Math.round(rate));

  if (totalDone === 0) {
    return (
      <Card>
        <EmptyState
          icon={CalendarX2}
          title="Todavía no hay números"
          description="Completá tu primera misión en la pestaña Hoy y acá van a aparecer tu racha, tu porcentaje y tu hora promedio de registro."
        />
      </Card>
    );
  }

  return (
    <>
      <Card title="Resumen">
        <StatRow>
          <Stat label="Racha" value={streak > 0 ? `${streak}d` : '—'} accent />
          <Stat label="Mejor racha" value={`${progress.bestStreak}d`} />
          <Stat label="Misiones" value={doneAnimated.toLocaleString()} />
          <Stat label="XP total" value={xp.toLocaleString()} />
        </StatRow>
      </Card>

      <div className="stats-grid">
        <Card title="Constancia">
          <div className="stats-ring">
            <ProgressRing value={rate} size={150} label="Porcentaje de días completados">
              <div className="stats-ring__content">
                <span className="stats-ring__value">{rateAnimated}%</span>
                <span className="stats-ring__sub">completados</span>
              </div>
            </ProgressRing>
            <p className="page__desc">
              {totalDone} de {possibleDays} días desde tu primer registro.
            </p>
          </div>
        </Card>

        <Card title="Este mes">
          <div className="stats-month">
            <span className="stats-month__count">{monthCount}</span>
            <span className="stats-month__label">
              misiones cumplidas en {monthName}
            </span>
          </div>

          <div
            className="chart"
            role="img"
            aria-label={`Misiones por mes: ${summaries
              .map((s) => `${s.label}: ${s.completed}`)
              .join(', ')}`}
          >
            {summaries.map((s) => {
              const isCurrent = s.monthKey === currentMonth;
              const height = Math.max(4, (s.completed / maxCount) * 100);
              return (
                <div key={s.monthKey} className="chart__col">
                  <span className="chart__count">{s.completed}</span>
                  <div className="chart__bar-wrap">
                    <motion.div
                      className={`chart__bar${isCurrent ? ' chart__bar--current' : ''}`}
                      initial={reduceMotion ? false : { height: '0%' }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 0.6, ease: CHART_EASE }}
                    />
                  </div>
                  <span className="chart__label">{s.label}</span>
                </div>
              );
            })}
          </div>
          <p className="chart__caption">Últimos 6 meses</p>
        </Card>
      </div>

      <Card title="Horario">
        {avgTime ? (
          <div className="stats-time">
            <span className="stats-time__icon">
              <Clock3 size={24} aria-hidden="true" />
            </span>
            <div>
              <span className="stats-time__value">{avgTime}</span>
              <span className="stats-time__label">hora promedio de registro</span>
            </div>
          </div>
        ) : (
          <p className="page__desc">Todavía no hay suficientes registros con hora.</p>
        )}
      </Card>
    </>
  );
}
