import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { habitsRepo, todosRepo, daysRepo } from "./repositories";
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
