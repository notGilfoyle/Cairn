# Cairn — v1 Product Requirements Document
**Status:** Ready to build · **Scope:** Daily ritual core (journal + todos + habits) · **Type:** Local-first web app
*Working name (a cairn is the stack of stones that marks a trail). Rename freely. This document supersedes the earlier design spec and is self-contained.*

---

## 1. Problem & goal

A high-output self-improvement routine is currently fragmented across Excel (habits, finance), iOS/macOS Notes (journaling), and scattered lists (bucketlists, todos). The cost: constant app-switching, no unified view or analysis, and friction every time a new thing needs tracking.

**Goal of v1:** one fast, calm, local-first app that owns the *daily ritual* — morning/evening journaling, today's todos, and habit check-ins — with a dashboard that rolls it up into streaks and trends. Built so finance, workouts, bucketlists, and learning slot in later without re-architecting.

---

## 2. Principles (non-negotiable)

1. **Few concepts, composable.** Built from five primitives, not ten bespoke trackers.
2. **The daily loop is sacred.** Logging a habit/todo/entry takes seconds.
3. **Local-first and private.** No backend, no account, no network calls. Data never leaves the device.
4. **Your data is yours.** Export anytime.
5. **Small body, future-proof bones.** v1 is narrow; the data model already anticipates v2–v4.

---

## 3. The foundation: five primitives

| Primitive | Powers | In v1? |
|---|---|---|
| **Check-in** (daily yes/no) | habits, with streaks | ✅ |
| **Checklist** (tick items, no daily reset) | todos now; bucketlists & goals later | ✅ (todos) |
| **Journal** (timestamped text + mood) | morning / evening writing | ✅ |
| **Quantity** (a number logged over time) | finance, weight, study hours, water | v2 |
| **Session log** (event: type + duration + notes) | running, calisthenics, gym, swim, basketball | v2 |

**Tags** are the universal glue, live from v1: any habit, todo, or entry can carry tags (`#fitness`, `#finance`, `#spanish`) for later cross-module slicing.

---

## 4. v1 scope

**In:** Today screen · Dashboard · manage habits · manage todos · tags · light/dark · export + basic import · offline/installable.

**Out (deferred, not forgotten):** generic tracker-builder UI, finance, workouts, bucketlists, learning/skills, cross-module analysis, push notifications/reminders (the OS already does these well).

---

## 5. Locked decisions

| # | Decision | Choice | Override? |
|---|---|---|---|
| 1 | Mood input | 5 emoji faces mapped to 1–5 (😖 😕 😐 🙂 😄) | swap scale |
| 2 | Habit cadence | daily **or** specific weekdays | — |
| 3 | Undone todos | auto carry-over **on**, toggleable per todo | flip default |
| 4 | Journaling style | light, optional, editable AM/PM prompts | edit prompts |
| 5 | Visual vibe | bold-but-clean, one accent color | restyle |
| 6 | Week start | **Monday** (ISO) | switch to Sunday in settings |
| 7 | Stack | React + TypeScript + Vite + Tailwind | see §6 |
| 8 | Persistence | IndexedDB via Dexie.js | see §6 |

---

## 6. Tech stack & architecture

A pragmatic, dependency-light, fully client-side setup. Everything runs in the browser; no server.

- **Framework:** React + TypeScript, built with **Vite**.
- **Styling:** **Tailwind CSS** (fast iteration; supports the bold-but-clean look and dark mode via `class` strategy).
- **State:** **Zustand** for the global store (simple, minimal boilerplate). React Context + reducer is an acceptable substitute.
- **Persistence:** **IndexedDB via Dexie.js.** Rationale: async (no UI jank), queryable by date/habitId, scales cleanly to v2's quantity/session data, and trivial to export. *Acceptable simpler fallback for a first cut:* a single JSON blob in `localStorage` — fine until v2 adds high-volume logs, but the data layer should be isolated (see §11) so this stays a one-file swap.
- **Charts/visuals:** hand-rolled **SVG** for the week heatmap and mood sparkline (simple, zero heavy deps). Recharts is optional if preferred.
- **Dates:** **date-fns** for streak/week math. **Store dates as the user's local calendar date `YYYY-MM-DD`, never UTC timestamps**, to avoid off-by-one day-boundary bugs.
- **Routing:** three views (Today / Dashboard / Manage) via React Router or a simple tab state.
- **Offline / install:** ship as a **PWA** (e.g., `vite-plugin-pwa`) so it caches assets, works offline, and installs to home screen on iOS/macOS.
- **Deploy:** `vite build` → static files. Run locally, or host on Netlify / Vercel / GitHub Pages. (Hosting only serves static assets; data stays on-device.)

---

## 7. Non-functional requirements

- **Browsers/devices:** evergreen Chrome, Safari, Firefox, Edge (last 2 versions); explicitly Mobile Safari (iOS) and Chrome on Android. Mobile-first layout, comfortable on desktop.
- **Offline:** fully functional with no network. No data is transmitted anywhere.
- **Performance:** interactions feel instant (<100ms perceived) for toggles/saves; charts may lazy-load. Autosave debounced (~300–500ms) for text, immediate for toggles.
- **Persistence guarantee:** a full reload restores all state exactly.
- **Accessibility:** keyboard-navigable; tap targets ≥44px on mobile; sufficient contrast in both themes; respects `prefers-reduced-motion`.
- **Privacy:** no analytics, no third-party calls, no telemetry.

---

## 8. Data model

Stored in IndexedDB (Dexie). Suggested tables and indexes below; `[a+b]` denotes a compound key/index.

```
meta            (key)                       // schemaVersion, appVersion, createdAt
settings        (key)                       // theme, accent, weekStart, amPrompt, pmPrompt,
                                            // showedUpThreshold

days            (date)                      // primary key = YYYY-MM-DD
  date          YYYY-MM-DD
  amJournal     { text, mood, savedAt } | null
  pmJournal     { text, mood, savedAt } | null
  intentions    [string]                    // optional top-3
  updatedAt

habits          (id), index: archived
  id
  name
  emoji
  color
  cadence       "daily" | { weekdays: number[] }   // 0=Sun … 6=Sat
  tags          string[]
  archived      boolean
  createdAt
  sortOrder

habitLogs       ([habitId+date]), index: date
  habitId
  date          YYYY-MM-DD
  done          boolean
  note          string | null

todos           (id), index: date, done
  id
  title
  date          YYYY-MM-DD | null            // null = backlog
  done          boolean
  carryOver     boolean
  tags          string[]
  createdAt
  completedAt   | null
```

- **Tags** are plain strings denormalized onto entities; no separate table in v1 (a color registry can come later).
- **Exports** include `schemaVersion` so v2/v3 migrations are forward-compatible.

---

## 9. Metric definitions

- **Mood:** 5 faces ↔ 1–5; nullable per entry.
- **Habit current streak:** count back from today over *scheduled* days; consecutive `done`. **Today is "pending"** and does not break the streak until day's end.
- **Perfect day:** every habit scheduled that day is `done`. **Perfect-day streak** = consecutive perfect days, excluding today-while-pending.
- **Journaling streak:** consecutive days with ≥1 entry (AM or PM).
- **"Showed up" (heatmap cell on):** the day has a journal entry **AND** (≥1 scheduled habit done **OR** ≥1 todo completed). Threshold stored in `settings.showedUpThreshold` so it's tunable.
- **Todo completion rate (week):** completed ÷ (completed + still-open dated items) within the current week (week start per `settings.weekStart`).

---

## 10. Screens, features & acceptance criteria

### 10.1 Today (home)
The screen opened every morning and night; one scrollable page, soft AM/PM sections, with an always-visible **status ring**.

- **Morning/Evening journal**
  - *Done when:* user can write and edit AM and PM entries for the current day; the matching optional prompt shows and can be dismissed/edited; text autosaves (debounced) and survives reload.
- **Mood**
  - *Done when:* 5 faces render; one tap sets the mood on the active entry and persists.
- **Intentions (top-3)**
  - *Done when:* optional short list saves to `day.intentions` and persists.
- **Today's todos**
  - *Done when:* user can add inline, toggle complete, and delete; only items dated today (plus carried-over items) appear; per-todo carry-over toggle works; completing/uncompleting persists and updates the ring.
- **Habit check-ins**
  - *Done when:* only habits scheduled for today appear; a single tap creates/updates today's `habitLog.done`; state persists and feeds streaks; a crisp completion animation plays (respecting reduced-motion).
- **Status ring**
  - *Done when:* shows AM journaled (bool), PM journaled (bool), todos done/total, habits done/total, updating live.

### 10.2 Dashboard
- **Streaks**
  - *Done when:* per-habit current + longest, perfect-day streak, and journaling streak all match a hand calculation on seeded test data, per §9.
- **Week heatmap**
  - *Done when:* last 7–30 days render as cells; a cell lights per the "showed up" rule; today shows a distinct "pending" state; aligns to `weekStart`.
- **Mood sparkline**
  - *Done when:* AM/PM mood plots over a 7/30-day toggle; gaps (null moods) handled gracefully.
- **Todo completion rate (week)**
  - *Done when:* value matches §9 formula.
- **Tag filter**
  - *Done when:* selecting a tag narrows streaks/heatmap/sparkline to entities carrying it.

### 10.3 Manage
- **Habits CRUD**
  - *Done when:* create/edit/archive works; name, emoji, color, tags editable; archiving hides a habit from Today but **retains its logs and historical streaks**.
- **Cadence editor**
  - *Done when:* user picks "daily" or a weekday multi-select; Today respects it same-day.
- **Todo backlog**
  - *Done when:* undated todos are listed and can be scheduled to a date (moves them onto that day).
- **Journal prompts**
  - *Done when:* AM/PM prompt text is editable and can be turned off; changes reflect on Today.
- **Data export/import**
  - *Done when:* Export downloads a full JSON (with `schemaVersion`) and per-entity CSVs; Import accepts a pasted/uploaded habit list (CSV) and creates habits. Round-trip (export → fresh load → import) restores data.
- **Appearance**
  - *Done when:* light/dark toggle and accent color persist across reloads.

### 10.4 Global
- *Done when:* the app works fully offline, is installable (PWA), restores all state on reload, and both themes are completely styled with no unstyled/contrast-failing surfaces.

---

## 11. Suggested project structure

Keep the **data layer isolated** so the persistence choice (Dexie vs. localStorage) is swappable behind a stable repository interface.

```
cairn/
  index.html
  vite.config.ts
  package.json
  tsconfig.json
  tailwind.config.js
  docs/
    PRD.md                      ← this file
  src/
    main.tsx
    App.tsx
    routes/
      Today.tsx
      Dashboard.tsx
      Manage.tsx
    components/
      today/      StatusRing, JournalCard, MoodPicker, Intentions, TodoList, HabitCheckList
      dashboard/  StreakCard, WeekHeatmap, MoodSparkline, CompletionRate, TagFilter
      manage/     HabitEditor, CadencePicker, Backlog, PromptSettings, DataExportImport, AppearanceSettings
      ui/         Button, Card, Toggle, Modal, EmojiPicker
    data/
      db.ts                     ← Dexie setup + tables
      types.ts                  ← Day, Habit, HabitLog, Todo, Settings, Meta
      repositories/             ← typed CRUD: days, habits, habitLogs, todos, settings
      export.ts / import.ts
    lib/
      streaks.ts                ← metric calcs (§9)
      dates.ts                  ← date-fns helpers, week logic
      mood.ts                   ← faces ↔ value
    store/
      useStore.ts               ← Zustand (or context+reducer)
    styles/
      index.css                 ← Tailwind entry
```

---

## 12. Build order (milestones)

- **M0 — Scaffold:** Vite + React + TS + Tailwind; routing/tabs; Dexie schema + typed repositories; theme toggle; seed-data script for testing.
- **M1 — Habits + Todos on Today:** CRUD, single-tap toggles, carry-over, persistence.
- **M2 — Journaling:** AM/PM entries, prompts, mood, intentions.
- **M3 — Dashboard:** streaks, week heatmap, mood sparkline, completion rate, tag filter.
- **M4 — Manage:** habit/cadence editor, backlog scheduling, prompt + appearance settings, export/import.
- **M5 — Polish:** completion animations, accessibility pass, PWA/offline, empty states, mobile-layout QA.

A natural "first usable" cut is **M0–M2** (you can journal and track habits/todos daily); M3 makes it rewarding; M4–M5 make it durable.

---

## 13. Roadmap beyond v1

- **v2 — Quantify & move:** generic tracker-builder; Quantity trackers (finance, weight, water, study hours); Session log (workouts + weekly volume analytics).
- **v3 — Aspire:** Checklists for bucketlists and goals-with-milestones; learning/skills tracker; linking (logging a run advances a "sub-25 5K" goal).
- **v4 — Understand:** analysis layer — tag-based cross-silo views, trends, gentle correlations (e.g., mood on workout vs. rest days), monthly review.

---

## 14. Open questions

1. Hosted (Netlify/Vercel for easy phone install) or run purely locally? Affects PWA/deploy setup only; the app is identical either way.
2. Single accent color preference (or pick during M0)?
3. Any habits/todos you want pre-seeded so the app isn't empty on first launch?