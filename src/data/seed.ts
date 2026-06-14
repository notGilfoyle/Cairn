import {
  habitsRepo,
  todosRepo,
  daysRepo,
  habitLogsRepo,
  metaRepo,
  trackersRepo,
  quantityEntriesRepo,
  sessionEntriesRepo,
} from "./repositories";
import type { Mood } from "./types";
import { today, addDaysStr, weekdayOf } from "../lib/dates";
import { isScheduledOn } from "../lib/cadence";
import { PRESETS } from "./presets";

/**
 * Sensible defaults shown on first launch so the app isn't empty (per the
 * settled decision this session). Easy for the user to delete.
 */
const DEFAULT_HABITS = [
  { name: "Exercise", emoji: "🏃", color: "#ef4444", cadence: "daily" as const, tags: ["fitness"] },
  { name: "Read", emoji: "📚", color: "#3b82f6", cadence: "daily" as const, tags: ["learning"] },
  { name: "Meditate", emoji: "🧘", color: "#8b5cf6", cadence: "daily" as const, tags: ["mind"] },
  {
    name: "Deep work",
    emoji: "💻",
    color: "#10b981",
    cadence: { weekdays: [1, 2, 3, 4, 5] },
    tags: ["work"],
  },
];

const DEFAULT_TODOS = [
  { title: "Set up my first habits", tags: [] as string[] },
  { title: "Write an evening reflection", tags: [] as string[] },
];

/** Run once, on a fresh install, to plant starter content. */
export async function seedDefaultsIfEmpty(): Promise<void> {
  const meta = await metaRepo.ensure();
  if (meta.seededDefaults) return;

  const habitCount = (await habitsRepo.all()).length;
  const todoCount = (await todosRepo.all()).length;

  if (habitCount === 0) {
    for (let i = 0; i < DEFAULT_HABITS.length; i++) {
      await habitsRepo.create({ ...DEFAULT_HABITS[i], sortOrder: i });
    }
  }
  if (todoCount === 0) {
    const d = today();
    for (const t of DEFAULT_TODOS) {
      await todosRepo.create({ title: t.title, date: d, tags: t.tags });
    }
  }

  await metaRepo.patch({ seededDefaults: true });
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

/**
 * Dev-only: backfill ~`days` days of habit logs and journals so the dashboard
 * has something to chart. NOT called automatically; invoke from the console:
 *   import("/src/data/seed.ts").then(m => m.seedDemoData())
 */
export async function seedDemoData(days = 30): Promise<void> {
  await seedDefaultsIfEmpty();
  const habits = await habitsRepo.active();
  const end = today();

  const moods: Mood[] = [3, 4, 5, 4, 3, 2, 4, 5];
  const amTexts = [
    "Calm start. Focus on the one thing.",
    "Slept well. Ready to move.",
    "A bit groggy but here.",
    "Excited about the project.",
  ];
  const pmTexts = [
    "Good day overall. Shipped a chunk.",
    "Tired but satisfied.",
    "Rough afternoon, recovered by evening.",
    "Learned something new about myself.",
  ];

  for (let i = days - 1; i >= 0; i--) {
    const date = addDaysStr(end, -i);
    const wd = weekdayOf(date);

    // Skip some days entirely to create realistic gaps.
    const skip = i % 9 === 0;
    if (skip) continue;

    // Habit logs: mark done with ~75% probability on scheduled days.
    for (const h of habits) {
      if (!isScheduledOn(h.cadence, date)) continue;
      const done = (i + h.name.length + wd) % 4 !== 0;
      await habitLogsRepo.set(h.id, date, done);
    }

    // Journals on most days.
    if (i % 5 !== 0) {
      await daysRepo.setJournal(date, "am", {
        text: pick(amTexts, i),
        mood: pick(moods, i),
      });
    }
    if (i % 4 !== 0) {
      await daysRepo.setJournal(date, "pm", {
        text: pick(pmTexts, i + 1),
        mood: pick(moods, i + 2),
      });
    }
  }
}

/**
 * Dev-only (v2): create the Finance, Water, and Workouts trackers if missing and
 * backfill ~`days` days of entries so charts/analytics have something to show.
 * Run from the console:
 *   import("/src/data/seed.ts").then(m => m.seedTrackerDemo())
 */
export async function seedTrackerDemo(days = 35): Promise<void> {
  const existing = await trackersRepo.all();
  const ensure = async (key: string) => {
    const found = existing.find((t) => t.presetKey === key);
    if (found) return found;
    const preset = PRESETS.find((p) => p.key === key)!;
    return trackersRepo.create({ ...preset.config });
  };

  const finance = await ensure("finance");
  const water = await ensure("water");
  const workouts = await ensure("workouts");

  const end = today();
  const categories = ["food", "transport", "rent", "fun", "salary"];

  for (let i = days - 1; i >= 0; i--) {
    const date = addDaysStr(end, -i);
    const wd = weekdayOf(date);

    // Finance: a couple of spends most days, salary on the 1st-ish.
    if (i % 1 === 0) {
      await quantityEntriesRepo.create({
        trackerId: finance.id,
        date,
        amount: -(50 + ((i * 37) % 400)),
        tags: [categories[i % 4]],
      });
    }
    if (i % 30 === 5) {
      await quantityEntriesRepo.create({ trackerId: finance.id, date, amount: 50000, tags: ["salary"] });
    }

    // Water: 1–3 logs/day adding toward ~2000ml.
    if (i % 7 !== 0) {
      await quantityEntriesRepo.create({ trackerId: water.id, date, amount: 500 });
      await quantityEntriesRepo.create({ trackerId: water.id, date, amount: 250 + ((i * 53) % 800) });
    }

    // Workouts: ~3–4 sessions/week.
    if ([1, 3, 5, 6].includes(wd)) {
      const types = ["Running", "Gym", "Calisthenics", "Swim", "Basketball"];
      const type = types[(i + wd) % types.length];
      await sessionEntriesRepo.create({
        trackerId: workouts.id,
        date,
        sessionType: type,
        durationMin: 30 + ((i * 7) % 40),
        distanceKm: type === "Running" ? 4 + ((i * 3) % 6) : null,
        intensity: (((i % 5) + 1) as Mood),
      });
    }
  }
}

/** Wipe everything (dev helper / used by import-replace). */
export async function clearAllData(): Promise<void> {
  await Promise.all([
    daysRepo.clear(),
    habitsRepo.clear(),
    habitLogsRepo.clear(),
    todosRepo.clear(),
    trackersRepo.clear(),
    quantityEntriesRepo.clear(),
    sessionEntriesRepo.clear(),
  ]);
}
