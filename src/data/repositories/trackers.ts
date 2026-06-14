import { db } from "../db";
import type { Tracker } from "../types";
import { newId } from "../../lib/id";

/** Fields a caller supplies when creating a tracker (rest are defaulted). */
export type TrackerInput = Omit<Tracker, "id" | "createdAt" | "sortOrder" | "archived"> &
  Partial<Pick<Tracker, "id" | "createdAt" | "sortOrder" | "archived">>;

export const trackersRepo = {
  async all(): Promise<Tracker[]> {
    const list = await db.trackers.toArray();
    return list.sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async active(): Promise<Tracker[]> {
    return (await this.all()).filter((t) => !t.archived);
  },

  async get(id: string): Promise<Tracker | undefined> {
    return db.trackers.get(id);
  },

  async create(input: TrackerInput): Promise<Tracker> {
    const count = await db.trackers.count();
    const tracker: Tracker = {
      id: input.id ?? newId(),
      name: input.name,
      type: input.type,
      emoji: input.emoji,
      color: input.color,
      tags: input.tags ?? [],
      archived: input.archived ?? false,
      createdAt: input.createdAt ?? new Date().toISOString(),
      sortOrder: input.sortOrder ?? count,
      presetKey: input.presetKey ?? null,
      unit: input.unit ?? null,
      aggregation: input.aggregation ?? null,
      allowsNegative: input.allowsNegative ?? false,
      direction: input.direction ?? null,
      goal: input.goal ?? null,
      sessionTypes: input.sessionTypes ?? [],
    };
    await db.trackers.put(tracker);
    return tracker;
  },

  async update(id: string, patch: Partial<Omit<Tracker, "id">>): Promise<Tracker | undefined> {
    const current = await db.trackers.get(id);
    if (!current) return undefined;
    const next = { ...current, ...patch, id };
    await db.trackers.put(next);
    return next;
  },

  async setArchived(id: string, archived: boolean): Promise<void> {
    await db.trackers.update(id, { archived });
  },

  /** Deleting a tracker also removes its entries from both entry stores. */
  async remove(id: string): Promise<void> {
    await db.transaction("rw", db.trackers, db.quantityEntries, db.sessionEntries, async () => {
      await db.trackers.delete(id);
      await db.quantityEntries.where("trackerId").equals(id).delete();
      await db.sessionEntries.where("trackerId").equals(id).delete();
    });
  },

  async clear(): Promise<void> {
    await db.trackers.clear();
  },
};
