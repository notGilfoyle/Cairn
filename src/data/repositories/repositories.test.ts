import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../db";
import { habitsRepo } from "./habits";
import { habitLogsRepo } from "./habitLogs";
import { todosRepo } from "./todos";
import { daysRepo } from "./days";
import { settingsRepo } from "./settings";
import { today, addDaysStr } from "../../lib/dates";

beforeEach(async () => {
  await Promise.all([
    db.habits.clear(),
    db.habitLogs.clear(),
    db.todos.clear(),
    db.days.clear(),
    db.settings.clear(),
  ]);
});

describe("habits + logs", () => {
  it("creates a habit and toggles a check-in idempotently by [habitId+date]", async () => {
    const h = await habitsRepo.create({
      name: "Read",
      emoji: "📚",
      color: "#3b82f6",
      cadence: "daily",
      tags: [],
    });
    const d = today();

    const log1 = await habitLogsRepo.toggle(h.id, d);
    expect(log1.done).toBe(true);

    const log2 = await habitLogsRepo.toggle(h.id, d);
    expect(log2.done).toBe(false);

    // Only one log row exists for that habit/date (compound key upsert).
    const all = await habitLogsRepo.forHabit(h.id);
    expect(all).toHaveLength(1);
  });

  it("removing a habit also removes its logs", async () => {
    const h = await habitsRepo.create({
      name: "Run",
      emoji: "🏃",
      color: "#ef4444",
      cadence: "daily",
      tags: [],
    });
    await habitLogsRepo.set(h.id, today(), true);
    await habitsRepo.remove(h.id);
    expect(await habitsRepo.get(h.id)).toBeUndefined();
    expect(await habitLogsRepo.forHabit(h.id)).toHaveLength(0);
  });
});

describe("todos", () => {
  it("round-trips create/toggle/carry and separates backlog from dated", async () => {
    const dated = await todosRepo.create({ title: "Today task", date: today() });
    await todosRepo.create({ title: "Someday", date: null });

    expect(await todosRepo.backlog()).toHaveLength(1);
    expect(await todosRepo.forDate(today())).toHaveLength(1);

    const done = await todosRepo.setDone(dated.id, true);
    expect(done?.done).toBe(true);
    expect(done?.completedAt).not.toBeNull();
  });

  it("carriedInto surfaces undone carry-over todos from earlier days only", async () => {
    const d = today();
    await todosRepo.create({ title: "yesterday undone", date: addDaysStr(d, -1), carryOver: true });
    await todosRepo.create({ title: "yesterday done", date: addDaysStr(d, -1), carryOver: true, done: true });
    await todosRepo.create({ title: "no-carry", date: addDaysStr(d, -1), carryOver: false });

    const carried = await todosRepo.carriedInto(d);
    expect(carried.map((t) => t.title)).toEqual(["yesterday undone"]);
  });
});

describe("days + settings", () => {
  it("persists journal text + mood and merges slots independently", async () => {
    const d = today();
    await daysRepo.setJournal(d, "am", { text: "morning", mood: 4 });
    await daysRepo.setMood(d, "pm", 2);

    const day = await daysRepo.get(d);
    expect(day?.amJournal?.text).toBe("morning");
    expect(day?.amJournal?.mood).toBe(4);
    expect(day?.pmJournal?.mood).toBe(2);
    expect(day?.pmJournal?.text).toBe("");
  });

  it("merges concurrent mutations to different fields without losing updates", async () => {
    const d = today();
    // Fire journal text, mood, and intentions writes in the same tick.
    await Promise.all([
      daysRepo.setJournal(d, "am", { text: "focused" }),
      daysRepo.setMood(d, "am", 4),
      daysRepo.patch(d, { intentions: ["ship", "walk"] }),
    ]);

    const day = await daysRepo.get(d);
    expect(day?.amJournal?.text).toBe("focused");
    expect(day?.amJournal?.mood).toBe(4);
    expect(day?.intentions).toEqual(["ship", "walk"]);
  });

  it("defaults settings and patches a field", async () => {
    const s0 = await settingsRepo.get();
    expect(s0.weekStart).toBe("monday");
    const s1 = await settingsRepo.patch({ accent: "emerald" });
    expect(s1.accent).toBe("emerald");
    expect((await settingsRepo.get()).accent).toBe("emerald");
  });
});
