import { strict as assert } from 'node:assert';
import {
  getCurrentDayNumber,
  getDayNumberForDate,
  treatmentStartInstant,
} from '../src/services/days';
import { currentStreak } from '../src/services/streaks';
import {
  createDefaultState,
  DEFAULT_PROGRESS,
  normalizeState,
  recomputeProgress,
} from '../src/services/persistence';
import { appReducer } from '../src/store/reducer';
import { shiftDateKey, toDateKey } from '../src/lib/date';
import type { AppState, DailyRecord, Mission } from '../src/types';

const START = '2026-08-11';
const TIME = '14:00';

const MISSION: Mission = {
  id: 'mission_daily',
  title: 'MISIÓN DIARIA',
  scheduledTime: TIME,
  enabled: true,
};

let failures = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL  ${name}`);
    console.error(error);
  }
}

/** A completed record for a DateKey (local ISO timestamp at 14:00). */
function completion(key: string): DailyRecord {
  const [y, m, d] = key.split('-').map(Number);
  return {
    date: key,
    completed: true,
    completedAt: new Date(y, m - 1, d, 14, 0, 0).toISOString(),
    xpEarned: 100,
  };
}

// ---------------------------------------------------------------------------
// El número de día del tratamiento: SOLO depende de startDate + hora de la
// misión + reloj. Nunca de registros, racha, XP ni del botón.
// ---------------------------------------------------------------------------

check('CASO 1: inicio 11/08 14:00, ahora 12/08 13:00 → dayNumber = 1', () => {
  assert.equal(getCurrentDayNumber(START, TIME, new Date(2026, 7, 12, 13, 0)), 1);
});

check('CASO 2: inicio 11/08 14:00, ahora 12/08 14:00 → dayNumber = 2', () => {
  assert.equal(getCurrentDayNumber(START, TIME, new Date(2026, 7, 12, 14, 0)), 2);
});

check('CASO 3: inicio 11/08 14:00, ahora 13/08 14:00 → dayNumber = 3', () => {
  assert.equal(getCurrentDayNumber(START, TIME, new Date(2026, 7, 13, 14, 0)), 3);
});

check('CASO 4: inicio 11/08 14:00, ahora 14/08 14:00 → dayNumber = 4', () => {
  assert.equal(getCurrentDayNumber(START, TIME, new Date(2026, 7, 14, 14, 0)), 4);
});

check('el día de inicio entero es Día 1 (antes y después de las 14:00)', () => {
  assert.equal(getCurrentDayNumber(START, TIME, new Date(2026, 7, 11, 13, 0)), 1);
  assert.equal(getCurrentDayNumber(START, TIME, new Date(2026, 7, 11, 14, 0)), 1);
  assert.equal(getCurrentDayNumber(START, TIME, new Date(2026, 7, 11, 15, 0)), 1);
});

check('el día avanza SOLO al cruzar la hora de la misión, no a medianoche', () => {
  assert.equal(getCurrentDayNumber(START, TIME, new Date(2026, 7, 12, 0, 0)), 1);
  assert.equal(getCurrentDayNumber(START, TIME, new Date(2026, 7, 12, 13, 59)), 1);
  assert.equal(getCurrentDayNumber(START, TIME, new Date(2026, 7, 12, 14, 0)), 2);
  assert.equal(getCurrentDayNumber(START, TIME, new Date(2026, 7, 13, 13, 59)), 2);
  assert.equal(getCurrentDayNumber(START, TIME, new Date(2026, 7, 13, 14, 0)), 3);
});

check('la hora configurable de la misión define la frontera del día', () => {
  assert.equal(getCurrentDayNumber(START, '00:00', new Date(2026, 7, 11, 23, 59)), 1);
  assert.equal(getCurrentDayNumber(START, '00:00', new Date(2026, 7, 12, 0, 0)), 2);
  assert.equal(getCurrentDayNumber(START, '20:00', new Date(2026, 7, 12, 19, 59)), 1);
  assert.equal(getCurrentDayNumber(START, '20:00', new Date(2026, 7, 12, 20, 0)), 2);
});

check('nunca existe "Día 0" (se recorta al mínimo 1)', () => {
  assert.equal(getCurrentDayNumber(START, TIME, new Date(2026, 7, 10, 20, 0)), 1);
});

check('el día NO depende de los registros completados', () => {
  // Sin ningún registro, en el mismo instante, el día es el mismo.
  assert.equal(getCurrentDayNumber(START, TIME, new Date(2026, 7, 12, 14, 0)), 2);
  assert.equal(getCurrentDayNumber(START, TIME, new Date(2026, 7, 13, 14, 0)), 3);
});

// ---------------------------------------------------------------------------
// DÍA DEL TRATAMIENTO y RACHA son conceptos independientes.
// ---------------------------------------------------------------------------

check('CASO 5: Día 1 cumplido, Día 2 pendiente → day = 2, streak = 1', () => {
  const records = { '2026-08-11': completion('2026-08-11') };
  assert.equal(getCurrentDayNumber(START, TIME, new Date(2026, 7, 12, 14, 1)), 2);
  assert.equal(currentStreak(records, '2026-08-12'), 1);
});

check('CASO 6: Día 1 y Día 2 cumplidos → day = 2, streak = 2', () => {
  const records = {
    '2026-08-11': completion('2026-08-11'),
    '2026-08-12': completion('2026-08-12'),
  };
  assert.equal(getCurrentDayNumber(START, TIME, new Date(2026, 7, 12, 14, 30)), 2);
  assert.equal(currentStreak(records, '2026-08-12'), 2);
});

check('CASO 7: Días 1 y 2 cumplidos, llega Día 3 → day = 3, streak = 2', () => {
  const records = {
    '2026-08-11': completion('2026-08-11'),
    '2026-08-12': completion('2026-08-12'),
  };
  assert.equal(getCurrentDayNumber(START, TIME, new Date(2026, 7, 13, 14, 0)), 3);
  assert.equal(currentStreak(records, '2026-08-13'), 2);
});

// ---------------------------------------------------------------------------
// Calendario: la misma función, aplicada a cada fecha concreta.
// ---------------------------------------------------------------------------

check('getDayNumberForDate etiqueta AYER/HOY/MAÑANA con la misma regla', () => {
  assert.equal(getDayNumberForDate(START, TIME, '2026-08-11'), 1);
  assert.equal(getDayNumberForDate(START, TIME, '2026-08-12'), 2);
  assert.equal(getDayNumberForDate(START, TIME, '2026-08-13'), 3);
  assert.equal(getDayNumberForDate(START, TIME, '2026-08-14'), 4);
});

check('las fechas anteriores al inicio no tienen número de día', () => {
  assert.equal(getDayNumberForDate(START, TIME, '2026-08-10'), null);
});

check('treatmentStartInstant = startDate a la hora de la misión', () => {
  const t = treatmentStartInstant(START, TIME);
  assert.equal(t.getFullYear(), 2026);
  assert.equal(t.getMonth(), 7);
  assert.equal(t.getDate(), 11);
  assert.equal(t.getHours(), 14);
  assert.equal(t.getMinutes(), 0);
});

// ---------------------------------------------------------------------------
// Persistencia: la fecha de inicio se guarda y NO se recalcula.
// ---------------------------------------------------------------------------

check('la fecha de inicio se conserva al recomputar el progreso', () => {
  const records = { '2026-08-11': completion('2026-08-11') };
  const previous = { ...DEFAULT_PROGRESS, startDate: '2026-08-11' };
  const out = recomputeProgress(records, previous, { mission: MISSION, events: {} });
  assert.equal(out.startDate, '2026-08-11');
});

check('la migración usa el registro más antiguo como inicio si falta startDate', () => {
  const raw = {
    version: 2,
    mission: MISSION,
    records: { '2026-08-12': completion('2026-08-12') },
  } as Partial<AppState>;
  const state = normalizeState(raw);
  assert.equal(state.progress.startDate, '2026-08-12');
});

check('la migración respeta un startDate explícito', () => {
  const raw = {
    version: 2,
    mission: MISSION,
    records: { '2026-08-12': completion('2026-08-12') },
    progress: { ...DEFAULT_PROGRESS, startDate: '2026-08-13' },
  } as Partial<AppState>;
  const state = normalizeState(raw);
  assert.equal(state.progress.startDate, '2026-08-13');
});

check('el estado por defecto comienza ayer (Día 1 = ayer, Día 2 = hoy)', () => {
  const def = createDefaultState();
  assert.equal(def.progress.startDate, shiftDateKey(toDateKey(), -1));
});

check('COMPLETE_TODAY no altera la fecha de inicio', () => {
  const base = createDefaultState();
  const next = appReducer(base, {
    type: 'COMPLETE_TODAY',
    date: toDateKey(),
    completedAt: '2026-08-12T14:00:00.000Z',
  });
  assert.equal(next.progress.startDate, base.progress.startDate);
});

console.log(failures === 0 ? '\nALL DAY TESTS PASSED' : `\n${failures} DAY TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);