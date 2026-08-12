import { useState } from 'react';
import { motion } from 'motion/react';
import { CalendarX2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppState } from '../../store/context';
import {
  daysInMonth,
  firstWeekdayOfMonth,
  formatDateLongYear,
  formatTime,
  monthLabel,
  monthStartKey,
  shiftDateKey,
  toDateKey,
} from '../../lib/date';
import { completedCount } from '../../services/stats';
import { getDayNumberForDate } from '../../services/days';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import type { DateKey } from '../../types';
import '../../styles/calendar.css';

const WEEKDAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

type DayStatus = 'completed' | 'pending' | 'future' | 'missed';

/** 🟢 completed · ⚪ pending/future · ⚫ no record (past). */
function dayStatus(
  key: DateKey,
  today: DateKey,
  completed: boolean,
): DayStatus {
  if (completed) return 'completed';
  if (key > today) return 'future';
  if (key === today) return 'pending';
  return 'missed';
}

const STATUS_META: Record<
  DayStatus,
  { label: string; dotClass: string; badge: string }
> = {
  completed: { label: 'Completada', dotClass: 'cal__dot--completed', badge: 'badge--success' },
  pending: { label: 'Pendiente', dotClass: 'cal__dot--pending', badge: 'badge--accent' },
  future: { label: 'Futuro', dotClass: 'cal__dot--future', badge: 'badge--muted' },
  missed: { label: 'Sin registro', dotClass: 'cal__dot--missed', badge: 'badge--muted' },
};

/** Month grid of the mission history with a read-only day detail. */
export function CalendarView() {
  const { state } = useAppState();
  const today = toDateKey();
  const reduceMotion = usePrefersReducedMotion();
  const [monthKey, setMonthKey] = useState(() => monthStartKey(today));
  const [selectedKey, setSelectedKey] = useState<DateKey | null>(today);

  // Single source of truth: the same day-number rule as the Home, applied to
  // each calendar date at its mission boundary.
  const treatmentStart = state.progress.startDate;
  const scheduledTime = state.mission.scheduledTime;

  const cells: Array<DateKey | null> = [];
  for (let i = 0; i < firstWeekdayOfMonth(monthKey); i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth(monthKey); day += 1) {
    cells.push(shiftDateKey(monthKey, day - 1));
  }

  const goToMonth = (offset: number) => {
    const [y, m] = monthKey.split('-').map(Number);
    setMonthKey(toDateKey(new Date(y, m - 1 + offset, 1)));
    setSelectedKey(null);
  };

  const goToToday = () => {
    setMonthKey(monthStartKey(today));
    setSelectedKey(today);
  };

  const record = selectedKey ? state.records[selectedKey] : undefined;
  const status: DayStatus | null = selectedKey
    ? dayStatus(selectedKey, today, record?.completed === true)
    : null;
  const selectedDayNumber =
    selectedKey !== null
      ? getDayNumberForDate(treatmentStart, scheduledTime, selectedKey)
      : null;

  const dayBonusXp = selectedKey
    ? Object.values(state.progress.achievementUnlocks)
        .filter((unlock) => toDateKey(new Date(unlock.unlockedAt)) === selectedKey)
        .reduce((sum, unlock) => sum + unlock.xpEarned, 0)
    : 0;
  const dayXp = (record?.xpEarned ?? 0) + dayBonusXp;
  const registeredHour = record?.completedAt
    ? formatTime(new Date(record.completedAt))
    : null;

  const empty = (
    <EmptyState
      icon={CalendarX2}
      title="Todavía no hay historial"
      description="Completá tu misión en la pestaña Hoy y los días cumplidos van a empezar a encenderse acá."
    />
  );

  return (
    <Card title="Calendario">
      <div className="cal__head">
        <Button variant="ghost" size="sm" onClick={() => goToMonth(-1)} aria-label="Mes anterior">
          <ChevronLeft size={18} aria-hidden="true" />
        </Button>
        <span className="cal__month">{monthLabel(monthKey)}</span>
        <Button variant="ghost" size="sm" onClick={() => goToMonth(1)} aria-label="Mes siguiente">
          <ChevronRight size={18} aria-hidden="true" />
        </Button>
      </div>

      {completedCount(state.records) === 0 ? (
        empty
      ) : (
        <>
          <div className="cal__weekdays">
            {WEEKDAYS.map((wd) => (
              <span key={wd} className="cal__weekday">
                {wd}
              </span>
            ))}
          </div>

          <div className="cal__grid">
            {cells.map((key, index) => {
              if (key === null) {
                return <span key={`empty-${index}`} className="cal__cell cal__cell--empty" aria-hidden="true" />;
              }
              const isCompleted = state.records[key]?.completed === true;
              const statusClass = `cal__cell--${dayStatus(key, today, isCompleted)}`;
              const isToday = key === today;
              const isSelected = key === selectedKey;
              const dayNumber = getDayNumberForDate(treatmentStart, scheduledTime, key);
              return (
                <button
                  key={key}
                  type="button"
                  className={[
                    'cal__cell',
                    statusClass,
                    isToday ? 'cal__cell--today' : '',
                    isSelected ? 'cal__cell--selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-pressed={isSelected}
                  aria-label={`${formatDateLongYear(key)}${dayNumber !== null ? `, día ${dayNumber} del tratamiento` : ''}${isCompleted ? ', completado' : ''}${isToday ? ', hoy' : ''}`}
                  onClick={() => setSelectedKey(key)}
                >
                  <span className="cal__cell__group">
                    <span className="cal__cell__label" aria-hidden="true">
                      {dayNumber !== null ? 'Día' : ''}
                    </span>
                    <span className="cal__cell__num">{dayNumber ?? ''}</span>
                  </span>
                  <span className={`cal__dot ${STATUS_META[dayStatus(key, today, isCompleted)].dotClass}`} aria-hidden="true" />
                </button>
              );
            })}
          </div>

          <div className="cal__legend" aria-hidden="true">
            <span className="cal__legend-item">
              <span className="cal__legend-dot cal__legend-dot--completed" /> Completado
            </span>
            <span className="cal__legend-item">
              <span className="cal__legend-dot cal__legend-dot--pending" /> Pendiente / Futuro
            </span>
            <span className="cal__legend-item">
              <span className="cal__legend-dot cal__legend-dot--missed" /> Sin registro
            </span>
          </div>
        </>
      )}

      {selectedKey && status ? (
        <motion.div
          className="cal-detail"
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <p className="cal-detail__date">{formatDateLongYear(selectedKey)}</p>

          {selectedDayNumber !== null && (
            <div className="cal-detail__row">
              <span className="cal-detail__key">Día del tratamiento</span>
              <span className="cal-detail__value cal-detail__value--accent">
                Día {selectedDayNumber}
              </span>
            </div>
          )}

          <div className="cal-detail__row">
            <span className="cal-detail__key">Estado</span>
            <span className={`badge ${STATUS_META[status].badge}`}>{STATUS_META[status].label}</span>
          </div>

          {status === 'completed' && record ? (
            <>
              <div className="cal-detail__row">
                <span className="cal-detail__key">Hora registrada</span>
                <span className="cal-detail__value">{registeredHour ?? '—'}</span>
              </div>
              <div className="cal-detail__row">
                <span className="cal-detail__key">XP obtenido</span>
                <span className="cal-detail__value cal-detail__value--accent">
                  {dayXp}
                  {dayBonusXp > 0 ? ` (+${dayBonusXp} de logros)` : ''}
                </span>
              </div>
              <p className="cal-detail__note">
                {selectedKey === today
                  ? 'Misión de hoy: podés deshacerla desde la tarjeta de la misión.'
                  : 'Historial de solo lectura: los registros pasados no se modifican desde el calendario.'}
              </p>
            </>
          ) : status === 'pending' ? (
            <p className="cal-detail__note">
              La misión de hoy todavía está por completarse. Volvé a la pestaña Hoy cuando se desbloquee.
            </p>
          ) : status === 'future' ? (
            <p className="cal-detail__note">Este día todavía no llegó. Todo a su tiempo.</p>
          ) : (
            <p className="cal-detail__note">No hubo registro este día.</p>
          )}

          <Button variant="ghost" size="sm" className="cal-detail__today" onClick={goToToday}>
            Ir a hoy
          </Button>
        </motion.div>
      ) : null}
    </Card>
  );
}
