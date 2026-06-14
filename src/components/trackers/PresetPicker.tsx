import type { TrackerInput } from "../../data/repositories";
import { PRESETS } from "../../data/presets";
import { blankTracker } from "../../data/presets";

/** Step 1 of creating a tracker: choose a preset or a blank type (PRD §6.2). */
export function PresetPicker({ onPick }: { onPick: (config: TrackerInput) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          Start from a preset
        </p>
        <ul className="space-y-2">
          {PRESETS.map((p) => (
            <li key={p.key}>
              <button
                onClick={() => onPick({ ...p.config })}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-xl"
                  style={{ backgroundColor: `${p.config.color}22` }}
                >
                  {p.config.emoji}
                </span>
                <span className="flex-1">
                  <span className="block font-medium">{p.label}</span>
                  <span className="block text-xs text-slate-400">{p.description}</span>
                </span>
                <span className="text-slate-300">›</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">Or start blank</p>
        <div className="flex gap-2">
          <button
            onClick={() => onPick(blankTracker("quantity"))}
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
          >
            📊 Quantity
          </button>
          <button
            onClick={() => onPick(blankTracker("session"))}
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
          >
            🏃 Session
          </button>
        </div>
      </div>
    </div>
  );
}
