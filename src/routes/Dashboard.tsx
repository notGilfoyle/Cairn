import { useMemo, useState } from "react";
import { useStore } from "../store/useStore";
import { useDashboardData } from "../components/dashboard/useDashboardData";
import { StreakCard } from "../components/dashboard/StreakCard";
import { WeekHeatmap } from "../components/dashboard/WeekHeatmap";
import { MoodSparkline } from "../components/dashboard/MoodSparkline";
import { CompletionRate } from "../components/dashboard/CompletionRate";
import { TagFilter } from "../components/dashboard/TagFilter";
import { allTags } from "../lib/streaks";
import { cx } from "../components/ui/cx";

export default function Dashboard() {
  const today = useStore((s) => s.date);
  const settings = useStore((s) => s.settings);
  // New nonce per mount → fresh data each time the tab opens.
  const [nonce] = useState(() => Date.now());
  const { habits, logs, todos, days, loading } = useDashboardData(nonce);

  const [range, setRange] = useState<7 | 30>(30);
  const [tag, setTag] = useState<string | null>(null);

  const tags = useMemo(() => allTags(habits, todos), [habits, todos]);

  // Tag filter narrows the tagged entities (habits/todos). Day-level metrics
  // (mood, journaling) are untagged and remain global.
  const fHabits = tag ? habits.filter((h) => h.tags.includes(tag)) : habits;
  const fTodos = tag ? todos.filter((t) => t.tags.includes(tag)) : todos;

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
    </div>
  );
}
