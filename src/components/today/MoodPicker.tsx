import { MOOD_FACES } from "../../lib/mood";
import type { Mood } from "../../data/types";
import { cx } from "../ui/cx";

/** 5 emoji faces ↔ 1–5 (PRD §10.1 Mood). Tapping a selected face clears it. */
export function MoodPicker({
  value,
  onChange,
}: {
  value: Mood | null;
  onChange: (mood: Mood | null) => void;
}) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Mood">
      {MOOD_FACES.map((m) => {
        const selected = value === m.value;
        return (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={m.label}
            title={m.label}
            onClick={() => onChange(selected ? null : m.value)}
            className={cx(
              "flex h-10 w-10 items-center justify-center rounded-full text-xl transition",
              "motion-safe:hover:scale-110",
              selected
                ? "bg-accent-100 ring-2 ring-accent-500 dark:bg-accent-950/60"
                : "opacity-50 hover:opacity-100",
            )}
          >
            {m.face}
          </button>
        );
      })}
    </div>
  );
}
