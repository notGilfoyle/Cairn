import type { TrackerInput } from "./repositories";
import type { TrackerType } from "./types";

/**
 * Preset tracker configs (v2 PRD §4 / §5). A preset pre-fills the builder so the
 * user isn't staring at a blank form. `presetKey` is stamped onto created
 * trackers so the dashboard can pick the right card (e.g. Workouts → WorkoutsCard).
 */
export interface Preset {
  key: string;
  label: string;
  description: string;
  config: TrackerInput;
}

export const PRESETS: Preset[] = [
  {
    key: "finance",
    label: "Finance",
    description: "Money in and out, by category. Negative = spend.",
    config: {
      name: "Finance",
      type: "quantity",
      emoji: "💰",
      color: "#10b981",
      tags: [],
      presetKey: "finance",
      unit: "₹",
      aggregation: "sum",
      allowsNegative: true,
      direction: "neutral",
      goal: null,
      sessionTypes: [],
    },
  },
  {
    key: "weight",
    label: "Weight",
    description: "Track body weight over time.",
    config: {
      name: "Weight",
      type: "quantity",
      emoji: "⚖️",
      color: "#6366f1",
      tags: [],
      presetKey: "weight",
      unit: "kg",
      aggregation: "latest",
      allowsNegative: false,
      direction: "neutral",
      goal: null,
      sessionTypes: [],
    },
  },
  {
    key: "water",
    label: "Water",
    description: "Daily hydration with a 2000 ml goal.",
    config: {
      name: "Water",
      type: "quantity",
      emoji: "💧",
      color: "#3b82f6",
      tags: [],
      presetKey: "water",
      unit: "ml",
      aggregation: "sum",
      allowsNegative: false,
      direction: "up_good",
      goal: { period: "day", target: 2000 },
      sessionTypes: [],
    },
  },
  {
    key: "study",
    label: "Study hours",
    description: "Hours of focused study; set your own goal.",
    config: {
      name: "Study hours",
      type: "quantity",
      emoji: "📚",
      color: "#f59e0b",
      tags: [],
      presetKey: "study",
      unit: "hrs",
      aggregation: "sum",
      allowsNegative: false,
      direction: "up_good",
      goal: { period: "week", target: 10 },
      sessionTypes: [],
    },
  },
  {
    key: "workouts",
    label: "Workouts",
    description: "Log sessions across activities; see weekly volume.",
    config: {
      name: "Workouts",
      type: "session",
      emoji: "🏋️",
      color: "#ef4444",
      tags: [],
      presetKey: "workouts",
      unit: null,
      aggregation: null,
      allowsNegative: false,
      direction: null,
      goal: null,
      sessionTypes: ["Running", "Calisthenics", "Gym", "Swim", "Basketball"],
    },
  },
];

export function presetByKey(key: string): Preset | undefined {
  return PRESETS.find((p) => p.key === key);
}

/** A blank starting config for the chosen type. */
export function blankTracker(type: TrackerType): TrackerInput {
  return {
    name: "",
    type,
    emoji: type === "session" ? "🏃" : "📊",
    color: "#6366f1",
    tags: [],
    presetKey: null,
    unit: type === "quantity" ? "" : null,
    aggregation: type === "quantity" ? "sum" : null,
    allowsNegative: false,
    direction: type === "quantity" ? "neutral" : null,
    goal: null,
    sessionTypes: type === "session" ? ["Session"] : [],
  };
}
