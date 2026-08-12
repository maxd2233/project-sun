# Project Sun

A personal **daily-mission tracker** as a mobile-first PWA that feels like a tiny
game. A warm animated sun greets you every time you open it, your one mission
waits for you at its scheduled time, and completing it triggers a small
celebration with XP, streaks and unlockable achievements.

- **Private & local-first** — every byte of user data lives in `localStorage`
  on the device. No accounts, no backend, no analytics, no tracking.
- **Offline-ready** — installable PWA with a service worker; after the first
  load it works with no connection.
- **Game-flavored habit tracker** — a daily mission at 14:00, streaks, XP,
  achievements, a history calendar and a hero sun that adapts to the time of day.
- **Solín, a virtual companion** — an original SVG sun creature that reacts to
  your progress, chats, evolves across five stages and lives entirely on-device.
- **No clinical content** — nothing in the app is medical or health advice.

## Stack

- React 19 + TypeScript (strict) + Vite 6
- [Motion](https://motion.dev) for animations (respects `prefers-reduced-motion`)
- [lucide-react](https://lucide.dev) icons
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app) for manifest + service worker
- Plain CSS custom-property tokens (light/dark/system theme) — no UI framework

## Getting started

```bash
npm install
npm run dev        # start dev server
```

Production build and preview:

```bash
npm run build      # typecheck (tsc) + production bundle (incl. PWA assets)
npm run preview    # serve the production build locally
```

Other scripts:

```bash
npm run typecheck            # strict TypeScript check only
npm run lint                 # ESLint
npm run lint:fix
npm run test:achievements    # logic sanity tests for the achievement catalogue
```

## The daily mission

Today's mission has three states driven by its scheduled time (default **14:00**):

- `PENDIENTE` — scheduled time not reached; the button is locked with a countdown.
- `DISPONIBLE` — time reached, mission ready to be marked as done.
- `COMPLETADA` — done for the day (with undo).

Completing it runs a short celebration: button press → card spring → sun brightens
→ particles burst → animated check → XP and streak count up → a random message →
**MISSION COMPLETE**.

### Editing the celebration messages

All messages live in one editable file:

```
src/config/messages.ts
```

Add, remove or reorder entries freely — one is picked at random on each
completion.

## Solín, the companion

An original companion drawn entirely in SVG (no images, no copyrighted
characters). It lives on the **Racha (stats)** section and a compact version
sits on the home screen so it reacts the moment you complete the mission.

**Seven moods.** The face, palette and motion follow the moment:

| Mood | When |
| --- | --- |
| `idle` | Mission scheduled, time not reached |
| `waiting` | Mission available, not done — "👀 ¿Seguimos esperando?" |
| `happy` | Mission done today |
| `celebrating` | Right after pressing complete |
| `unlocking` | An achievement just unlocked |
| `resting` | Night + mission not done (sleeping cap, Zzz) |
| `night` | Night + mission done (moonlit form, stars) |

**Microanimations** (all Motion, all disabled under `prefers-reduced-motion`):
idle breathing, floating, blinking, tap/poke reaction with hearts, celebration
jump + confetti, and a star burst on achievement unlock.

**Evolution.** Solín grows with your completed days:

| Days | Form |
| --- | --- |
| 0–6 | Solín bebé |
| 7–13 | Solín despierto |
| 14–29 | Solín energético |
| 30–99 | Solín solar |
| 100+ | Solín legendario |

Each stage changes size, rays, aura (glow → ring → rainbow), orbiting sparkles
and accessories (e.g. the legendary crown). The stage catalog lives in
`src/features/companion/evolution.ts` — add an entry there and the companion
renders it, nothing else needs changing.

### Editing Solín's personality

All messages live in one editable file:

```
src/features/companion/messages.ts
```

One line per pool (waiting, after, poke, unlocking, evolution, …). Messages are
picked at random and never immediately repeated. Personality and chatter while
waiting update on their own every ~20s.

### The companion files

`<Companion />` is reusable — drop it anywhere and it reacts on its own. Its
parts are separated by concern:

```
features/companion/
  Companion.tsx       # controller + composition (reactions, bubble, bursts)
  visual.tsx          # SVG artwork (face, rays, crown, nightcap, blink)
  state.ts            # mood derivation (mission state + time of day)
  messages.ts         # personality message pools + random picker
  evolution.ts        # extensible evolution stage catalog
  animations.tsx      # celebration / achievement / poke particle bursts
  presets.ts          # shared Motion presets (no JSX, fast-refresh safe)
  CompanionPanel.tsx  # stats-section card with evolution progress
```

## Logros (achievements)

A complete trophy system with 15 achievements across three categories:

- **Constancia** — Primer paso (1ª misión), Una semana (7 consecutivos), Imparable (14),
  Constante (30), Leyenda (100), Año completo (365).
- **Precisión** — Francotirador (≤2 min de la hora), Puntual (5 misiones a ≤30 min).
- **Divertidos** — El pato te observa (visitar Logros 5 veces), El consejo de ancianos
  (1.000 XP), Sobreviviste al lunes, Modo nocturno (21:00–05:00), ¿Otra vez acá?,
  Speedrun (≤1 min), Combo x7.

- **Logros** — 15 logros: Constancia (rachas), Precisión (cerca de la hora) y Divertidos.
- **Backup local** — en *Ajustes → Datos* podés **exportar** un `.json` con todo tu
  progreso y **importarlo** (en este u otro dispositivo). La importación valida el
  archivo antes de reemplazar los datos y se recarga sola al confirmar.

**Real and deterministic.** Every condition is a pure predicate over persisted data
(records, computed progress, event counters) — never random or time-gated UI tricks.
They unlock automatically in the reducer whenever their conditions become true.

**On unlock:** a full-screen overlay plays (backdrop → radial star burst → icon pop →
title → description → +XP) using Motion, several unlocks queue one at a time, the
XP is added to `progress.bonusXp`, the unlock is persisted with `unlockedAt`, and
Solín celebrates with its `unlocking` mood. Unlocks detected on load (e.g. after a
migration) are registered silently, without the animation.

**Rarities** — Común, Poco común, Raro, Épico, Legendario — drive the icon color,
card border and glow. Each rarity and category lives in one place.

**Adding a new achievement.** Each one is a single entry in
`src/config/achievements.ts` — give it an id (stable, it's persisted), category,
title, description, requirement, icon, rarity, XP and a `unlocked(ctx)` predicate.
The reducer, overlay, grid and tests pick it up automatically. Run
`npm run test:achievements` to sanity-check the whole catalogue.

## Project structure

```
src/
  components/
    layout/        # AppShell, NavBar, AppHeader
    ui/            # Button, Card, Stat, ProgressRing, EmptyState
  config/          # messages.ts, achievements.ts (easy-to-edit game content)
  features/
    hero/          # SunHero (animated, adapts to time of day)
    mission/       # DailyMissionCard + MissionCelebration (completion sequence)
    companion/     # Solín: visual, state, messages, animations, evolution
    calendar/      # CalendarView (month grid + read-only day detail)
    achievements/  # AchievementGrid + AchievementUnlockHost (unlock overlay)
    stats/         # StatsSummary (derived analytics) + QuickActions (shortcuts)
  hooks/           # useClock, useCountdown, useAnimatedNumber, useMediaQuery, useTheme
  lib/             # date, storage, ids, random, sections (pure helpers, no React)
  services/        # persistence, streaks, xp, stats, mission, achievements (domain logic)
  store/           # AppStateContext + reducer + actions (state management)
  types/           # domain types: Mission, DailyRecord, UserProgress, ...
  styles/          # tokens.css, global.css, components.css, achievements.css, ...
  pages/           # one page per nav section (Hoy, Racha, Logros, Calendario, Ajustes)
scripts/
  achievements-sanity.test.ts  # logic tests for the achievement catalogue
```

### Domain model

```ts
interface Mission { id; title; scheduledTime; enabled }
interface DailyRecord { date; completed; completedAt; xpEarned }
interface UserProgress { currentStreak; bestStreak; totalCompleted; totalDays; xp; achievementUnlocks; bonusXp }
interface AchievementUnlock { unlockedAt; xpEarned }
interface Settings { theme; userName }
interface AppState { version; mission; records; progress; settings; events }
```

- Records are keyed by local date (`YYYY-MM-DD`), so a day can never be
  double-counted. `COMPLETE_TODAY` is idempotent in the reducer.
- Streaks and XP are **derived from records** by `services/streaks.ts` and
  `services/xp.ts` and always recomputed after a change, so displayed progress
  can't drift from history. A still-pending "today" keeps yesterday's streak alive.
- Achievements are declarative (`config/achievements.ts`) and auto-unlock when
  their conditions become true (`services/achievements.ts`). Each unlock stores
  its timestamp and XP; achievement XP is kept in `bonusXp` so recomputing
  mission XP can never erase it.
- `events` in `AppState` counts real in-app events (e.g. visiting the Logros
  screen) that some fun achievements depend on.
- State is normalised on load (`services/persistence.ts`) and versioned; v1
  data (a plain list of unlocked ids) migrates automatically.

## Where things are headed

- **Notifications** — reminders around `mission.scheduledTime` (needs
  `Notification` permission; nothing to change in the data model).
- **Richer persistence** — the storage wrapper in `lib/storage.ts` isolates
  reads/writes, so swapping to IndexedDB is a drop-in change.

## License

Private/internal project.
