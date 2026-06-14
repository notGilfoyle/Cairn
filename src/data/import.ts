import { db } from "./db";
import { habitsRepo } from "./repositories";
import type { Cadence, Day, Habit, HabitLog, Todo, Settings, Meta } from "./types";
import type { CairnExport } from "./export";

/** Minimal RFC-4180-ish CSV parser (handles quoted cells, commas, newlines). */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += c;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

function parseCadence(raw: string): Cadence {
  const v = raw.trim().toLowerCase();
  if (v === "" || v === "daily" || v === "every day") return "daily";
  const map: Record<string, number> = {
    sun: 0, sunday: 0,
    mon: 1, monday: 1,
    tue: 2, tues: 2, tuesday: 2,
    wed: 3, wednesday: 3,
    thu: 4, thur: 4, thurs: 4, thursday: 4,
    fri: 5, friday: 5,
    sat: 6, saturday: 6,
  };
  const weekdays = v
    .split(/[|;/]+/)
    .map((d) => map[d.trim()])
    .filter((d): d is number => d !== undefined);
  return weekdays.length > 0 ? { weekdays: [...new Set(weekdays)].sort() } : "daily";
}

export interface HabitImportResult {
  created: number;
}

/**
 * Import a habit list from CSV. Expected headers (case-insensitive): name,
 * emoji, color, cadence, tags. Only `name` is required. `cadence` accepts
 * "daily" or pipe/semicolon-separated weekday names. `tags` is pipe-separated.
 */
export async function importHabitsCSV(text: string): Promise<HabitImportResult> {
  const rows = parseCSV(text);
  if (rows.length === 0) return { created: 0 };

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const ci = {
    name: idx("name"),
    emoji: idx("emoji"),
    color: idx("color"),
    cadence: idx("cadence"),
    tags: idx("tags"),
  };
  // If there's no recognizable header, treat the first column as name with no header row.
  const hasHeader = ci.name !== -1;
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const nameCol = hasHeader ? ci.name : 0;

  let created = 0;
  for (const r of dataRows) {
    const name = (r[nameCol] ?? "").trim();
    if (!name) continue;
    await habitsRepo.create({
      name,
      emoji: (hasHeader && ci.emoji !== -1 ? r[ci.emoji] : "")?.trim() || "✅",
      color: (hasHeader && ci.color !== -1 ? r[ci.color] : "")?.trim() || "#6366f1",
      cadence: parseCadence(hasHeader && ci.cadence !== -1 ? (r[ci.cadence] ?? "") : ""),
      tags:
        hasHeader && ci.tags !== -1
          ? (r[ci.tags] ?? "")
              .split("|")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
    });
    created++;
  }
  return { created };
}

/**
 * Restore a full backup produced by exportJSON. Replaces all existing data
 * (used for round-trip restore). Validates the shape minimally.
 */
export async function importFullJSON(text: string): Promise<void> {
  const data = JSON.parse(text) as Partial<CairnExport>;
  if (!data || typeof data !== "object" || !("schemaVersion" in data)) {
    throw new Error("Not a valid Cairn export (missing schemaVersion).");
  }

  await db.transaction(
    "rw",
    [db.days, db.habits, db.habitLogs, db.todos, db.settings, db.meta],
    async () => {
      await Promise.all([
        db.days.clear(),
        db.habits.clear(),
        db.habitLogs.clear(),
        db.todos.clear(),
      ]);
      if (Array.isArray(data.days)) await db.days.bulkPut(data.days as Day[]);
      if (Array.isArray(data.habits)) await db.habits.bulkPut(data.habits as Habit[]);
      if (Array.isArray(data.habitLogs)) await db.habitLogs.bulkPut(data.habitLogs as HabitLog[]);
      if (Array.isArray(data.todos)) await db.todos.bulkPut(data.todos as Todo[]);
      if (data.settings) await db.settings.put(data.settings as Settings);
      if (data.meta) await db.meta.put(data.meta as Meta);
    },
  );
}
