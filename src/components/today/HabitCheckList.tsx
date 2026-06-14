import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore, scheduledHabits } from "../../store/useStore";
import { Card, CardHeader } from "../ui/Card";
import { cx } from "../ui/cx";
import type { Habit } from "../../data/types";

export function HabitCheckList() {
  const habits = useStore(useShallow(scheduledHabits));
  const logs = useStore((s) => s.todayLogs);
  const toggleHabit = useStore((s) => s.toggleHabit);

  const doneCount = habits.filter((h) => logs[h.id]?.done).length;

  return (
    <Card>
      <CardHeader
        title="Habits"
        right={
          habits.length > 0 ? (
            <span className="text-sm font-semibold tabular-nums text-slate-400">
              {doneCount}/{habits.length}
            </span>
          ) : undefined
        }
      />
      {habits.length === 0 ? (
        <p className="py-2 text-sm text-slate-400 dark:text-slate-500">
          No habits scheduled today. Add some in Manage.
        </p>
      ) : (
        <ul className="space-y-2">
          {habits.map((h) => (
            <HabitRow
              key={h.id}
              habit={h}
              done={!!logs[h.id]?.done}
              onToggle={() => toggleHabit(h.id)}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}

function HabitRow({
  habit,
  done,
  onToggle,
}: {
  habit: Habit;
  done: boolean;
  onToggle: () => void;
}) {
  // Re-trigger the pop animation only when transitioning into "done".
  const [justDone, setJustDone] = useState(false);

  function handleClick() {
    if (!done) setJustDone(true);
    onToggle();
  }

  return (
    <li>
      <button
        onClick={handleClick}
        aria-pressed={done}
        className={cx(
          "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
          "min-h-[44px]",
          done
            ? "border-accent-200 bg-accent-50 dark:border-accent-900 dark:bg-accent-950/40"
            : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60",
        )}
      >
        <span className="text-2xl" aria-hidden>
          {habit.emoji}
        </span>
        <span className="flex-1 font-medium">{habit.name}</span>
        <span
          onAnimationEnd={() => setJustDone(false)}
          className={cx(
            "flex h-7 w-7 items-center justify-center rounded-full border-2 text-sm transition-colors",
            done
              ? "border-accent-500 bg-accent-500 text-white"
              : "border-slate-300 text-transparent dark:border-slate-600",
            justDone && "motion-safe:animate-pop-check",
          )}
        >
          ✓
        </span>
      </button>
    </li>
  );
}
