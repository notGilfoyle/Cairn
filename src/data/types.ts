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
}

export interface Meta {
  key: "meta"; // single-row table
  schemaVersion: number;
  appVersion: string;
  createdAt: string;
  seededDefaults: boolean; // whether first-run default seed has run
}

export const SCHEMA_VERSION = 1;
