import type { Cadence, DateStr } from "../data/types";
import { weekdayOf } from "./dates";

/** Is a habit with this cadence scheduled on the given date? */
export function isScheduledOn(cadence: Cadence, date: DateStr): boolean {
  if (cadence === "daily") return true;
  return cadence.weekdays.includes(weekdayOf(date));
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function cadenceSummary(cadence: Cadence): string {
  if (cadence === "daily") return "Every day";
  const days = [...cadence.weekdays].sort((a, b) => a - b);
  if (days.length === 0) return "No days";
  if (days.length === 7) return "Every day";
  return days.map((d) => DAY_FULL[d].slice(0, 3)).join(", ");
}

export function weekdayShort(index: number): string {
  return DAY_LABELS[index] ?? "";
}

export function weekdayName(index: number): string {
  return DAY_FULL[index] ?? "";
}
