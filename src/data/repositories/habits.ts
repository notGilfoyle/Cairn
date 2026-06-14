import { db } from "../db";
import type { Habit } from "../types";
import { newId } from "../../lib/id";

export const habitsRepo = {
  async all(): Promise<Habit[]> {
    const list = await db.habits.toArray();
    return list.sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async active(): Promise<Habit[]> {
    const list = await this.all();
    return list.filter((h) => !h.archived);
  },

  async get(id: string): Promise<Habit | undefined> {
    return db.habits.get(id);
  },

  async create(
    input: Omit<Habit, "id" | "createdAt" | "sortOrder" | "archived"> &
      Partial<Pick<Habit, "id" | "createdAt" | "sortOrder" | "archived">>,
  ): Promise<Habit> {
    const count = await db.habits.count();
    const habit: Habit = {
      id: input.id ?? newId(),
      name: input.name,
      emoji: input.emoji,
      color: input.color,
      cadence: input.cadence,
      tags: input.tags ?? [],
      archived: input.archived ?? false,
      createdAt: input.createdAt ?? new Date().toISOString(),
      sortOrder: input.sortOrder ?? count,
    };
    await db.habits.put(habit);
    return habit;
  },

  async update(id: string, patch: Partial<Omit<Habit, "id">>): Promise<Habit | undefined> {
    const current = await db.habits.get(id);
    if (!current) return undefined;
    const next = { ...current, ...patch, id };
    await db.habits.put(next);
    return next;
  },

  async setArchived(id: string, archived: boolean): Promise<void> {
    await db.habits.update(id, { archived });
  },

  /** Archiving retains logs/history; deletion is destructive and only for Manage. */
  async remove(id: string): Promise<void> {
    await db.transaction("rw", db.habits, db.habitLogs, async () => {
      await db.habits.delete(id);
      await db.habitLogs.where("habitId").equals(id).delete();
    });
  },

  async clear(): Promise<void> {
    await db.habits.clear();
  },
};
