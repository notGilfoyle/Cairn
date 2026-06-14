import type { QuantityEntry, Tracker, WeekStart } from "../../data/types";
import { goalProgress } from "../../lib/aggregate";
import { formatQuantity } from "../../lib/format";
import { cx } from "../ui/cx";

/** Goal progress bar for the current period (PRD §6.4). Null when no goal. */
export function GoalProgress({
  tracker,
  entries,
  today,
  weekStart,
}: {
  tracker: Tracker;
  entries: QuantityEntry[];
  today: string;
  weekStart: WeekStart;
}) {
  const mine = entries.filter((e) => e.trackerId === tracker.id);
  const gp = goalProgress(mine, tracker.aggregation, tracker.goal, today, weekStart);
  if (!gp || !tracker.goal) return null;

  const pct = Math.min(100, Math.max(0, Math.round(gp.fraction * 100)));
  const reached = gp.fraction >= 1;

  return (
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-slate-500 dark:text-slate-400">Goal · per {tracker.goal.period}</span>
        <span className="font-semibold tabular-nums">
          {formatQuantity(gp.value, tracker.unit)} / {formatQuantity(gp.target, tracker.unit)}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className={cx("h-full rounded-full transition-all", reached ? "bg-emerald-500" : "bg-accent-500")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 text-right text-xs text-slate-400">
        {reached ? "Goal reached 🎉" : `${pct}%`}
      </div>
    </div>
  );
}
