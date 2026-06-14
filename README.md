# Cairn

A fast, calm, **local-first** daily-ritual app: morning/evening journaling, today's
todos, and habit check-ins — rolled up into a dashboard of streaks and trends.
No backend, no account, no network calls. Your data never leaves the device.

> A cairn is the stack of stones that marks a trail.

## Stack

- **React + TypeScript + Vite**
- **Tailwind CSS** (class-based dark mode; accent driven by CSS variables)
- **Zustand** for global state
- **Dexie.js / IndexedDB** for persistence (isolated behind repositories)
- **date-fns** for streak/week math — dates stored as local `YYYY-MM-DD`, never UTC
- Hand-rolled **SVG** charts (heatmap, mood sparkline, rings)
- **vite-plugin-pwa** — installable, works offline

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest unit tests (metrics + data round-trip)
npm run build      # typecheck + production build (emits PWA service worker)
npm run preview    # serve the production build (use this to test offline/install)
```

## Architecture

The persistence layer is isolated so the storage choice stays swappable:

- `src/data/db.ts` — Dexie setup (the only module that touches tables directly)
- `src/data/repositories/*` — typed CRUD per entity (days, habits, habitLogs, todos, settings, meta)
- `src/data/types.ts` — domain model (PRD §8)
- `src/data/export.ts` / `import.ts` — JSON backup + CSV import/export
- `src/lib/streaks.ts` — pure metric calculations (PRD §9), fully unit-tested
- `src/lib/dates.ts` — local-date helpers and week math
- `src/store/useStore.ts` — Zustand store + selectors
- `src/routes/` — Today, Dashboard, Manage
- `src/components/{today,dashboard,manage,ui}/` — feature components

## Data & privacy

All data lives in your browser's IndexedDB. Use **Manage → Data** to export a full
JSON backup (or per-entity CSVs) and to restore/import. Nothing is ever transmitted.

## Seed data

On first launch Cairn plants a few starter habits and todos. For testing the
dashboard with history, run in the browser console:

```js
import("/src/data/seed.ts").then((m) => m.seedDemoData(30));
```

See `docs/prd.md` for the full product spec.
