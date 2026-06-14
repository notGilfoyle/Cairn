import type { Habit, HabitLog, Day } from "../../data/types";
import { Card, CardHeader } from "../ui/Card";
import { habitCurrentStreak, habitLongestStreak, perfectDayStreak, journalingStreak } from "../../lib/streaks";

export function StreakCard({
  habits,
  logs,
  days,
  today,
}: {
  habits: Habit[];
  logs: HabitLog[];
  days: Day[];
  today: string;
}) {
  const active = habits.filter((h) => !h.archived);
  const perfect = perfectDayStreak(active, logs, today);
  const journal = journalingStreak(days, today);

  return (
    <Card>
      <CardHeader title="Streaks" />

      <div className="mb-4 grid grid-cols-2 gap-3">
        <BigStat label="Perfect-day streak" value={perfect} unit="🔥" />
        <BigStat label="Journaling streak" value={journal} unit="✍️" />
      </div>

      {active.length === 0 ? (
        <p className="text-sm text-slate-400">No habits yet.</p>
      ) : (
        <ul className="space-y-2">
          {active.map((h) => {
            const cur = habitCurrentStreak(h, logs, today);
            const lng = habitLongestStreak(h, logs, today);
            return (
              <li
                key={h.id}
                className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/60"
              >
                <span className="text-xl" aria-hidden>
                  {h.emoji}
                </span>
                <span className="flex-1 text-sm font-medium">{h.name}</span>
                <span className="text-sm tabular-nums">
                  <span className="font-bold text-accent-600 dark:text-accent-400">{cur}</span>
                  <span className="text-slate-400"> cur</span>
                </span>
                <span className="text-sm tabular-nums text-slate-400">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">{lng}</span> best
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function BigStat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-xl bg-accent-50 px-4 py-3 dark:bg-accent-950/40">
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold tabular-nums text-accent-700 dark:text-accent-300">
          {value}
        </span>
        <span aria-hidden>{unit}</span>
      </div>
      <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}
