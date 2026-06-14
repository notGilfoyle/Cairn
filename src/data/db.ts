import Dexie, { type Table } from "dexie";
import type { Day, Habit, HabitLog, Todo, Settings, Meta } from "./types";

/**
 * Dexie database. This is the ONLY module that touches Dexie tables directly;
 * everything else goes through src/data/repositories/*, keeping the persistence
 * choice swappable (PRD §6, §11).
 */
export class CairnDB extends Dexie {
  days!: Table<Day, string>;
  habits!: Table<Habit, string>;
  habitLogs!: Table<HabitLog, [string, string]>;
  todos!: Table<Todo, string>;
  settings!: Table<Settings, string>;
  meta!: Table<Meta, string>;

  constructor() {
    super("cairn");
    this.version(1).stores({
      days: "date",
      habits: "id, archived, sortOrder",
      habitLogs: "[habitId+date], date, habitId",
      todos: "id, date, done",
      settings: "key",
      meta: "key",
    });
  }
}

export const db = new CairnDB();
