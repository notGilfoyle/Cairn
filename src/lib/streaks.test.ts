import { describe, it, expect } from "vitest";
import type { Habit, HabitLog, Todo, Day } from "../data/types";
import {
  habitCurrentStreak,
  habitLongestStreak,
  isPerfectDay,
  perfectDayStreak,
  journalingStreak,
  showedUp,
  weekCompletionRate,
  hasJournal,
} from "./streaks";

// Anchor "today" to a fixed Saturday for deterministic weekday math.
// 2026-06-13 is a Saturday (getDay() === 6).
const TODAY = "2026-06-13";
const d = (n: number) => {
  // n days before TODAY, simple string math via Date (local).
  const base = new Date(2026, 5, 13);
  base.setDate(base.getDate() - n);
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, "0");
  const day = String(base.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

function habit(id: string, over: Partial<Habit> = {}): Habit {
  return {
    id,
    name: id,
    emoji: "✅",
    color: "#000",
    cadence: "daily",
    tags: [],
    archived: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    sortOrder: 0,
    ...over,
  };
}

function log(habitId: string, date: string, done = true): HabitLog {
  return { habitId, date, done, note: null };
}

function todo(over: Partial<Todo> = {}): Todo {
  return {
    id: Math.random().toString(36),
    title: "t",
    date: TODAY,
    done: false,
    carryOver: true,
    tags: [],
    createdAt: "",
    completedAt: null,
    ...over,
  };
}

function day(date: string, am?: string, pm?: string): Day {
  return {
    date,
    amJournal: am ? { text: am, mood: 4, savedAt: "" } : null,
    pmJournal: pm ? { text: pm, mood: 3, savedAt: "" } : null,
    intentions: [],
    updatedAt: "",
  };
}

describe("habitCurrentStreak (daily)", () => {
  const h = habit("a");

  it("counts back consecutive done days, today pending does not break", () => {
    // done yesterday, day-2, day-3; today NOT done (pending)
    const logs = [log("a", d(1)), log("a", d(2)), log("a", d(3))];
    expect(habitCurrentStreak(h, logs, TODAY)).toBe(3);
  });

  it("counts today when today is done", () => {
    const logs = [log("a", d(0)), log("a", d(1)), log("a", d(2))];
    expect(habitCurrentStreak(h, logs, TODAY)).toBe(3);
  });

  it("breaks at a missed scheduled day", () => {
    // done today, yesterday; day-2 missing; day-3 done
    const logs = [log("a", d(0)), log("a", d(1)), log("a", d(3))];
    expect(habitCurrentStreak(h, logs, TODAY)).toBe(2);
  });

  it("is 0 with no logs", () => {
    expect(habitCurrentStreak(h, [], TODAY)).toBe(0);
  });

  it("a done=false log breaks the streak", () => {
    const logs = [log("a", d(1)), log("a", d(2), false), log("a", d(3))];
    expect(habitCurrentStreak(h, logs, TODAY)).toBe(1);
  });
});

describe("habitCurrentStreak (weekdays Mon–Fri)", () => {
  // TODAY is Sat; weekdays cadence skips Sat/Sun.
  const h = habit("w", { cadence: { weekdays: [1, 2, 3, 4, 5] } });

  it("weekend gap does not break; counts Fri/Thu/Wed", () => {
    // d(1)=Fri, d(2)=Thu, d(3)=Wed done. Sat(today)/Sun not scheduled.
    const logs = [log("w", d(1)), log("w", d(2)), log("w", d(3))];
    expect(habitCurrentStreak(h, logs, TODAY)).toBe(3);
  });
});

describe("habitLongestStreak", () => {
  const h = habit("a");
  it("finds the longest historical run", () => {
    // run of 3 (d5,d4,d3), gap at d2, run of 2 (d1,d0)
    const logs = [
      log("a", d(5)),
      log("a", d(4)),
      log("a", d(3)),
      log("a", d(1)),
      log("a", d(0)),
    ];
    expect(habitLongestStreak(h, logs, TODAY)).toBe(3);
  });
});

describe("perfect days", () => {
  const h1 = habit("h1");
  const h2 = habit("h2");

  it("isPerfectDay true only when all scheduled habits done", () => {
    const logs = [log("h1", d(1)), log("h2", d(1))];
    expect(isPerfectDay([h1, h2], logs, d(1))).toBe(true);
    expect(isPerfectDay([h1, h2], [log("h1", d(1))], d(1))).toBe(false);
  });

  it("perfectDayStreak counts back, today pending excluded", () => {
    // d1 and d2 perfect; today incomplete (pending)
    const logs = [
      log("h1", d(1)),
      log("h2", d(1)),
      log("h1", d(2)),
      log("h2", d(2)),
      log("h1", d(0)), // today only h1 done -> pending, excluded
    ];
    expect(perfectDayStreak([h1, h2], logs, TODAY)).toBe(2);
  });
});

describe("journalingStreak", () => {
  it("counts consecutive journaled days, today pending ok", () => {
    const days = [day(d(1), "a"), day(d(2), undefined, "b"), day(d(3), "c")];
    expect(journalingStreak(days, TODAY)).toBe(3);
  });
  it("breaks on a gap", () => {
    const days = [day(d(1), "a"), day(d(3), "c")]; // d2 missing
    expect(journalingStreak(days, TODAY)).toBe(1);
  });
  it("hasJournal ignores empty text", () => {
    expect(hasJournal(day(d(1), "   "))).toBe(false);
    expect(hasJournal(day(d(1), "x"))).toBe(true);
  });
});

describe("showedUp", () => {
  const h = habit("a");
  it("requires journal AND (habit done or todo done)", () => {
    const dy = day(TODAY, "wrote");
    expect(showedUp(TODAY, dy, [h], [log("a", TODAY)], [])).toBe(true);
    // journal but nothing done
    expect(showedUp(TODAY, dy, [h], [], [])).toBe(false);
    // habit done but no journal
    expect(showedUp(TODAY, day(TODAY), [h], [log("a", TODAY)], [])).toBe(false);
    // journal + completed todo
    expect(showedUp(TODAY, dy, [h], [], [todo({ done: true })])).toBe(true);
  });
});

describe("weekCompletionRate", () => {
  it("completed / (completed + open) within the week", () => {
    // Week start Monday. TODAY=Sat 2026-06-13; week Mon 06-08..Sun 06-14.
    const todos = [
      todo({ date: "2026-06-09", done: true }),
      todo({ date: "2026-06-10", done: true }),
      todo({ date: "2026-06-11", done: false }),
      todo({ date: "2026-06-01", done: true }), // prior week, ignored
    ];
    expect(weekCompletionRate(todos, TODAY, "monday")).toBeCloseTo(2 / 3);
  });
  it("returns null when no dated items in week", () => {
    expect(weekCompletionRate([todo({ date: null })], TODAY, "monday")).toBeNull();
  });
});
