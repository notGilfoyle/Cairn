/**
 * Core domain types. These encode PRD §8 exactly. Dates are ALWAYS the user's
 * local calendar date as a `YYYY-MM-DD` string — never a UTC timestamp — to
 * avoid day-boundary off-by-one bugs (see lib/dates.ts).
 */

/** A local calendar date, formatted `YYYY-MM-DD`. */
export type DateStr = string;

/** Mood: 5 faces mapped to 1–5. Nullable per entry. */
export type Mood = 1 | 2 | 3 | 4 | 5;

export interface JournalEntry {
  text: string;
  mood: Mood | null;
  savedAt: string; // ISO timestamp of last save
}

export interface Day {
  date: DateStr; // primary key
  amJournal: JournalEntry | null;
  pmJournal: JournalEntry | null;
  intentions: string[]; // optional top-3
  updatedAt: string;
}

/** "daily" or a set of weekdays (0=Sun … 6=Sat, matching JS getDay()). */
export type Cadence = "daily" | { weekdays: number[] };

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string; // hex, used for habit chips/heat accents
  cadence: Cadence;
  tags: string[];
  archived: boolean;
  createdAt: string;
  sortOrder: number;
}

export interface HabitLog {
  habitId: string;
  date: DateStr;
  done: boolean;
  note: string | null;
}

export interface Todo {
  id: string;
  title: string;
  date: DateStr | null; // null = backlog
  done: boolean;
  carryOver: boolean;
  tags: string[];
  createdAt: string;
  completedAt: string | null;
}

export type Theme = "light" | "dark";
export type WeekStart = "monday" | "sunday";

/** Named accent presets; AppearanceSettings can switch between these. */
export type AccentKey = "indigo" | "emerald" | "amber" | "teal";

export interface Settings {
  key: "settings"; // single-row table
  theme: Theme;
  accent: AccentKey;
  weekStart: WeekStart;
  amPrompt: string;
  pmPrompt: string;
  amPromptEnabled: boolean;
  pmPromptEnabled: boolean;
  showedUpThreshold: number; // reserved for tuning the "showed up" rule
  currency: string; // v2: symbol for finance/ledger trackers, default "₹"
}

export interface Meta {
  key: "meta"; // single-row table
  schemaVersion: number;
  appVersion: string;
  createdAt: string;
  seededDefaults: boolean; // whether first-run default seed has run
}

// ─────────────────────────────────────────────────────────────────────────
// v2 "Quantify & Move" — tracker engine (additive; v1 types above untouched)
// ─────────────────────────────────────────────────────────────────────────

export type TrackerType = "quantity" | "session";

/** How a quantity tracker rolls up multiple entries within a period. */
export type Aggregation = "sum" | "average" | "latest" | "count";

/** Drives trend coloring on the dashboard. */
export type Direction = "up_good" | "down_good" | "neutral";

export type GoalPeriod = "day" | "week" | "month";

export interface Goal {
  period: GoalPeriod;
  target: number;
}

export interface Tracker {
  id: string;
  name: string;
  type: TrackerType;
  emoji: string;
  color: string;
  tags: string[];
  archived: boolean;
  createdAt: string;
  sortOrder: number;
  presetKey: string | null;

  // quantity-only (null on session trackers)
  unit: string | null; // "₹", "kg", "ml", "hrs", "km"
  aggregation: Aggregation | null;
  allowsNegative: boolean; // true = ledger style (finance)
  direction: Direction | null;
  goal: Goal | null;

  // session-only (empty on quantity trackers)
  sessionTypes: string[]; // ["Running","Calisthenics","Gym","Swim","Basketball"]
}

export interface QuantityEntry {
  id: string;
  trackerId: string;
  date: DateStr;
  amount: number; // may be negative iff tracker.allowsNegative
  note: string | null;
  tags: string[]; // entry-level, e.g. finance category
  createdAt: string;
}

export interface SessionEntry {
  id: string;
  trackerId: string;
  date: DateStr;
  sessionType: string; // one of tracker.sessionTypes
  durationMin: number | null;
  distanceKm: number | null;
  reps: number | null;
  intensity: Mood | null; // optional RPE, 1–5
  note: string | null;
  tags: string[];
  createdAt: string;
}

export const SCHEMA_VERSION = 2;
