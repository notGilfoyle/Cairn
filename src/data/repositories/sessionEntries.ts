import { db } from "../db";
import type { SessionEntry, DateStr } from "../types";
import { newId } from "../../lib/id";

export const sessionEntriesRepo = {
  async all(): Promise<SessionEntry[]> {
    return db.sessionEntries.toArray();
  },

  async get(id: string): Promise<SessionEntry | undefined> {
    return db.sessionEntries.get(id);
  },

  async forTracker(trackerId: string): Promise<SessionEntry[]> {
    return db.sessionEntries.where("trackerId").equals(trackerId).toArray();
  },

  async forDate(date: DateStr): Promise<SessionEntry[]> {
    return db.sessionEntries.where("date").equals(date).toArray();
  },

  async forRange(from: DateStr, to: DateStr): Promise<SessionEntry[]> {
    return db.sessionEntries.where("date").between(from, to, true, true).toArray();
  },

  async create(
    input: Partial<SessionEntry> & Pick<SessionEntry, "trackerId" | "date" | "sessionType">,
  ): Promise<SessionEntry> {
    const entry: SessionEntry = {
      id: input.id ?? newId(),
      trackerId: input.trackerId,
      date: input.date,
      sessionType: input.sessionType,
      durationMin: input.durationMin ?? null,
      distanceKm: input.distanceKm ?? null,
      reps: input.reps ?? null,
      intensity: input.intensity ?? null,
      note: input.note ?? null,
      tags: input.tags ?? [],
      createdAt: input.createdAt ?? new Date().toISOString(),
    };
    await db.sessionEntries.put(entry);
    return entry;
  },

  async update(
    id: string,
    patch: Partial<Omit<SessionEntry, "id">>,
  ): Promise<SessionEntry | undefined> {
    const current = await db.sessionEntries.get(id);
    if (!current) return undefined;
    const next = { ...current, ...patch, id };
    await db.sessionEntries.put(next);
    return next;
  },

  async remove(id: string): Promise<void> {
    await db.sessionEntries.delete(id);
  },

  async clear(): Promise<void> {
    await db.sessionEntries.clear();
  },
};
