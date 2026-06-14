import { describe, it, expect } from "vitest";
import type { SessionEntry } from "../data/types";
import { weeklyVolume, summarize, sessionsInRange } from "./workouts";

function se(date: string, type: string, dur = 30, dist = 5): SessionEntry {
  return {
    id: `${date}-${type}`,
    trackerId: "t",
    date,
    sessionType: type,
    durationMin: dur,
    distanceKm: dist,
    reps: null,
    intensity: null,
    note: null,
    tags: [],
    createdAt: date,
  };
}

describe("weeklyVolume (Monday weeks, today Sat 2026-06-13)", () => {
  it("buckets sessions into the right weeks", () => {
    const sessions = [
      se("2026-06-08", "Running"), // this week (Mon 06-08)
      se("2026-06-13", "Gym"), // this week
      se("2026-06-02", "Swim"), // last week (Mon 06-01)
    ];
    const vol = weeklyVolume(sessions, "2026-06-13", "monday", 3);
    expect(vol).toHaveLength(3);
    const thisWeek = vol[vol.length - 1];
    expect(thisWeek.weekStart).toBe("2026-06-08");
    expect(thisWeek.sessions).toBe(2);
    expect(thisWeek.durationMin).toBe(60);
    const lastWeek = vol[vol.length - 2];
    expect(lastWeek.sessions).toBe(1);
  });

  it("ignores sessions outside the window", () => {
    const vol = weeklyVolume([se("2020-01-01", "Running")], "2026-06-13", "monday", 4);
    expect(vol.every((v) => v.sessions === 0)).toBe(true);
  });
});

describe("summarize", () => {
  it("totals, by-type, and distinct training days", () => {
    const sessions = [
      se("2026-06-13", "Running", 30, 5),
      se("2026-06-13", "Gym", 40, 0),
      se("2026-06-12", "Running", 20, 3),
    ];
    const s = summarize(sessions);
    expect(s.sessions).toBe(3);
    expect(s.durationMin).toBe(90);
    expect(s.distanceKm).toBe(8);
    expect(s.trainingDays).toBe(2); // 06-13 and 06-12
    expect(s.byType[0]).toEqual({ type: "Running", sessions: 2 });
  });
});

describe("sessionsInRange", () => {
  it("filters by inclusive date range", () => {
    const sessions = [se("2026-06-08", "A"), se("2026-06-15", "B")];
    expect(sessionsInRange(sessions, "2026-06-08", "2026-06-14")).toHaveLength(1);
  });
});
