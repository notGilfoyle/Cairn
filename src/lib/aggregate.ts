import type { QuantityEntry, Aggregation, GoalPeriod, WeekStart, DateStr } from "../data/types";
import { weekStartFor, addDaysStr, toDateStr, parseDate } from "./dates";

/** Roll up quantity amounts per the tracker's aggregation rule (PRD §4). */
export function aggregateQuantity(amounts: number[], aggregation: Aggregation | null): number {
  if (amounts.length === 0) return 0;
  switch (aggregation) {
    case "average":
      return amounts.reduce((a, b) => a + b, 0) / amounts.length;
    case "count":
      return amounts.length;
    case "latest":
      // caller passes amounts already ordered oldest→newest
      return amounts[amounts.length - 1];
    case "sum":
    default:
      return amounts.reduce((a, b) => a + b, 0);
  }
}

/** Inclusive [from, to] date range for a goal/dashboard period containing `date`. */
export function periodRange(
  date: DateStr,
  period: GoalPeriod,
  weekStart: WeekStart,
): { from: DateStr; to: DateStr } {
  if (period === "day") return { from: date, to: date };
  if (period === "week") {
    const from = weekStartFor(date, weekStart);
    return { from, to: addDaysStr(from, 6) };
  }
  // month
  const d = parseDate(date);
  const from = toDateStr(new Date(d.getFullYear(), d.getMonth(), 1));
  const to = toDateStr(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  return { from, to };
}

function inRange(date: DateStr, from: DateStr, to: DateStr): boolean {
  return date >= from && date <= to;
}

/** Entries within [from,to], sorted oldest→newest (so `latest` works). */
export function entriesInRange(
  entries: QuantityEntry[],
  from: DateStr,
  to: DateStr,
): QuantityEntry[] {
  return entries
    .filter((e) => inRange(e.date, from, to))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.createdAt < b.createdAt ? -1 : 1));
}

/** Aggregated value for a tracker over a period. */
export function aggregateInPeriod(
  entries: QuantityEntry[],
  aggregation: Aggregation | null,
  date: DateStr,
  period: GoalPeriod,
  weekStart: WeekStart,
): number {
  const { from, to } = periodRange(date, period, weekStart);
  const scoped = entriesInRange(entries, from, to);
  return aggregateQuantity(scoped.map((e) => e.amount), aggregation);
}

export interface Ledger {
  in: number;
  out: number;
  net: number;
  byTag: { tag: string; net: number }[];
}

/**
 * Ledger summary (finance) over a set of entries: positive amounts in, negative
 * out, net total, and net by tag/category (PRD §6.5 Ledger card).
 */
export function ledger(entries: QuantityEntry[]): Ledger {
  let inc = 0;
  let out = 0;
  const byTag = new Map<string, number>();
  for (const e of entries) {
    if (e.amount >= 0) inc += e.amount;
    else out += e.amount;
    const tags = e.tags.length ? e.tags : ["untagged"];
    for (const t of tags) byTag.set(t, (byTag.get(t) ?? 0) + e.amount);
  }
  return {
    in: inc,
    out,
    net: inc + out,
    byTag: [...byTag.entries()]
      .map(([tag, net]) => ({ tag, net }))
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net)),
  };
}

/** Goal progress fraction (0..1+) for the current period; null if no goal. */
export function goalProgress(
  entries: QuantityEntry[],
  aggregation: Aggregation | null,
  goal: { period: GoalPeriod; target: number } | null,
  date: DateStr,
  weekStart: WeekStart,
): { value: number; target: number; fraction: number } | null {
  if (!goal || goal.target === 0) return null;
  const value = aggregateInPeriod(entries, aggregation, date, goal.period, weekStart);
  return { value, target: goal.target, fraction: value / goal.target };
}
