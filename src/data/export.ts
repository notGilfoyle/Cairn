import { habitsRepo, habitLogsRepo, todosRepo, daysRepo, settingsRepo, metaRepo } from "./repositories";
import { SCHEMA_VERSION } from "./types";
import { cadenceSummary } from "../lib/cadence";

export interface CairnExport {
  schemaVersion: number;
  exportedAt: string;
  meta: unknown;
  settings: unknown;
  days: unknown[];
  habits: unknown[];
  habitLogs: unknown[];
  todos: unknown[];
}

/** Full backup as a JSON string (the source of truth for round-trip restore). */
export async function exportJSON(): Promise<string> {
  const [meta, settings, days, habits, habitLogs, todos] = await Promise.all([
    metaRepo.get(),
    settingsRepo.get(),
    daysRepo.all(),
    habitsRepo.all(),
    habitLogsRepo.all(),
    todosRepo.all(),
  ]);
  const payload: CairnExport = {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    meta,
    settings,
    days,
    habits,
    habitLogs,
    todos,
  };
  return JSON.stringify(payload, null, 2);
}

function csvCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCSV(headers: string[], rows: unknown[][]): string {
  return [headers.join(","), ...rows.map((r) => r.map(csvCell).join(","))].join("\n");
}

/** Per-entity CSVs for spreadsheet-friendly export. */
export async function exportCSVs(): Promise<Record<string, string>> {
  const [habits, todos, habitLogs, days] = await Promise.all([
    habitsRepo.all(),
    todosRepo.all(),
    habitLogsRepo.all(),
    daysRepo.all(),
  ]);

  return {
    "cairn-habits.csv": toCSV(
      ["id", "name", "emoji", "color", "cadence", "tags", "archived"],
      habits.map((h) => [
        h.id,
        h.name,
        h.emoji,
        h.color,
        cadenceSummary(h.cadence),
        h.tags.join("|"),
        h.archived,
      ]),
    ),
    "cairn-todos.csv": toCSV(
      ["id", "title", "date", "done", "carryOver", "tags", "completedAt"],
      todos.map((t) => [t.id, t.title, t.date ?? "", t.done, t.carryOver, t.tags.join("|"), t.completedAt ?? ""]),
    ),
    "cairn-habitLogs.csv": toCSV(
      ["habitId", "date", "done", "note"],
      habitLogs.map((l) => [l.habitId, l.date, l.done, l.note ?? ""]),
    ),
    "cairn-days.csv": toCSV(
      ["date", "amText", "amMood", "pmText", "pmMood", "intentions"],
      days.map((d) => [
        d.date,
        d.amJournal?.text ?? "",
        d.amJournal?.mood ?? "",
        d.pmJournal?.text ?? "",
        d.pmJournal?.mood ?? "",
        d.intentions.join("|"),
      ]),
    ),
  };
}

/** Browser download helper. */
export function downloadText(filename: string, text: string, type = "application/json"): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
