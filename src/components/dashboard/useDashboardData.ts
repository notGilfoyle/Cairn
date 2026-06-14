import { useEffect, useState } from "react";
import type { Habit, HabitLog, Todo, Day } from "../../data/types";
import { habitsRepo, habitLogsRepo, todosRepo, daysRepo } from "../../data/repositories";

export interface DashboardData {
  habits: Habit[];
  logs: HabitLog[];
  todos: Todo[];
  days: Day[];
  loading: boolean;
}

/**
 * Loads the full history the dashboard needs. Re-fetches whenever `nonce`
 * changes — the Dashboard route passes a value that updates on mount so data is
 * fresh after edits made on Today.
 */
export function useDashboardData(nonce: number): DashboardData {
  const [data, setData] = useState<DashboardData>({
    habits: [],
    logs: [],
    todos: [],
    days: [],
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [habits, logs, todos, days] = await Promise.all([
        habitsRepo.all(),
        habitLogsRepo.all(),
        todosRepo.all(),
        daysRepo.all(),
      ]);
      if (!cancelled) setData({ habits, logs, todos, days, loading: false });
    })();
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  return data;
}
