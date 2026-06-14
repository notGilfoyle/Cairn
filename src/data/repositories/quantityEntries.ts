import { db } from "../db";
import type { QuantityEntry, DateStr } from "../types";
import { newId } from "../../lib/id";

export const quantityEntriesRepo = {
  async all(): Promise<QuantityEntry[]> {
    return db.quantityEntries.toArray();
  },

  async get(id: string): Promise<QuantityEntry | undefined> {
    return db.quantityEntries.get(id);
  },

  async forTracker(trackerId: string): Promise<QuantityEntry[]> {
    return db.quantityEntries.where("trackerId").equals(trackerId).toArray();
  },

  async forDate(date: DateStr): Promise<QuantityEntry[]> {
    return db.quantityEntries.where("date").equals(date).toArray();
  },

  async forRange(from: DateStr, to: DateStr): Promise<QuantityEntry[]> {
    return db.quantityEntries.where("date").between(from, to, true, true).toArray();
  },

  async create(
    input: Partial<QuantityEntry> & Pick<QuantityEntry, "trackerId" | "date" | "amount">,
  ): Promise<QuantityEntry> {
    const entry: QuantityEntry = {
      id: input.id ?? newId(),
      trackerId: input.trackerId,
      date: input.date,
      amount: input.amount,
      note: input.note ?? null,
      tags: input.tags ?? [],
      createdAt: input.createdAt ?? new Date().toISOString(),
    };
    await db.quantityEntries.put(entry);
    return entry;
  },

  async update(
    id: string,
    patch: Partial<Omit<QuantityEntry, "id">>,
  ): Promise<QuantityEntry | undefined> {
    const current = await db.quantityEntries.get(id);
    if (!current) return undefined;
    const next = { ...current, ...patch, id };
    await db.quantityEntries.put(next);
    return next;
  },

  async remove(id: string): Promise<void> {
    await db.quantityEntries.delete(id);
  },

  async clear(): Promise<void> {
    await db.quantityEntries.clear();
  },
};
