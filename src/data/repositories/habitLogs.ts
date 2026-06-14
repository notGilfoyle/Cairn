import { db } from "../db";
import type { HabitLog, DateStr } from "../types";

export const habitLogsRepo = {
  async get(habitId: string, date: DateStr): Promise<HabitLog | undefined> {
    return db.habitLogs.get([habitId, date]);
  },

  async forDate(date: DateStr): Promise<HabitLog[]> {
    return db.habitLogs.where("date").equals(date).toArray();
  },

  async forHabit(habitId: string): Promise<HabitLog[]> {
    return db.habitLogs.where("habitId").equals(habitId).toArray();
  },

  async forRange(from: DateStr, to: DateStr): Promise<HabitLog[]> {
    return db.habitLogs.where("date").between(from, to, true, true).toArray();
  },

  async all(): Promise<HabitLog[]> {
    return db.habitLogs.toArray();
  },

  /** Set (create or update) a single check-in. */
  async set(habitId: string, date: DateStr, done: boolean, note: string | null = null): Promise<HabitLog> {
    const log: HabitLog = { habitId, date, done, note };
    await db.habitLogs.put(log);
    return log;
  },

  /** Toggle today's check-in; returns the resulting log. */
  async toggle(habitId: string, date: DateStr): Promise<HabitLog> {
    const existing = await db.habitLogs.get([habitId, date]);
    return this.set(habitId, date, !existing?.done, existing?.note ?? null);
  },

  async put(log: HabitLog): Promise<void> {
    await db.habitLogs.put(log);
  },

  async clear(): Promise<void> {
    await db.habitLogs.clear();
  },
};
