import type { Tracker, QuantityEntry, GoalPeriod, WeekStart } from "../../data/types";
import { Card, CardHeader } from "../ui/Card";
import { periodRange, entriesInRange, ledger } from "../../lib/aggregate";
import { formatQuantity } from "../../lib/format";
import { cx } from "../ui/cx";

/**
 * Dashboard card for a ledger (finance) tracker (PRD §6.5): in / out / net for
 * the period plus a breakdown by tag (category).
 */
export function LedgerCard({
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
  const { from, to } = periodRange(today, period, weekStart);
  const scoped = entriesInRange(mine, from, to);
  const l = ledger(scoped);

  const maxAbs = Math.max(1, ...l.byTag.map((b) => Math.abs(b.net)));

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-1.5">
            <span>{tracker.emoji}</span>
            {tracker.name}
          </span>
        }
        subtitle={`This ${period}`}
      />

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="In" value={formatQuantity(l.in, tracker.unit)} tone="text-emerald-600 dark:text-emerald-400" />
        <Stat label="Out" value={formatQuantity(l.out, tracker.unit)} tone="text-red-500" />
        <Stat
          label="Net"
          value={formatQuantity(l.net, tracker.unit)}
          tone={l.net >= 0 ? "text-slate-800 dark:text-slate-100" : "text-red-500"}
        />
      </div>

      {l.byTag.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {l.byTag.slice(0, 6).map((b) => (
            <div key={b.tag} className="flex items-center gap-2">
              <span className="w-20 shrink-0 truncate text-xs text-slate-500 dark:text-slate-400">
                {b.tag}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={cx("h-full rounded-full", b.net >= 0 ? "bg-emerald-500" : "bg-red-400")}
                  style={{ width: `${(Math.abs(b.net) / maxAbs) * 100}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {formatQuantity(b.net, tracker.unit)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-2 py-3 dark:bg-slate-800/60">
      <div className={cx("text-base font-bold tabular-nums", tone)}>{value}</div>
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  );
}
