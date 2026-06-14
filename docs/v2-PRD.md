# Cairn — v2 PRD: "Quantify & Move"
**Status:** Ready to build · **Builds on:** the v1 codebase (`cairn-v1-prd.md`) · **Type:** Local-first web app
*This document is additive — it extends v1 rather than replacing it. Stack, conventions, and non-functional requirements are unchanged from v1 unless noted. The build task list is in §9.*

---

## 1. What v2 adds (the idea)

v1 lit up three of the five primitives (Check-in → habits, Checklist → todos, Journal). v2 lights up the remaining two and makes them user-extensible:

- **Quantity** primitive → finance, weight, water, study hours — any number logged over time.
- **Session log** primitive → workouts (running, calisthenics, gym, swim, basketball) with weekly volume analytics.
- **A generic tracker builder** → the "add a new thing to track" capability from the original brief. Finance, weight, workouts, etc. are not hardcoded screens; they are **tracker definitions** the user (or a preset) configures. Adding a new tracker never requires code.

Habits, todos, and journaling are untouched and keep their dedicated v1 UX.

---

## 2. Scope

**In:** the tracker engine (quantity + session types) · a tracker builder · a preset library · fast logging integrated into Today · a tracker detail view with charts · new dashboard analytics (quantity summaries, finance, workout volume) · entry-level tags · a **data-preserving v1→v2 schema migration** · version-aware export/import.

**Out (deferred):** Checklist trackers for bucketlists/goals (v3) · learning/skills tracker (v3) · cross-module linking, e.g. workout → goal (v3) · cross-silo analysis & correlations (v4) · recurring transactions, budgets, multi-account finance (later) · folding habits into the generic tracker model (later, optional).

---

## 3. Decisions

| # | Decision | Choice |
|---|---|---|
| 1 | Stack & NFRs | **Unchanged from v1** (React + TS + Vite + Tailwind, Zustand, Dexie/IndexedDB, date-fns, PWA, local-first, dates as local `YYYY-MM-DD`). |
| 2 | What the builder covers | **Quantity + Session** trackers. Habits stay a separate v1 concept (migration path noted in §10). |
| 3 | Finance model | A **Quantity tracker with signed amounts** (`allowsNegative: true`) + **tags as categories**. Dashboard shows in / out / net + by-category. No bespoke ledger schema. |
| 4 | Workouts model | **One** "Workouts" session tracker holding multiple `sessionTypes`, not one tracker per activity. Gives unified weekly volume while still filterable by type. |
| 5 | Presets | Ship Finance, Weight, Water, Study Hours, Workouts as pre-filled tracker configs so the user isn't staring at a blank builder. |
| 6 | Currency | `settings.currency`, default `₹` (locale: India), user-editable. |

---

## 4. Data model — additions only

New Dexie object stores. **Do not alter the v1 stores** (`days`, `habits`, `habitLogs`, `todos`, `settings`, `meta`). Add `settings.currency`.

```
trackers          (id), index: type, archived, sortOrder
  id
  name
  type            "quantity" | "session"
  emoji
  color
  tags            string[]
  archived        boolean
  createdAt
  sortOrder
  presetKey       string | null
  // quantity-only:
  unit            string | null          // "₹", "kg", "ml", "hrs", "km"
  aggregation     "sum" | "average" | "latest" | "count"
  allowsNegative  boolean                 // true = ledger style (finance)
  direction       "up_good" | "down_good" | "neutral"   // trend coloring
  goal            { period: "day"|"week"|"month", target: number } | null
  // session-only:
  sessionTypes    string[]                // ["Running","Calisthenics","Gym","Swim","Basketball"]

quantityEntries   (id), index: [trackerId+date], date, trackerId
  id
  trackerId
  date            YYYY-MM-DD
  amount          number                  // may be negative iff tracker.allowsNegative
  note            string | null
  tags            string[]                // entry-level, e.g. finance category
  createdAt

sessionEntries    (id), index: [trackerId+date], date, trackerId
  id
  trackerId
  date            YYYY-MM-DD
  sessionType     string                  // one of tracker.sessionTypes
  durationMin     number | null
  distanceKm      number | null
  reps            number | null
  intensity       1–5 | null              // optional RPE
  note            string | null
  tags            string[]
  createdAt
```

**Preset configs:**
- **Finance** — quantity, unit `₹`, `allowsNegative: true`, `aggregation: sum`, `direction: neutral`.
- **Weight** — quantity, unit `kg`, `allowsNegative: false`, `aggregation: latest`, `direction: neutral`.
- **Water** — quantity, unit `ml`, `aggregation: sum`, `direction: up_good`, `goal: { day, 2000 }`.
- **Study hours** — quantity, unit `hrs`, `aggregation: sum`, `direction: up_good`, goal user-set.
- **Workouts** — session, `sessionTypes: [Running, Calisthenics, Gym, Swim, Basketball]`.

---

## 5. Schema migration (do this carefully — v1 has live user data)

This is the highest-risk part of v2. The upgrade must be **purely additive and lossless**.

- Declare a **new Dexie version (2)** that adds `trackers`, `quantityEntries`, `sessionEntries` and leaves every v1 store's schema exactly as-is. Dexie applies additive stores without touching existing data — no manual row migration needed.
- On upgrade, set `meta.schemaVersion = 2` and add `settings.currency` (default `₹`) if absent.
- **Export** now includes the new entities and is stamped with `schemaVersion: 2`.
- **Import** must be **version-aware**: accept both v1 (`schemaVersion: 1`) and v2 exports; a v1 import simply leaves the new stores empty. A full export → fresh DB → import round-trip must reproduce all data.
- **Acceptance:** after upgrading a populated v1 database, all v1 data (days, habits, habit logs, todos, settings) is intact and the app still behaves exactly as in v1.

---

## 6. Screens, features & acceptance criteria

### 6.1 Trackers hub (new route)
A list of the user's quantity & session trackers as cards, each showing a mini current value, plus a "+ New tracker" action.
- *Done when:* all non-archived trackers render as cards; tapping a card opens its detail (§6.4); the new-tracker action opens the builder; archived trackers are hidden but recoverable from Manage.

### 6.2 Tracker builder (+ presets)
- *Done when:* user can start from a preset (pre-filled) or blank; choose type (quantity/session); set name, emoji, color, tags; configure the type-specific fields (quantity: unit, aggregation, allowsNegative, direction, optional goal; session: sessionTypes); save creates a tracker. Editing updates it; archiving hides it from logging/dashboard while **retaining its entries**.

### 6.3 Logging (fast — the daily loop stays sacred)
- *Done when:* a quick-log flow lets the user pick a tracker and record a value (quantity) or a session (type + any of duration/distance/reps/intensity) in **≤2 taps plus a number**; reachable from a global "+ Log" and from a collapsible "Track" section on the **Today** screen showing active trackers; entries support add/edit/delete; dates are local `YYYY-MM-DD`; quantity entries accept negatives only when `allowsNegative`; entry-level tags work (finance category).

### 6.4 Tracker detail + charts
- *Done when:* a detail view lists the tracker's entries (edit/delete) and renders a chart — a **line/area** over time for quantity (honoring `aggregation`), or **weekly volume bars** for session — both hand-rolled SVG; if a `goal` is set, goal progress for the current period is shown.

### 6.5 Dashboard additions
New cards alongside the v1 streak/heatmap/mood widgets.
- **Measure card** (`allowsNegative: false`): period aggregation value + sparkline + goal progress, with trend color driven by `direction`.
- **Ledger card** (`allowsNegative: true`, i.e. Finance): **in / out / net** for the selected period plus a breakdown **by tag (category)**.
- **Workouts card:** weekly volume — sessions count, total duration, total distance, and a by-type breakdown, plus a "training days this week" stat.
- *Done when:* each card computes correctly against seeded data; a week/month period selector applies where relevant; the existing tag filter extends to the new entities.

---

## 7. Project structure additions

Extends the v1 tree (§11 of the v1 PRD). Keep the data layer behind the existing repository pattern.

```
src/
  routes/
    Trackers.tsx                 ← new hub
  components/
    trackers/
      TrackerCard, TrackerBuilder, PresetPicker, QuickLog,
      TrackerDetail, QuantityChart, SessionVolumeChart, GoalProgress
    dashboard/
      MeasureCard, LedgerCard, WorkoutsCard     ← new dashboard widgets
    today/
      TrackSection                ← collapsible quick-log on Today
  data/
    types.ts                      ← add Tracker, QuantityEntry, SessionEntry
    repositories/
      trackers.ts, quantityEntries.ts, sessionEntries.ts   ← new
    db.ts                         ← Dexie version 2 (additive stores)
    export.ts / import.ts         ← version-aware
  lib/
    aggregate.ts                  ← quantity aggregation + ledger in/out/net
    workouts.ts                   ← weekly volume calcs
```

---

## 8. Build order (milestones)

- **M6 — Data layer & migration:** Dexie v2 stores, types, repositories, schemaVersion bump, version-aware export/import; verify v1 data intact.
- **M7 — Tracker builder + library:** trackers hub, presets, builder, edit/archive.
- **M8 — Logging:** quick-log, global add, Today "Track" section, entry CRUD + tags.
- **M9 — Tracker detail + charts:** detail view, quantity line chart, session volume bars, goal progress.
- **M10 — Dashboard analytics:** measure card, ledger/finance card, workouts card, period selector.
- **M11 — Polish:** empty states, mobile QA, accessibility, animations, v2 export/import round-trip test.

**First usable cut:** M6–M8 (create trackers; log finance/weight/water/workouts). M9–M10 deliver the payoff (charts + analytics).

---

## 9. To-be-done checklist (Claude Code task list)

### M6 — Data layer & migration
- [ ] Bump Dexie DB to version 2; add `trackers`, `quantityEntries`, `sessionEntries` stores with the indexes in §4 — **do not modify v1 stores**
- [ ] Add types `Tracker`, `QuantityEntry`, `SessionEntry` to `types.ts`
- [ ] Add typed repositories `trackers.ts`, `quantityEntries.ts`, `sessionEntries.ts`
- [ ] On upgrade, set `meta.schemaVersion = 2` and add `settings.currency` (default `₹`)
- [ ] Update `export.ts` to include new entities, stamped `schemaVersion: 2`
- [ ] Make `import.ts` version-aware (accept v1 and v2 exports); round-trip preserves all data
- [ ] Verify on a populated v1 DB that all v1 data survives the upgrade and v1 behavior is unchanged

### M7 — Tracker builder + library
- [ ] Add `Trackers.tsx` route listing quantity & session trackers as cards
- [ ] "New tracker" flow with **preset or blank** choice
- [ ] Implement preset library (Finance, Weight, Water, Study Hours, Workouts) per §4
- [ ] Build the tracker builder form (shared fields + type-specific config + tags)
- [ ] Edit and archive a tracker (archive hides it but keeps entries)

### M8 — Logging
- [ ] `QuickLog` component: pick tracker → log value (quantity) or session (type + metrics)
- [ ] Global "+ Log" entry point
- [ ] Collapsible "Track" section on the Today screen for fast logging (≤2 taps + a number)
- [ ] Entry CRUD for quantity and session; dates stored as local `YYYY-MM-DD`
- [ ] Negative amounts allowed only when `tracker.allowsNegative`
- [ ] Entry-level tags (finance category)

### M9 — Tracker detail + charts
- [ ] Tracker detail view with entry list + edit/delete
- [ ] Quantity chart (SVG line/area), honoring `aggregation`
- [ ] Session chart (SVG weekly volume bars)
- [ ] Goal progress display for the current period when a goal is set

### M10 — Dashboard analytics
- [ ] Measure card: aggregation + sparkline + goal progress + `direction` trend color
- [ ] Ledger card (Finance): in / out / net for the period + by-tag breakdown
- [ ] Workouts card: sessions count, total duration, total distance, by-type, training-days-this-week
- [ ] Week/month period selector; extend the existing tag filter to new entities

### M11 — Polish
- [ ] Empty states for trackers, entries, and charts
- [ ] Mobile layout QA (logging must be fast on a phone)
- [ ] Accessibility pass for new UI (keyboard, contrast, reduced-motion)
- [ ] Log/completion animations consistent with v1
- [ ] v2 export/import round-trip test; keep the periodic-backup nudge

---

## 10. After v2

- **v3 — Aspire:** Checklist trackers (bucketlists, goals + milestones), a learning/skills tracker, and cross-module **linking** (e.g. logging a run advances a "sub-25 5K" goal). Optionally fold habits into the unified tracker model.
- **v4 — Understand:** the analysis layer — tag-based cross-silo views, trends over time, gentle correlations (mood on workout vs. rest days), and a monthly review.

The architecture keeps paying off: each future version is mostly "switch on a primitive (or a new view) and reuse the tracker engine and data layer you now have."