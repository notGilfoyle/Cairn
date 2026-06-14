import type { Cadence } from "../../data/types";
import { cx } from "../ui/cx";
import { weekdayName } from "../../lib/cadence";

// Display order respects ISO week (Mon first) but stores JS weekday numbers.
const ORDER = [1, 2, 3, 4, 5, 6, 0];

export function CadencePicker({
  value,
  onChange,
}: {
  value: Cadence;
  onChange: (cadence: Cadence) => void;
}) {
  const isDaily = value === "daily";
  const selected = isDaily ? [] : value.weekdays;

  function toggleDay(wd: number) {
    const base = isDaily ? [0, 1, 2, 3, 4, 5, 6] : [...selected];
    const next = base.includes(wd) ? base.filter((d) => d !== wd) : [...base, wd];
    onChange(next.length === 7 ? "daily" : { weekdays: next.sort((a, b) => a - b) });
  }

  return (
    <div>
      <div className="mb-2 flex gap-2">
        <button
          type="button"
          onClick={() => onChange("daily")}
          className={cx(
            "rounded-lg px-3 py-1.5 text-sm font-medium",
            isDaily ? "bg-accent-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
          )}
        >
          Daily
        </button>
        <button
          type="button"
          onClick={() => onChange({ weekdays: selected.length ? selected : [1, 2, 3, 4, 5] })}
          className={cx(
            "rounded-lg px-3 py-1.5 text-sm font-medium",
            !isDaily ? "bg-accent-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
          )}
        >
          Specific days
        </button>
      </div>

      {!isDaily && (
        <div className="flex gap-1.5">
          {ORDER.map((wd) => {
            const on = selected.includes(wd);
            return (
              <button
                key={wd}
                type="button"
                onClick={() => toggleDay(wd)}
                aria-pressed={on}
                aria-label={weekdayName(wd)}
                className={cx(
                  "h-9 w-9 rounded-full text-xs font-semibold transition-colors",
                  on
                    ? "bg-accent-500 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400",
                )}
              >
                {weekdayName(wd).slice(0, 1)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
