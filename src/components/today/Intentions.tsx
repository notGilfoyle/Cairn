import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "../../store/useStore";
import { Card, CardHeader } from "../ui/Card";
import { cx } from "../ui/cx";

const MAX = 3;

/** Optional top-3 intentions for the day (PRD §10.1). Saved to day.intentions. */
export function Intentions() {
  const stored = useStore(useShallow((s) => s.day.intentions));
  const setIntentions = useStore((s) => s.setIntentions);

  // Local state is the source of truth while mounted (instant + avoids losing
  // rapid edits across fields). Seeded once from the loaded day; the parent
  // keys this component by date so it resets on a new day.
  const [slots, setSlots] = useState<string[]>(() =>
    Array.from({ length: MAX }, (_, i) => stored[i] ?? ""),
  );

  function update(index: number, value: string) {
    const next = [...slots];
    next[index] = value;
    setSlots(next);
    void setIntentions(next.map((s) => s.trim()).filter((s) => s.length > 0));
  }

  return (
    <Card>
      <CardHeader title="Intentions" subtitle="Top 3 for today" />
      <ul className="space-y-2">
        {slots.map((value, i) => (
          <li key={i} className="flex items-center gap-3">
            <span
              className={cx(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                value.trim()
                  ? "bg-accent-500 text-white"
                  : "bg-slate-100 text-slate-400 dark:bg-slate-800",
              )}
            >
              {i + 1}
            </span>
            <input
              value={value}
              onChange={(e) => update(i, e.target.value)}
              placeholder={`Intention ${i + 1}`}
              aria-label={`Intention ${i + 1}`}
              className="h-9 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}
