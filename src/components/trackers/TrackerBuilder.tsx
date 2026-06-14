import { useState } from "react";
import type { TrackerInput } from "../../data/repositories";
import type { Tracker, Aggregation, Direction, GoalPeriod } from "../../data/types";
import { Button } from "../ui/Button";
import { Toggle } from "../ui/Toggle";
import { EmojiPicker } from "../ui/EmojiPicker";
import { cx } from "../ui/cx";

const COLORS = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6"];
const AGGREGATIONS: Aggregation[] = ["sum", "average", "latest", "count"];
const DIRECTIONS: { value: Direction; label: string }[] = [
  { value: "up_good", label: "Higher is better" },
  { value: "down_good", label: "Lower is better" },
  { value: "neutral", label: "Neutral" },
];
const PERIODS: GoalPeriod[] = ["day", "week", "month"];

/**
 * Create/edit a tracker. `initial` is the working config (from a preset or
 * blank); `editing` is set when modifying an existing tracker (type is locked).
 */
export function TrackerBuilder({
  initial,
  editing,
  onSave,
  onArchive,
  onDelete,
  onClose,
}: {
  initial: TrackerInput;
  editing?: Tracker;
  onSave: (input: TrackerInput) => void;
  onArchive?: (archived: boolean) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [cfg, setCfg] = useState<TrackerInput>(initial);
  const [goalOn, setGoalOn] = useState<boolean>(!!initial.goal);

  function set<K extends keyof TrackerInput>(key: K, value: TrackerInput[K]) {
    setCfg((c) => ({ ...c, [key]: value }));
  }

  function save() {
    if (!cfg.name.trim()) return;
    const out: TrackerInput = {
      ...cfg,
      name: cfg.name.trim(),
      goal: cfg.type === "quantity" && goalOn ? (cfg.goal ?? { period: "day", target: 0 }) : null,
    };
    onSave(out);
    onClose();
  }

  return (
    <div className="space-y-4">
      <Field label="Name">
        <input
          value={cfg.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder={cfg.type === "session" ? "e.g. Workouts" : "e.g. Water"}
          autoFocus
          className="h-11 w-full rounded-lg border border-slate-200 bg-transparent px-3 dark:border-slate-700"
        />
      </Field>

      <Field label="Emoji">
        <EmojiPicker value={cfg.emoji} onChange={(v) => set("emoji", v)} />
      </Field>

      <Field label="Color">
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => set("color", c)}
              aria-label={`Color ${c}`}
              className={cx(
                "h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900",
                cfg.color === c ? "ring-slate-900 dark:ring-white" : "ring-transparent",
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </Field>

      {/* Type-specific config */}
      {cfg.type === "quantity" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Unit">
              <input
                value={cfg.unit ?? ""}
                onChange={(e) => set("unit", e.target.value)}
                placeholder="₹, kg, ml, hrs, km"
                className="h-11 w-full rounded-lg border border-slate-200 bg-transparent px-3 dark:border-slate-700"
              />
            </Field>
            <Field label="Aggregation">
              <select
                value={cfg.aggregation ?? "sum"}
                onChange={(e) => set("aggregation", e.target.value as Aggregation)}
                className="h-11 w-full rounded-lg border border-slate-200 bg-transparent px-3 capitalize dark:border-slate-700"
              >
                {AGGREGATIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Trend">
            <select
              value={cfg.direction ?? "neutral"}
              onChange={(e) => set("direction", e.target.value as Direction)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-transparent px-3 dark:border-slate-700"
            >
              {DIRECTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Allow negative values
              </span>
              <p className="text-xs text-slate-400">Ledger style — e.g. finance spend.</p>
            </div>
            <Toggle
              checked={cfg.allowsNegative}
              onChange={(v) => set("allowsNegative", v)}
              label="Allow negative values"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Goal</span>
              <Toggle checked={goalOn} onChange={setGoalOn} label="Goal" />
            </div>
            {goalOn && (
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  value={cfg.goal?.target ?? 0}
                  onChange={(e) =>
                    set("goal", {
                      period: cfg.goal?.period ?? "day",
                      target: Number(e.target.value),
                    })
                  }
                  className="h-11 flex-1 rounded-lg border border-slate-200 bg-transparent px-3 dark:border-slate-700"
                />
                <select
                  value={cfg.goal?.period ?? "day"}
                  onChange={(e) =>
                    set("goal", {
                      period: e.target.value as GoalPeriod,
                      target: cfg.goal?.target ?? 0,
                    })
                  }
                  className="h-11 rounded-lg border border-slate-200 bg-transparent px-3 dark:border-slate-700"
                >
                  {PERIODS.map((p) => (
                    <option key={p} value={p}>
                      per {p}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </>
      ) : (
        <Field label="Session types">
          <SessionTypesEditor
            value={cfg.sessionTypes}
            onChange={(v) => set("sessionTypes", v)}
          />
        </Field>
      )}

      <Field label="Tags">
        <input
          value={cfg.tags.join(", ")}
          onChange={(e) => set("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
          placeholder="comma,separated"
          className="h-11 w-full rounded-lg border border-slate-200 bg-transparent px-3 dark:border-slate-700"
        />
      </Field>

      <div className="flex items-center gap-2 pt-2">
        <Button variant="primary" onClick={save} className="flex-1">
          {editing ? "Save" : "Create tracker"}
        </Button>
        {editing && onArchive && (
          <Button variant="secondary" onClick={() => { onArchive(!editing.archived); onClose(); }}>
            {editing.archived ? "Unarchive" : "Archive"}
          </Button>
        )}
        {editing && onDelete && (
          <Button variant="danger" onClick={() => { onDelete(); onClose(); }}>
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}

function SessionTypesEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  function add() {
    const t = draft.trim();
    if (!t || value.includes(t)) return;
    onChange([...value, t]);
    setDraft("");
  }
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {value.map((t) => (
          <span
            key={t}
            className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-sm dark:bg-slate-800"
          >
            {t}
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== t))}
              aria-label={`Remove ${t}`}
              className="text-slate-400 hover:text-red-500"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add a type…"
          className="h-10 flex-1 rounded-lg border border-slate-200 bg-transparent px-3 text-sm dark:border-slate-700"
        />
        <Button size="sm" variant="secondary" type="button" onClick={add}>
          Add
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">
        {label}
      </label>
      {children}
    </div>
  );
}
