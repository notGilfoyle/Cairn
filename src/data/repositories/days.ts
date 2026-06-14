import { db } from "../db";
import type { Day, DateStr, JournalEntry, Mood } from "../types";

function emptyDay(date: DateStr): Day {
  return {
    date,
    amJournal: null,
    pmJournal: null,
    intentions: [],
    updatedAt: new Date().toISOString(),
  };
}

export const daysRepo = {
  async get(date: DateStr): Promise<Day | undefined> {
    return db.days.get(date);
  },

  /** Get the day if it exists, otherwise a fresh (unsaved) empty Day. */
  async getOrEmpty(date: DateStr): Promise<Day> {
    return (await db.days.get(date)) ?? emptyDay(date);
  },

  async getRange(from: DateStr, to: DateStr): Promise<Day[]> {
    return db.days.where("date").between(from, to, true, true).toArray();
  },

  async all(): Promise<Day[]> {
    return db.days.toArray();
  },

  async put(day: Day): Promise<Day> {
    const next = { ...day, updatedAt: new Date().toISOString() };
    await db.days.put(next);
    return next;
  },

  /**
   * Atomic read-modify-write on a day inside a transaction so that concurrent
   * mutations to different fields (journal text vs. mood vs. intentions firing
   * within the same tick) serialize and merge instead of clobbering each other.
   */
  async mutate(date: DateStr, fn: (day: Day) => Day): Promise<Day> {
    return db.transaction("rw", db.days, async () => {
      const current = (await db.days.get(date)) ?? emptyDay(date);
      const next: Day = { ...fn(current), date, updatedAt: new Date().toISOString() };
      await db.days.put(next);
      return next;
    });
  },

  /** Upsert fields on a day, creating it if needed. */
  async patch(date: DateStr, patch: Partial<Omit<Day, "date">>): Promise<Day> {
    return this.mutate(date, (current) => ({ ...current, ...patch }));
  },

  async setJournal(
    date: DateStr,
    slot: "am" | "pm",
    entry: Partial<JournalEntry>,
  ): Promise<Day> {
    const key = slot === "am" ? "amJournal" : "pmJournal";
    return this.mutate(date, (current) => {
      const existing = current[key];
      const merged: JournalEntry = {
        text: entry.text ?? existing?.text ?? "",
        mood: entry.mood !== undefined ? entry.mood : (existing?.mood ?? null),
        savedAt: new Date().toISOString(),
      };
      return { ...current, [key]: merged };
    });
  },

  async setMood(date: DateStr, slot: "am" | "pm", mood: Mood | null): Promise<Day> {
    return this.setJournal(date, slot, { mood });
  },

  async clear(): Promise<void> {
    await db.days.clear();
  },
};
