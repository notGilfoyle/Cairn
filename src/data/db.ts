import Dexie, { type Table } from "dexie";
import type {
  Day,
  Habit,
  HabitLog,
  Todo,
  Settings,
  Meta,
  Tracker,
  QuantityEntry,
  SessionEntry,
} from "./types";

export const DEFAULT_CURRENCY = "₹";

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

  // v2 "Quantify & Move"
  trackers!: Table<Tracker, string>;
  quantityEntries!: Table<QuantityEntry, string>;
  sessionEntries!: Table<SessionEntry, string>;

  constructor() {
    super("cairn");

    // v1 schema — never altered.
    this.version(1).stores({
      days: "date",
      habits: "id, archived, sortOrder",
      habitLogs: "[habitId+date], date, habitId",
      todos: "id, date, done",
      settings: "key",
      meta: "key",
    });

    // v2 — ADDITIVE ONLY. We list just the new stores; Dexie carries every v1
    // store forward unchanged. The upgrade hook (runs only when migrating an
    // existing v1 DB) bumps schemaVersion and backfills settings.currency.
    this.version(2)
      .stores({
        trackers: "id, type, archived, sortOrder",
        quantityEntries: "id, [trackerId+date], date, trackerId",
        sessionEntries: "id, [trackerId+date], date, trackerId",
      })
      .upgrade(async (tx) => {
        await tx
          .table("meta")
          .toCollection()
          .modify((m: Meta) => {
            m.schemaVersion = 2;
          });
        await tx
          .table("settings")
          .toCollection()
          .modify((s: Settings) => {
            if (s.currency == null) s.currency = DEFAULT_CURRENCY;
          });
      });
  }
}

export const db = new CairnDB();
