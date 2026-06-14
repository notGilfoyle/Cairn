import {
  format,
  parse,
  addDays,
  startOfWeek,
  differenceInCalendarDays,
} from "date-fns";
import type { DateStr, WeekStart } from "../data/types";

/**
 * All day-level dates in Cairn are LOCAL calendar dates formatted `YYYY-MM-DD`.
 * We never serialize via toISOString() at day granularity, which would shift the
 * boundary by the UTC offset and cause off-by-one-day bugs (PRD §6).
 */

const FMT = "yyyy-MM-dd";

/** Format a Date (in local time) as `YYYY-MM-DD`. */
export function toDateStr(d: Date): DateStr {
  return format(d, FMT);
}

/** Parse a `YYYY-MM-DD` string into a local Date at midnight. */
export function parseDate(s: DateStr): Date {
  return parse(s, FMT, new Date());
}

/** Today's local calendar date string. */
export function today(): DateStr {
  return toDateStr(new Date());
}

/** Day-of-week for a date string: 0=Sun … 6=Sat (matches JS getDay()). */
export function weekdayOf(s: DateStr): number {
  return parseDate(s).getDay();
}

/** Add `n` days to a date string (n may be negative). */
export function addDaysStr(s: DateStr, n: number): DateStr {
  return toDateStr(addDays(parseDate(s), n));
}

/** Whole-day difference a - b (positive when a is after b). */
export function diffDays(a: DateStr, b: DateStr): number {
  return differenceInCalendarDays(parseDate(a), parseDate(b));
}

/** date-fns weekStartsOn: 0=Sun, 1=Mon. */
function weekStartIndex(weekStart: WeekStart): 0 | 1 {
  return weekStart === "sunday" ? 0 : 1;
}

/** First day of the week containing `s`, per the user's weekStart setting. */
export function weekStartFor(s: DateStr, weekStart: WeekStart): DateStr {
  return toDateStr(startOfWeek(parseDate(s), { weekStartsOn: weekStartIndex(weekStart) }));
}

/** Inclusive list of date strings from `from` to `to`. */
export function eachDayInRange(from: DateStr, to: DateStr): DateStr[] {
  const out: DateStr[] = [];
  let cur = from;
  // Guard against reversed ranges.
  if (diffDays(to, from) < 0) return out;
  while (diffDays(to, cur) >= 0) {
    out.push(cur);
    cur = addDaysStr(cur, 1);
  }
  return out;
}

/** The N most recent days ending at (and including) `end`, oldest first. */
export function lastNDays(end: DateStr, n: number): DateStr[] {
  return eachDayInRange(addDaysStr(end, -(n - 1)), end);
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export function weekdayLabel(index: number): string {
  return WEEKDAY_LABELS[index] ?? "";
}

/** Human-friendly label, e.g. "Mon, Jun 13". */
export function prettyDate(s: DateStr): string {
  return format(parseDate(s), "EEE, MMM d");
}
