import type { QuantityEntry, Tracker, WeekStart } from "../../data/types";
import { aggregateInPeriod } from "../../lib/aggregate";
import { lastNDays, prettyDate } from "../../lib/dates";
import { formatQuantity } from "../../lib/format";

/**
 * Hand-rolled SVG line/area chart of a quantity tracker's daily aggregated value
 * (PRD §6.4). Honors `aggregation`: each day's point is the tracker's rule
 * applied to that day's entries. Days without entries are gaps.
 */
export function QuantityChart({
  tracker,
  entries,
  today,
  rangeDays,
  weekStart,
}: {
  tracker: Tracker;
  entries: QuantityEntry[];
  today: string;
  rangeDays: number;
  weekStart: WeekStart;
}) {
  const dates = lastNDays(today, rangeDays);
  const mine = entries.filter((e) => e.trackerId === tracker.id);
  const byDate = new Set(mine.map((e) => e.date));

  const points = dates.map((date) => ({
    date,
    value: byDate.has(date)
      ? aggregateInPeriod(mine, tracker.aggregation, date, "day", weekStart)
      : null,
  }));

  const present = points.filter((p) => p.value !== null) as { date: string; value: number }[];
  if (present.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">No entries in this range.</p>;
  }

  const W = 320;
  const H = 120;
  const padX = 8;
  const padY = 12;
  const n = dates.length;
  const values = present.map((p) => p.value);
  let min = Math.min(...values, 0);
  let max = Math.max(...values, 0);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const x = (i: number) => padX + (n === 1 ? 0 : (i * (W - 2 * padX)) / (n - 1));
  const y = (v: number) => padY + (1 - (v - min) / (max - min)) * (H - 2 * padY);
  const yZero = y(0);

  // Build segments across gaps (like the mood sparkline).
  const segs: { i: number; v: number }[][] = [];
  let cur: { i: number; v: number }[] = [];
  points.forEach((p, i) => {
    if (p.value === null) {
      if (cur.length) segs.push(cur);
      cur = [];
    } else {
      cur.push({ i, v: p.value });
    }
  });
  if (cur.length) segs.push(cur);

  // Area path only meaningful for a single continuous-ish series; draw per segment.
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" preserveAspectRatio="none">
        {/* zero baseline (useful for ledger trackers) */}
        {min < 0 && (
          <line x1={padX} x2={W - padX} y1={yZero} y2={yZero} className="stroke-slate-200 dark:stroke-slate-700" strokeDasharray="3 3" strokeWidth={1} />
        )}
        {segs.map((seg, si) => {
          const line = seg.map((s) => `${x(s.i)},${y(s.v)}`).join(" ");
          const area = `${x(seg[0].i)},${yZero} ${line} ${x(seg[seg.length - 1].i)},${yZero}`;
          return (
            <g key={si}>
              <polygon points={area} fill={tracker.color} opacity={0.12} />
              {seg.length === 1 ? (
                <circle cx={x(seg[0].i)} cy={y(seg[0].v)} r={3} fill={tracker.color} />
              ) : (
                <polyline points={line} fill="none" stroke={tracker.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              )}
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-slate-400">
        <span>{prettyDate(dates[0])}</span>
        <span>
          {formatQuantity(min, tracker.unit)} … {formatQuantity(max, tracker.unit)}
        </span>
        <span>{prettyDate(dates[dates.length - 1])}</span>
      </div>
    </div>
  );
}
