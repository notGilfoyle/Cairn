import type { Habit, HabitLog, Todo, Day, DateStr, Mood } from "../data/types";
import { addDaysStr, diffDays, weekStartFor } from "./dates";
import { isScheduledOn } from "./cadence";
import type { WeekStart } from "../data/types";

/**
 * Metric calculations (PRD §9). All functions are PURE — they take plain data
 * and never touch the DB — so they're unit-testable against seeded fixtures.
 *
 * Date walking is bounded by the earliest relevant record to avoid unbounded
 * loops; a streak can never extend earlier than the first log/day we have.
 */

function doneDatesForHabit(habit: Habit, logs: HabitLog[]): Set<DateStr> {
  return new Set(logs.filter((l) => l.habitId === habit.id && l.done).map((l) => l.date));
}

/** Earliest date among a habit's logs, or `fallback` when it has none. */
function earliestLogDate(habit: Habit, logs: HabitLog[], fallback: DateStr): DateStr {
  let min: DateStr | null = null;
  for (const l of logs) {
    if (l.habitId !== habit.id) continue;
    if (min === null || l.date < min) min = l.date;
  }
  return min ?? fallback;
}

/**
 * Current streak for a habit: consecutive *scheduled* days that are `done`,
 * counting back from today. Today is "pending" — if it's scheduled and not yet
 * done, it neither counts nor breaks the streak (PRD §9).
 */
export function habitCurrentStreak(habit: Habit, logs: HabitLog[], today: DateStr): number {
  const done = doneDatesForHabit(habit, logs);
  const lower = earliestLogDate(habit, logs, today);

  let cursor = today;
  // Skip a pending today.
  if (isScheduledOn(habit.cadence, today) && !done.has(today)) {
    cursor = addDaysStr(today, -1);
  }

  let streak = 0;
  while (diffDays(cursor, lower) >= 0) {
    if (isScheduledOn(habit.cadence, cursor)) {
      if (done.has(cursor)) streak++;
      else break;
    }
    cursor = addDaysStr(cursor, -1);
  }
  return streak;
}

/** Longest run of consecutive scheduled `done` days over the habit's history. */
export function habitLongestStreak(habit: Habit, logs: HabitLog[], today: DateStr): number {
  const done = doneDatesForHabit(habit, logs);
  const lower = earliestLogDate(habit, logs, today);

  let best = 0;
  let run = 0;
  let cursor = lower;
  while (diffDays(today, cursor) >= 0) {
    if (isScheduledOn(habit.cadence, cursor)) {
      if (done.has(cursor)) {
        run++;
        if (run > best) best = run;
      } else if (cursor === today) {
        // today pending: don't reset on the trailing edge
      } else {
        run = 0;
      }
    }
    cursor = addDaysStr(cursor, 1);
  }
  return best;
}

function scheduledHabitsOn(habits: Habit[], date: DateStr): Habit[] {
  return habits.filter((h) => !h.archived && isScheduledOn(h.cadence, date));
}

/** Is `date` a perfect day: ≥1 habit scheduled and all of them done. */
export function isPerfectDay(habits: Habit[], logs: HabitLog[], date: DateStr): boolean {
  const scheduled = scheduledHabitsOn(habits, date);
  if (scheduled.length === 0) return false;
  const doneSet = new Set(logs.filter((l) => l.done && l.date === date).map((l) => l.habitId));
  return scheduled.every((h) => doneSet.has(h.id));
}

/**
 * Perfect-day streak: consecutive perfect days counting back from today. Days
 * with no scheduled habits are skipped (neither count nor break). Today is
 * excluded while still pending (PRD §9).
 */
export function perfectDayStreak(
  habits: Habit[],
  logs: HabitLog[],
  today: DateStr,
  lowerBound?: DateStr,
): number {
  const lower = lowerBound ?? earliestDate(logs, today);

  let cursor = today;
  if (!isPerfectDay(habits, logs, today)) {
    // today not (yet) perfect — treat as pending, start from yesterday
    cursor = addDaysStr(today, -1);
  }

  let streak = 0;
  while (diffDays(cursor, lower) >= 0) {
    const scheduled = scheduledHabitsOn(habits, cursor);
    if (scheduled.length > 0) {
      if (isPerfectDay(habits, logs, cursor)) streak++;
      else break;
    }
    cursor = addDaysStr(cursor, -1);
  }
  return streak;
}

function earliestDate(logs: HabitLog[], fallback: DateStr): DateStr {
  let min: DateStr | null = null;
  for (const l of logs) if (min === null || l.date < min) min = l.date;
  return min ?? fallback;
}

/** A day "counts" for journaling if it has any AM or PM entry text. */
export function hasJournal(day: Day | undefined): boolean {
  if (!day) return false;
  const am = day.amJournal?.text.trim().length ?? 0;
  const pm = day.pmJournal?.text.trim().length ?? 0;
  return am > 0 || pm > 0;
}

/**
 * Journaling streak: consecutive days with ≥1 entry, counting back from today.
 * Today is pending — no entry today doesn't break the streak.
 */
export function journalingStreak(days: Day[], today: DateStr): number {
  const journaled = new Set(days.filter(hasJournal).map((d) => d.date));
  if (journaled.size === 0) return 0;
  const lower = [...journaled].reduce((a, b) => (a < b ? a : b));

  let cursor = today;
  if (!journaled.has(today)) cursor = addDaysStr(today, -1);

  let streak = 0;
  while (diffDays(cursor, lower) >= 0) {
    if (journaled.has(cursor)) streak++;
    else break;
    cursor = addDaysStr(cursor, -1);
  }
  return streak;
}

/**
 * "Showed up" on `date`: has a journal entry AND (≥`threshold` scheduled habit
 * done OR ≥`threshold` todo completed) (PRD §9). Returns false for future days.
 */
export function showedUp(
  date: DateStr,
  day: Day | undefined,
  habits: Habit[],
  logs: HabitLog[],
  todos: Todo[],
  threshold = 1,
): boolean {
  if (!hasJournal(day)) return false;
  const scheduledIds = new Set(scheduledHabitsOn(habits, date).map((h) => h.id));
  const habitsDone = logs.filter(
    (l) => l.date === date && l.done && scheduledIds.has(l.habitId),
  ).length;
  const todosDone = todos.filter((t) => t.done && t.date === date).length;
  return habitsDone >= threshold || todosDone >= threshold;
}

/**
 * Week todo completion rate: completed ÷ (completed + still-open dated items)
 * within the week containing `today`. Returns null when there are no dated
 * items that week (PRD §9).
 */
export function weekCompletionRate(
  todos: Todo[],
  today: DateStr,
  weekStart: WeekStart,
): number | null {
  const start = weekStartFor(today, weekStart);
  const end = addDaysStr(start, 6);
  const inWeek = todos.filter(
    (t) => t.date !== null && t.date >= start && t.date <= end,
  );
  const completed = inWeek.filter((t) => t.done).length;
  const open = inWeek.filter((t) => !t.done).length;
  const denom = completed + open;
  if (denom === 0) return null;
  return completed / denom;
}

/** Collect the distinct tags across habits and todos, sorted. */
export function allTags(habits: Habit[], todos: Todo[]): string[] {
  const set = new Set<string>();
  for (const h of habits) for (const t of h.tags) set.add(t);
  for (const td of todos) for (const t of td.tags) set.add(t);
  return [...set].sort();
}

/** Mood series (AM+PM) over a date range, with nulls for gaps. */
export interface MoodPoint {
  date: DateStr;
  am: Mood | null;
  pm: Mood | null;
}

export function moodSeries(days: Day[], dates: DateStr[]): MoodPoint[] {
  const byDate = new Map(days.map((d) => [d.date, d]));
  return dates.map((date) => {
    const d = byDate.get(date);
    return { date, am: d?.amJournal?.mood ?? null, pm: d?.pmJournal?.mood ?? null };
  });
}
