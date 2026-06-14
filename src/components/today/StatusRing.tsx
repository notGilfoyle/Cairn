import { useShallow } from "zustand/react/shallow";
import { useStore, scheduledHabits, todayTodos } from "../../store/useStore";
import { cx } from "../ui/cx";

/**
 * The always-visible status ring (PRD §10.1). Summarizes the day's signals:
 * AM journaled, PM journaled, todos done/total, habits done/total — updating
 * live. The ring fill is overall completion across those signals.
 */
export function StatusRing() {
  const habits = useStore(useShallow(scheduledHabits));
  const todos = useStore(useShallow(todayTodos));
  const logs = useStore((s) => s.todayLogs);
  const day = useStore((s) => s.day);

  const habitsDone = habits.filter((h) => logs[h.id]?.done).length;
  const todosDone = todos.filter((t) => t.done).length;
  const amJournaled = !!day.amJournal && day.amJournal.text.trim().length > 0;
  const pmJournaled = !!day.pmJournal && day.pmJournal.text.trim().length > 0;

  const total = habits.length + todos.length + 2; // +2 for AM/PM
  const done = habitsDone + todosDone + (amJournaled ? 1 : 0) + (pmJournaled ? 1 : 0);
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const R = 34;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - (total === 0 ? 0 : done / total));

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-24 w-24 shrink-0">
        <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
          <circle
            cx="40"
            cy="40"
            r={R}
            fill="none"
            strokeWidth="8"
            className="stroke-slate-200 dark:stroke-slate-800"
          />
          <circle
            cx="40"
            cy="40"
            r={R}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className="stroke-accent-500 transition-[stroke-dashoffset] duration-500"
            strokeDasharray={C}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold tabular-nums">{pct}%</span>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-2 gap-2 text-sm">
        <Signal label="Morning" on={amJournaled} value={amJournaled ? "✓" : "—"} />
        <Signal label="Evening" on={pmJournaled} value={pmJournaled ? "✓" : "—"} />
        <Signal label="Todos" on={todos.length > 0 && todosDone === todos.length} value={`${todosDone}/${todos.length}`} />
        <Signal label="Habits" on={habits.length > 0 && habitsDone === habits.length} value={`${habitsDone}/${habits.length}`} />
      </div>
    </div>
  );
}

function Signal({ label, value, on }: { label: string; value: string; on: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span
        className={cx(
          "font-semibold tabular-nums",
          on ? "text-accent-600 dark:text-accent-400" : "text-slate-700 dark:text-slate-200",
        )}
      >
        {value}
      </span>
    </div>
  );
}
