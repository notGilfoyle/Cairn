import type { Todo, WeekStart } from "../../data/types";
import { Card, CardHeader } from "../ui/Card";
import { weekCompletionRate } from "../../lib/streaks";

export function CompletionRate({
  todos,
  today,
  weekStart,
}: {
  todos: Todo[];
  today: string;
  weekStart: WeekStart;
}) {
  const rate = weekCompletionRate(todos, today, weekStart);
  const pct = rate === null ? null : Math.round(rate * 100);

  const R = 30;
  const C = 2 * Math.PI * R;
  const offset = rate === null ? C : C * (1 - rate);

  return (
    <Card>
      <CardHeader title="Todo completion" subtitle="This week" />
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0">
          <svg viewBox="0 0 72 72" className="h-20 w-20 -rotate-90">
            <circle cx="36" cy="36" r={R} fill="none" strokeWidth="7" className="stroke-slate-200 dark:stroke-slate-800" />
            <circle
              cx="36"
              cy="36"
              r={R}
              fill="none"
              strokeWidth="7"
              strokeLinecap="round"
              className="stroke-accent-500 transition-[stroke-dashoffset] duration-500"
              strokeDasharray={C}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-lg font-bold tabular-nums">
            {pct === null ? "—" : `${pct}%`}
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {pct === null
            ? "No dated todos this week yet."
            : "Completed vs. all dated todos this week."}
        </p>
      </div>
    </Card>
  );
}
