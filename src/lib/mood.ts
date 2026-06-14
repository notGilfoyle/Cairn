import type { Mood } from "../data/types";

/** 5 emoji faces mapped to 1–5 (PRD locked decision #1). */
export const MOOD_FACES: { value: Mood; face: string; label: string }[] = [
  { value: 1, face: "😖", label: "Awful" },
  { value: 2, face: "😕", label: "Low" },
  { value: 3, face: "😐", label: "Okay" },
  { value: 4, face: "🙂", label: "Good" },
  { value: 5, face: "😄", label: "Great" },
];

export function faceFor(mood: Mood | null | undefined): string {
  if (!mood) return "·";
  return MOOD_FACES.find((m) => m.value === mood)?.face ?? "·";
}

export function labelFor(mood: Mood | null | undefined): string {
  if (!mood) return "No mood";
  return MOOD_FACES.find((m) => m.value === mood)?.label ?? "No mood";
}
