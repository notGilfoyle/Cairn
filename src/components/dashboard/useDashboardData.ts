import { useEffect, useState } from "react";
import type {
  Habit,
  HabitLog,
  Todo,
  Day,
  Tracker,
  QuantityEntry,
  SessionEntry,
} from "../../data/types";
import {
  habitsRepo,
  habitLogsRepo,
  todosRepo,
  daysRepo,
  trackersRepo,
  quantityEntriesRepo,
  sessionEntriesRepo,
} from "../../data/repositories";

export interface DashboardData {
  habits: Habit[];
  logs: HabitLog[];
  todos: Todo[];
  days: Day[];
  trackers: Tracker[];
  quantity: QuantityEntry[];
  session: SessionEntry[];
  loading: boolean;
}

/**
 * Loads the full history the dashboard needs (v1 + v2 entities). Re-fetches
 * whenever `nonce` changes so data is fresh after edits made elsewhere.
 */
export function useDashboardData(nonce: number): DashboardData {
  const [data, setData] = useState<DashboardData>({
    habits: [],
    logs: [],
    todos: [],
    days: [],
    trackers: [],
    quantity: [],
    session: [],
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [habits, logs, todos, days, trackers, quantity, session] = await Promise.all([
        habitsRepo.all(),
        habitLogsRepo.all(),
        todosRepo.all(),
        daysRepo.all(),
        trackersRepo.all(),
        quantityEntriesRepo.all(),
        sessionEntriesRepo.all(),
      ]);
      if (!cancelled)
        setData({ habits, logs, todos, days, trackers, quantity, session, loading: false });
    })();
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  return data;
}
