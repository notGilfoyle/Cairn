import { useMemo, useState } from "react";
import { useStore } from "../store/useStore";
import { useDashboardData } from "../components/dashboard/useDashboardData";
import { StreakCard } from "../components/dashboard/StreakCard";
import { WeekHeatmap } from "../components/dashboard/WeekHeatmap";
import { MoodSparkline } from "../components/dashboard/MoodSparkline";
import { CompletionRate } from "../components/dashboard/CompletionRate";
import { TagFilter } from "../components/dashboard/TagFilter";
import { MeasureCard } from "../components/dashboard/MeasureCard";
import { LedgerCard } from "../components/dashboard/LedgerCard";
import { WorkoutsCard } from "../components/dashboard/WorkoutsCard";
import { allTags } from "../lib/streaks";
import type { GoalPeriod } from "../data/types";
import { cx } from "../components/ui/cx";

export default function Dashboard() {
  const today = useStore((s) => s.date);
  const settings = useStore((s) => s.settings);
  // New nonce per mount → fresh data each time the tab opens.
  const [nonce] = useState(() => Date.now());
  const { habits, logs, todos, days, trackers, quantity, session, loading } =
    useDashboardData(nonce);

  const [range, setRange] = useState<7 | 30>(30);
  const [period, setPeriod] = useState<GoalPeriod>("week");
  const [tag, setTag] = useState<string | null>(null);

  const tags = useMemo(() => allTags(habits, todos, trackers), [habits, todos, trackers]);

  // Tag filter narrows the tagged entities (habits/todos/trackers). Day-level
  // metrics (mood, journaling) are untagged and remain global.
  const fHabits = tag ? habits.filter((h) => h.tags.includes(tag)) : habits;
  const fTodos = tag ? todos.filter((t) => t.tags.includes(tag)) : todos;
  const fTrackers = (tag ? trackers.filter((t) => t.tags.includes(tag)) : trackers).filter(
    (t) => !t.archived,
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <header>
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </header>
        <p className="text-slate-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Streaks &amp; trends</p>
        </div>
        <div className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
          {([7, 30] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cx(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                range === r
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-500",
              )}
            >
              {r}d
            </button>
          ))}
        </div>
      </header>

      {tags.length > 0 && <TagFilter tags={tags} selected={tag} onSelect={setTag} />}

      <StreakCard habits={fHabits} logs={logs} days={days} today={today} />
      <WeekHeatmap
        days={days}
        habits={fHabits}
        logs={logs}
        todos={fTodos}
        today={today}
        weekStart={settings.weekStart}
        rangeDays={range}
        threshold={settings.showedUpThreshold}
      />
      <CompletionRate todos={fTodos} today={today} weekStart={settings.weekStart} />
      <MoodSparkline days={days} today={today} rangeDays={range} />

      {fTrackers.length > 0 && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Trackers
            </h2>
            <div className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
              {(["week", "month"] as GoalPeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cx(
                    "rounded-md px-3 py-1 text-sm font-medium capitalize transition-colors",
                    period === p
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                      : "text-slate-500",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {fTrackers.map((t) =>
            t.type === "session" ? (
              <WorkoutsCard key={t.id} tracker={t} entries={session} today={today} period={period} weekStart={settings.weekStart} />
            ) : t.allowsNegative ? (
              <LedgerCard key={t.id} tracker={t} entries={quantity} today={today} period={period} weekStart={settings.weekStart} />
            ) : (
              <MeasureCard key={t.id} tracker={t} entries={quantity} today={today} period={period} weekStart={settings.weekStart} />
            ),
          )}
        </section>
      )}
    </div>
  );
}
