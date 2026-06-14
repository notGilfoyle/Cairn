import type { SessionEntry, WeekStart, DateStr } from "../data/types";
import { weekStartFor, addDaysStr } from "./dates";

export interface WeekVolume {
  weekStart: DateStr;
  sessions: number;
  durationMin: number;
  distanceKm: number;
}

/** Group sessions into the N most recent weeks (oldest→newest) ending at `today`. */
export function weeklyVolume(
  sessions: SessionEntry[],
  today: DateStr,
  weekStart: WeekStart,
  weeks: number,
): WeekVolume[] {
  const thisWeek = weekStartFor(today, weekStart);
  const buckets: WeekVolume[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    buckets.push({
      weekStart: addDaysStr(thisWeek, -i * 7),
      sessions: 0,
      durationMin: 0,
      distanceKm: 0,
    });
  }
  const index = new Map(buckets.map((b, i) => [b.weekStart, i]));
  for (const s of sessions) {
    const ws = weekStartFor(s.date, weekStart);
    const i = index.get(ws);
    if (i === undefined) continue;
    buckets[i].sessions += 1;
    buckets[i].durationMin += s.durationMin ?? 0;
    buckets[i].distanceKm += s.distanceKm ?? 0;
  }
  return buckets;
}

export interface WorkoutSummary {
  sessions: number;
  durationMin: number;
  distanceKm: number;
  byType: { type: string; sessions: number }[];
  trainingDays: number; // distinct dates with ≥1 session
}

/** Summary over a set of sessions (e.g. the current week). */
export function summarize(sessions: SessionEntry[]): WorkoutSummary {
  const byType = new Map<string, number>();
  const days = new Set<DateStr>();
  let durationMin = 0;
  let distanceKm = 0;
  for (const s of sessions) {
    byType.set(s.sessionType, (byType.get(s.sessionType) ?? 0) + 1);
    days.add(s.date);
    durationMin += s.durationMin ?? 0;
    distanceKm += s.distanceKm ?? 0;
  }
  return {
    sessions: sessions.length,
    durationMin,
    distanceKm,
    byType: [...byType.entries()]
      .map(([type, sessions]) => ({ type, sessions }))
      .sort((a, b) => b.sessions - a.sessions),
    trainingDays: days.size,
  };
}

/** Sessions whose date falls in [from,to]. */
export function sessionsInRange(
  sessions: SessionEntry[],
  from: DateStr,
  to: DateStr,
): SessionEntry[] {
  return sessions.filter((s) => s.date >= from && s.date <= to);
}
