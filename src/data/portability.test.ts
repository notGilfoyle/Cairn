import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import {
  habitsRepo,
  todosRepo,
  daysRepo,
  trackersRepo,
  quantityEntriesRepo,
  sessionEntriesRepo,
  settingsRepo,
} from "./repositories";
import { exportJSON } from "./export";
import { parseCSV, importHabitsCSV, importFullJSON } from "./import";
import { today } from "../lib/dates";

beforeEach(async () => {
  await Promise.all([
    db.habits.clear(),
    db.habitLogs.clear(),
    db.todos.clear(),
    db.days.clear(),
    db.settings.clear(),
    db.meta.clear(),
    db.trackers.clear(),
    db.quantityEntries.clear(),
    db.sessionEntries.clear(),
  ]);
});

describe("parseCSV", () => {
  it("handles quoted cells with commas and escaped quotes", () => {
    const rows = parseCSV('name,note\n"Gym, hard","say ""hi"""\n');
    expect(rows).toEqual([
      ["name", "note"],
      ["Gym, hard", 'say "hi"'],
    ]);
  });
});

describe("importHabitsCSV", () => {
  it("creates habits, parsing cadence and tags", async () => {
    const csv = [
      "name,emoji,color,cadence,tags",
      "Drink water,💧,#3b82f6,daily,health",
      "Gym,💪,#ef4444,Mon|Wed|Fri,fitness|strength",
    ].join("\n");

    const { created } = await importHabitsCSV(csv);
    expect(created).toBe(2);

    const habits = await habitsRepo.all();
    const gym = habits.find((h) => h.name === "Gym")!;
    expect(gym.cadence).toEqual({ weekdays: [1, 3, 5] });
    expect(gym.tags).toEqual(["fitness", "strength"]);

    const water = habits.find((h) => h.name === "Drink water")!;
    expect(water.cadence).toBe("daily");
  });

  it("treats a headerless single column as names", async () => {
    const { created } = await importHabitsCSV("Read\nMeditate\n");
    expect(created).toBe(2);
    expect((await habitsRepo.all()).map((h) => h.name).sort()).toEqual(["Meditate", "Read"]);
  });
});

describe("full JSON round-trip", () => {
  it("export → clear → restore reproduces the data", async () => {
    const h = await habitsRepo.create({
      name: "Read",
      emoji: "📚",
      color: "#3b82f6",
      cadence: "daily",
      tags: ["learning"],
    });
    await todosRepo.create({ title: "ship", date: today(), done: true });
    await daysRepo.setJournal(today(), "am", { text: "hello", mood: 4 });

    const json = await exportJSON();

    // wipe
    await Promise.all([db.habits.clear(), db.todos.clear(), db.days.clear()]);
    expect(await habitsRepo.all()).toHaveLength(0);

    await importFullJSON(json);

    const habits = await habitsRepo.all();
    expect(habits).toHaveLength(1);
    expect(habits[0].id).toBe(h.id);
    expect(habits[0].tags).toEqual(["learning"]);

    const day = await daysRepo.get(today());
    expect(day?.amJournal?.text).toBe("hello");
    expect((await todosRepo.all())[0].title).toBe("ship");
  });

  it("rejects a non-Cairn JSON", async () => {
    await expect(importFullJSON('{"foo":1}')).rejects.toThrow(/schemaVersion/);
  });
});

describe("v2 trackers round-trip & version-aware import", () => {
  it("export → clear → restore reproduces trackers and entries (schemaVersion 2)", async () => {
    const finance = await trackersRepo.create({
      name: "Finance",
      type: "quantity",
      emoji: "💰",
      color: "#10b981",
      tags: [],
      presetKey: "finance",
      unit: "₹",
      aggregation: "sum",
      allowsNegative: true,
      direction: "neutral",
      goal: null,
      sessionTypes: [],
    });
    await quantityEntriesRepo.create({
      trackerId: finance.id,
      date: today(),
      amount: -250,
      tags: ["food"],
    });
    const workouts = await trackersRepo.create({
      name: "Workouts",
      type: "session",
      emoji: "🏋️",
      color: "#ef4444",
      tags: [],
      presetKey: "workouts",
      unit: null,
      aggregation: null,
      allowsNegative: false,
      direction: null,
      goal: null,
      sessionTypes: ["Running", "Gym"],
    });
    await sessionEntriesRepo.create({
      trackerId: workouts.id,
      date: today(),
      sessionType: "Running",
      durationMin: 30,
      distanceKm: 5,
    });

    const json = await exportJSON();
    expect(JSON.parse(json).schemaVersion).toBe(2);

    await Promise.all([
      db.trackers.clear(),
      db.quantityEntries.clear(),
      db.sessionEntries.clear(),
    ]);
    await importFullJSON(json);

    expect(await trackersRepo.all()).toHaveLength(2);
    const qe = await quantityEntriesRepo.forTracker(finance.id);
    expect(qe[0].amount).toBe(-250);
    expect(qe[0].tags).toEqual(["food"]);
    const se = await sessionEntriesRepo.forTracker(workouts.id);
    expect(se[0].sessionType).toBe("Running");
    expect(se[0].distanceKm).toBe(5);
  });

  it("imports a v1-shaped export cleanly, leaving tracker stores empty", async () => {
    // A v1 export: schemaVersion 1, no tracker keys at all.
    const v1 = JSON.stringify({
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      meta: { key: "meta", schemaVersion: 1, appVersion: "0.1.0", createdAt: "", seededDefaults: true },
      settings: { key: "settings", theme: "light", accent: "indigo", weekStart: "monday" },
      days: [],
      habits: [{ id: "h1", name: "Read", emoji: "📚", color: "#3b82f6", cadence: "daily", tags: [], archived: false, createdAt: "", sortOrder: 0 }],
      habitLogs: [],
      todos: [],
    });

    await importFullJSON(v1);

    expect(await habitsRepo.all()).toHaveLength(1);
    expect(await trackersRepo.all()).toHaveLength(0);
    expect(await quantityEntriesRepo.all()).toHaveLength(0);
    // Settings missing `currency` should be backfilled to the default on read.
    expect((await settingsRepo.get()).currency).toBe("₹");
  });
});
