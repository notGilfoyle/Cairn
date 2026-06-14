import type { Habit, HabitLog, Todo, Day, WeekStart } from "../../data/types";
import { Card, CardHeader } from "../ui/Card";
import { showedUp } from "../../lib/streaks";
import { addDaysStr, diffDays, weekStartFor, prettyDate } from "../../lib/dates";

/**
 * Hand-rolled SVG calendar heatmap (PRD §10.2). Each cell lights when the day
 * "showed up". Today renders a distinct pending ring. Rows are weekdays aligned
 * to `weekStart`; columns are weeks (most recent on the right).
 */
export function WeekHeatmap({
  days,
  habits,
  logs,
  todos,
  today,
  weekStart,
  rangeDays,
  threshold,
}: {
  days: Day[];
  habits: Habit[];
  logs: HabitLog[];
  todos: Todo[];
  today: string;
  weekStart: WeekStart;
  rangeDays: number;
  threshold: number;
}) {
  const dayMap = new Map(days.map((d) => [d.date, d]));

  // Align the grid to whole weeks.
  const rawStart = addDaysStr(today, -(rangeDays - 1));
  const start = weekStartFor(rawStart, weekStart);
  const end = addDaysStr(weekStartFor(today, weekStart), 6);
  const weeks = Math.floor(diffDays(end, start) / 7) + 1;

  // Row order (top→bottom) of JS weekday numbers.
  const rowOrder =
    weekStart === "monday" ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6];

  const CELL = 16;
  const GAP = 4;
  const width = weeks * (CELL + GAP);
  const height = 7 * (CELL + GAP);

  function cellFor(col: number, rowWeekday: number): { date: string; idx: number } | null {
    const weekStartDate = addDaysStr(start, col * 7);
    const date = addDaysStr(weekStartDate, rowOrder.indexOf(rowWeekday));
    if (diffDays(date, today) > 0) return null; // future
    if (diffDays(date, start) < 0) return null;
    return { date, idx: rowOrder.indexOf(rowWeekday) };
  }

  return (
    <Card>
      <CardHeader title="Showed up" subtitle={`Last ${rangeDays} days`} />
      <div className="overflow-x-auto">
        <svg width={width} height={height} className="block">
          {Array.from({ length: weeks }).map((_, col) =>
            rowOrder.map((wd, row) => {
              const cell = cellFor(col, wd);
              if (!cell) return null;
              const isToday = cell.date === today;
              const lit = showedUp(
                cell.date,
                dayMap.get(cell.date),
                habits,
                logs,
                todos,
                threshold,
              );
              return (
                <rect
                  key={`${col}-${row}`}
                  x={col * (CELL + GAP)}
                  y={row * (CELL + GAP)}
                  width={CELL}
                  height={CELL}
                  rx={4}
                  className={
                    lit
                      ? "fill-accent-500"
                      : isToday
                        ? "fill-transparent stroke-accent-400"
                        : "fill-slate-200 dark:fill-slate-800"
                  }
                  strokeWidth={isToday ? 2 : 0}
                  strokeDasharray={isToday && !lit ? "3 2" : undefined}
                >
                  <title>
                    {prettyDate(cell.date)}
                    {isToday ? " (today)" : ""} — {lit ? "showed up" : "—"}
                  </title>
                </rect>
              );
            }),
          )}
        </svg>
      </div>
      <Legend />
    </Card>
  );
}

function Legend() {
  return (
    <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm bg-accent-500" /> Showed up
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm bg-slate-200 dark:bg-slate-800" /> No
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm border-2 border-dashed border-accent-400" /> Today
      </span>
    </div>
  );
}
