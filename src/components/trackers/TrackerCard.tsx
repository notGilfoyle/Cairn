import type { Tracker, QuantityEntry, SessionEntry, WeekStart } from "../../data/types";
import { aggregateInPeriod, periodRange, entriesInRange } from "../../lib/aggregate";
import { formatQuantity, aggregationLabel } from "../../lib/format";
import { today } from "../../lib/dates";
import { cx } from "../ui/cx";

/**
 * A tracker tile for the hub with a mini current value (PRD §6.1):
 * quantity → today's aggregated value (latest trackers show the most recent),
 * session → this week's session count.
 */
export function TrackerCard({
  tracker,
  quantity,
  session,
  weekStart,
  onClick,
}: {
  tracker: Tracker;
  quantity: QuantityEntry[];
  session: SessionEntry[];
  weekStart: WeekStart;
  onClick: () => void;
}) {
  const mini = miniValue(tracker, quantity, session, weekStart);

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60"
    >
      <span
        className="flex h-11 w-11 items-center justify-center rounded-xl text-2xl"
        style={{ backgroundColor: `${tracker.color}22` }}
      >
        {tracker.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{tracker.name}</span>
        <span className="block text-xs text-slate-400">{mini.caption}</span>
      </span>
      <span className={cx("text-right text-lg font-bold tabular-nums", mini.tone)}>
        {mini.value}
      </span>
    </button>
  );
}

function miniValue(
  tracker: Tracker,
  quantity: QuantityEntry[],
  session: SessionEntry[],
  weekStart: WeekStart,
): { value: string; caption: string; tone: string } {
  const d = today();
  if (tracker.type === "session") {
    const { from, to } = periodRange(d, "week", weekStart);
    const count = session.filter(
      (s) => s.trackerId === tracker.id && s.date >= from && s.date <= to,
    ).length;
    return {
      value: String(count),
      caption: "sessions this week",
      tone: "text-slate-700 dark:text-slate-200",
    };
  }

  const mine = quantity.filter((q) => q.trackerId === tracker.id);
  // "latest" trackers (e.g. weight) show the most recent reading overall;
  // others show today's aggregation.
  if (tracker.aggregation === "latest") {
    const sorted = entriesInRange(mine, "0000-00-00", "9999-99-99");
    const last = sorted[sorted.length - 1];
    return {
      value: last ? formatQuantity(last.amount, tracker.unit) : "—",
      caption: last ? `latest · ${last.date}` : "no entries yet",
      tone: "text-slate-700 dark:text-slate-200",
    };
  }

  const value = aggregateInPeriod(mine, tracker.aggregation, d, "day", weekStart);
  const hasToday = mine.some((q) => q.date === d);
  return {
    value: hasToday ? formatQuantity(value, tracker.unit) : "—",
    caption: `${aggregationLabel(tracker).toLowerCase()} today`,
    tone:
      tracker.allowsNegative && value < 0
        ? "text-red-500"
        : "text-slate-700 dark:text-slate-200",
  };
}
