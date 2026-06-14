import type { Tracker, SessionEntry, GoalPeriod, WeekStart } from "../../data/types";
import { Card, CardHeader } from "../ui/Card";
import { periodRange } from "../../lib/aggregate";
import { summarize, sessionsInRange } from "../../lib/workouts";
import { trimNum } from "../../lib/format";

/**
 * Dashboard card for a session tracker (PRD §6.5): sessions, total duration and
 * distance, a by-type breakdown, and training days this week.
 */
export function WorkoutsCard({
  tracker,
  entries,
  today,
  period,
  weekStart,
}: {
  tracker: Tracker;
  entries: SessionEntry[];
  today: string;
  period: GoalPeriod;
  weekStart: WeekStart;
}) {
  const mine = entries.filter((e) => e.trackerId === tracker.id);
  const { from, to } = periodRange(today, period, weekStart);
  const scoped = sessionsInRange(mine, from, to);
  const s = summarize(scoped);

  // "training days this week" is always week-scoped per the PRD.
  const week = periodRange(today, "week", weekStart);
  const trainingDaysThisWeek = summarize(sessionsInRange(mine, week.from, week.to)).trainingDays;

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
        <Stat value={String(s.sessions)} label="Sessions" />
        <Stat value={`${trimNum(s.durationMin)}m`} label="Duration" />
        <Stat value={`${trimNum(s.distanceKm)}km`} label="Distance" />
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl bg-accent-50 px-3 py-2 text-sm dark:bg-accent-950/40">
        <span className="text-slate-500 dark:text-slate-400">Training days this week</span>
        <span className="font-bold text-accent-700 dark:text-accent-300">{trainingDaysThisWeek} / 7</span>
      </div>

      {s.byType.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {s.byType.map((t) => (
            <span
              key={t.type}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium dark:bg-slate-800"
            >
              {t.type} · {t.sessions}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-2 py-3 dark:bg-slate-800/60">
      <div className="text-base font-bold tabular-nums">{value}</div>
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  );
}
