import type { Tracker, QuantityEntry, GoalPeriod, WeekStart } from "../../data/types";
import { Card, CardHeader } from "../ui/Card";
import { aggregateInPeriod, periodRange, entriesInRange } from "../../lib/aggregate";
import { formatQuantity, aggregationLabel } from "../../lib/format";
import { GoalProgress } from "../trackers/GoalProgress";
import { cx } from "../ui/cx";

/**
 * Dashboard card for a non-ledger quantity tracker (PRD §6.5): period
 * aggregation value + sparkline + goal progress, trend-colored by `direction`.
 */
export function MeasureCard({
  tracker,
  entries,
  today,
  period,
  weekStart,
}: {
  tracker: Tracker;
  entries: QuantityEntry[];
  today: string;
  period: GoalPeriod;
  weekStart: WeekStart;
}) {
  const mine = entries.filter((e) => e.trackerId === tracker.id);
  const value = aggregateInPeriod(mine, tracker.aggregation, today, period, weekStart);

  // Sparkline: per-day aggregated values across the current period.
  const { from, to } = periodRange(today, period, weekStart);
  const scoped = entriesInRange(mine, from, to);
  const byDate = new Map<string, number[]>();
  for (const e of scoped) {
    byDate.set(e.date, [...(byDate.get(e.date) ?? []), e.amount]);
  }
  const series = [...byDate.keys()].sort().map((d) => {
    const amts = byDate.get(d)!;
    return tracker.aggregation === "latest" ? amts[amts.length - 1] : amts.reduce((a, b) => a + b, 0);
  });

  const trend =
    tracker.direction === "up_good"
      ? "text-emerald-600 dark:text-emerald-400"
      : tracker.direction === "down_good"
        ? "text-amber-600 dark:text-amber-400"
        : "text-slate-800 dark:text-slate-100";

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-1.5">
            <span>{tracker.emoji}</span>
            {tracker.name}
          </span>
        }
        subtitle={`${aggregationLabel(tracker)} this ${period}`}
      />
      <div className="flex items-end justify-between gap-3">
        <span className={cx("text-3xl font-bold tabular-nums", trend)}>
          {formatQuantity(value, tracker.unit)}
        </span>
        <Sparkline values={series} color={tracker.color} />
      </div>
      {tracker.goal && (
        <div className="mt-3">
          <GoalProgress tracker={tracker} entries={entries} today={today} weekStart={weekStart} />
        </div>
      )}
    </Card>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const W = 120;
  const H = 36;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * W},${H - ((v - min) / span) * H}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
