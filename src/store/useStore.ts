import { create } from "zustand";
import type {
  Settings,
  Habit,
  HabitLog,
  Todo,
  Day,
  Mood,
  Theme,
  AccentKey,
  WeekStart,
  Tracker,
  QuantityEntry,
  SessionEntry,
} from "../data/types";
import {
  settingsRepo,
  habitsRepo,
  habitLogsRepo,
  todosRepo,
  daysRepo,
  metaRepo,
  trackersRepo,
  quantityEntriesRepo,
  sessionEntriesRepo,
  type TrackerInput,
  DEFAULT_SETTINGS,
} from "../data/repositories";
import { seedDefaultsIfEmpty } from "../data/seed";
import { today as todayStr } from "../lib/dates";
import { isScheduledOn } from "../lib/cadence";
import { applyAccent } from "../lib/accent";
import { newId } from "../lib/id";

export type View = "today" | "dashboard" | "trackers" | "manage";

/** Editable fields when creating a habit from the Manage screen. */
export type HabitInput = Pick<Habit, "name" | "emoji" | "color" | "cadence" | "tags">;

interface StoreState {
  ready: boolean;
  view: View;
  date: string; // the "today" the UI is anchored to

  settings: Settings;
  habits: Habit[]; // all habits (incl. archived); filter in selectors
  todayLogs: Record<string, HabitLog>; // habitId -> log for `date`
  todos: Todo[]; // all todos
  day: Day; // the current day's journal/intentions
  trackers: Tracker[]; // all trackers (incl. archived); filter in selectors

  // entriesVersion bumps whenever a quantity/session entry changes, so views
  // that load entries on demand (detail, dashboard) know to re-fetch.
  entriesVersion: number;

  // lifecycle
  hydrate: () => Promise<void>;
  setView: (v: View) => void;

  // appearance
  setTheme: (theme: Theme) => Promise<void>;
  toggleTheme: () => Promise<void>;
  setAccent: (accent: AccentKey) => Promise<void>;
  setWeekStart: (weekStart: WeekStart) => Promise<void>;
  patchSettings: (patch: Partial<Omit<Settings, "key">>) => Promise<void>;

  // habits
  reloadHabits: () => Promise<void>;
  toggleHabit: (habitId: string) => Promise<void>;
  createHabit: (input: HabitInput) => Promise<void>;
  updateHabit: (id: string, patch: Partial<Omit<Habit, "id">>) => Promise<void>;
  archiveHabit: (id: string, archived: boolean) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;

  // todos
  reloadTodos: () => Promise<void>;
  addTodo: (title: string) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  setTodoCarryOver: (id: string, carryOver: boolean) => Promise<void>;
  scheduleTodo: (id: string, date: string | null) => Promise<void>;

  // day / journal
  reloadDay: () => Promise<void>;
  saveJournal: (slot: "am" | "pm", text: string) => Promise<void>;
  setMood: (slot: "am" | "pm", mood: Mood | null) => Promise<void>;
  setIntentions: (intentions: string[]) => Promise<void>;

  // trackers (v2)
  reloadTrackers: () => Promise<void>;
  createTracker: (input: TrackerInput) => Promise<Tracker>;
  updateTracker: (id: string, patch: Partial<Omit<Tracker, "id">>) => Promise<void>;
  archiveTracker: (id: string, archived: boolean) => Promise<void>;
  deleteTracker: (id: string) => Promise<void>;

  // tracker entries (v2) — each mutation bumps entriesVersion
  addQuantityEntry: (
    input: Partial<QuantityEntry> & Pick<QuantityEntry, "trackerId" | "date" | "amount">,
  ) => Promise<void>;
  updateQuantityEntry: (id: string, patch: Partial<Omit<QuantityEntry, "id">>) => Promise<void>;
  deleteQuantityEntry: (id: string) => Promise<void>;
  addSessionEntry: (
    input: Partial<SessionEntry> & Pick<SessionEntry, "trackerId" | "date" | "sessionType">,
  ) => Promise<void>;
  updateSessionEntry: (id: string, patch: Partial<Omit<SessionEntry, "id">>) => Promise<void>;
  deleteSessionEntry: (id: string) => Promise<void>;
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem("cairn-theme", theme);
  } catch {
    /* ignore */
  }
}

// Shared across concurrent callers so StrictMode's double-invoked boot effect
// (and any accidental re-entry) runs hydration — including the first-run seed —
// exactly once.
let hydratePromise: Promise<void> | null = null;

export const useStore = create<StoreState>((set, get) => ({
  ready: false,
  view: "today",
  date: todayStr(),

  settings: DEFAULT_SETTINGS,
  habits: [],
  todayLogs: {},
  todos: [],
  day: { date: todayStr(), amJournal: null, pmJournal: null, intentions: [], updatedAt: "" },
  trackers: [],
  entriesVersion: 0,

  async hydrate() {
    if (get().ready) return;
    if (hydratePromise) return hydratePromise;

    hydratePromise = (async () => {
      await metaRepo.ensure();
      await seedDefaultsIfEmpty();

      const settings = await settingsRepo.get();
      applyTheme(settings.theme);
      applyAccent(settings.accent);

      const date = todayStr();
      const [habits, todos, day, logs, trackers] = await Promise.all([
        habitsRepo.all(),
        todosRepo.all(),
        daysRepo.getOrEmpty(date),
        habitLogsRepo.forDate(date),
        trackersRepo.all(),
      ]);

      const todayLogs: Record<string, HabitLog> = {};
      for (const l of logs) todayLogs[l.habitId] = l;

      set({ ready: true, settings, date, habits, todos, day, todayLogs, trackers });
    })();

    return hydratePromise;
  },

  setView(view) {
    set({ view });
  },

  async setTheme(theme) {
    applyTheme(theme);
    const settings = await settingsRepo.patch({ theme });
    set({ settings });
  },

  async toggleTheme() {
    const next = get().settings.theme === "dark" ? "light" : "dark";
    await get().setTheme(next);
  },

  async setAccent(accent) {
    applyAccent(accent);
    const settings = await settingsRepo.patch({ accent });
    set({ settings });
  },

  async setWeekStart(weekStart) {
    const settings = await settingsRepo.patch({ weekStart });
    set({ settings });
  },

  async patchSettings(patch) {
    const settings = await settingsRepo.patch(patch);
    if (patch.theme) applyTheme(patch.theme);
    if (patch.accent) applyAccent(patch.accent);
    set({ settings });
  },

  async reloadHabits() {
    const [habits, logs] = await Promise.all([
      habitsRepo.all(),
      habitLogsRepo.forDate(get().date),
    ]);
    const todayLogs: Record<string, HabitLog> = {};
    for (const l of logs) todayLogs[l.habitId] = l;
    set({ habits, todayLogs });
  },

  async toggleHabit(habitId) {
    const { date, todayLogs } = get();
    const log = await habitLogsRepo.toggle(habitId, date);
    set({ todayLogs: { ...todayLogs, [habitId]: log } });
  },

  async createHabit(input) {
    await habitsRepo.create(input);
    await get().reloadHabits();
  },

  async updateHabit(id, patch) {
    await habitsRepo.update(id, patch);
    await get().reloadHabits();
  },

  async archiveHabit(id, archived) {
    await habitsRepo.setArchived(id, archived);
    await get().reloadHabits();
  },

  async deleteHabit(id) {
    await habitsRepo.remove(id);
    await get().reloadHabits();
  },

  async reloadTodos() {
    set({ todos: await todosRepo.all() });
  },

  async addTodo(title) {
    const trimmed = title.trim();
    if (!trimmed) return;
    const todo: Todo = {
      id: newId(),
      title: trimmed,
      date: get().date,
      done: false,
      carryOver: true,
      tags: [],
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    // optimistic
    set({ todos: [...get().todos, todo] });
    await todosRepo.create(todo);
  },

  async toggleTodo(id) {
    const todos = get().todos;
    const t = todos.find((x) => x.id === id);
    if (!t) return;
    const done = !t.done;
    const completedAt = done ? new Date().toISOString() : null;
    set({ todos: todos.map((x) => (x.id === id ? { ...x, done, completedAt } : x)) });
    await todosRepo.setDone(id, done);
  },

  async deleteTodo(id) {
    set({ todos: get().todos.filter((x) => x.id !== id) });
    await todosRepo.remove(id);
  },

  async setTodoCarryOver(id, carryOver) {
    set({ todos: get().todos.map((x) => (x.id === id ? { ...x, carryOver } : x)) });
    await todosRepo.update(id, { carryOver });
  },

  async scheduleTodo(id, date) {
    set({ todos: get().todos.map((x) => (x.id === id ? { ...x, date } : x)) });
    await todosRepo.update(id, { date });
  },

  async reloadDay() {
    set({ day: await daysRepo.getOrEmpty(get().date) });
  },

  async saveJournal(slot, text) {
    const day = await daysRepo.setJournal(get().date, slot, { text });
    set({ day });
  },

  async setMood(slot, mood) {
    const day = await daysRepo.setMood(get().date, slot, mood);
    set({ day });
  },

  async setIntentions(intentions) {
    const day = await daysRepo.patch(get().date, { intentions });
    set({ day });
  },

  async reloadTrackers() {
    set({ trackers: await trackersRepo.all() });
  },

  async createTracker(input) {
    const tracker = await trackersRepo.create(input);
    await get().reloadTrackers();
    return tracker;
  },

  async updateTracker(id, patch) {
    await trackersRepo.update(id, patch);
    await get().reloadTrackers();
  },

  async archiveTracker(id, archived) {
    await trackersRepo.setArchived(id, archived);
    await get().reloadTrackers();
  },

  async deleteTracker(id) {
    await trackersRepo.remove(id);
    await get().reloadTrackers();
    // entries were removed too
    set({ entriesVersion: get().entriesVersion + 1 });
  },

  async addQuantityEntry(input) {
    await quantityEntriesRepo.create(input);
    set({ entriesVersion: get().entriesVersion + 1 });
  },

  async updateQuantityEntry(id, patch) {
    await quantityEntriesRepo.update(id, patch);
    set({ entriesVersion: get().entriesVersion + 1 });
  },

  async deleteQuantityEntry(id) {
    await quantityEntriesRepo.remove(id);
    set({ entriesVersion: get().entriesVersion + 1 });
  },

  async addSessionEntry(input) {
    await sessionEntriesRepo.create(input);
    set({ entriesVersion: get().entriesVersion + 1 });
  },

  async updateSessionEntry(id, patch) {
    await sessionEntriesRepo.update(id, patch);
    set({ entriesVersion: get().entriesVersion + 1 });
  },

  async deleteSessionEntry(id) {
    await sessionEntriesRepo.remove(id);
    set({ entriesVersion: get().entriesVersion + 1 });
  },
}));

/** Selector: habits scheduled for the anchored date, excluding archived. */
export function scheduledHabits(s: StoreState): Habit[] {
  return s.habits.filter((h) => !h.archived && isScheduledOn(h.cadence, s.date));
}

/** Selector: todos to show on Today = dated-today + carried-over undone. */
export function todayTodos(s: StoreState): Todo[] {
  const d = s.date;
  return s.todos.filter(
    (t) =>
      t.date === d ||
      (!t.done && t.carryOver && t.date !== null && t.date < d),
  );
}

/** Selector: non-archived trackers, in sort order. */
export function activeTrackers(s: StoreState): Tracker[] {
  return s.trackers.filter((t) => !t.archived);
}
