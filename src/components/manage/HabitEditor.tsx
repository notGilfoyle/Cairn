import { useState } from "react";
import type { Habit, Cadence } from "../../data/types";
import type { HabitInput } from "../../store/useStore";
import { Button } from "../ui/Button";
import { EmojiPicker } from "../ui/EmojiPicker";
import { CadencePicker } from "./CadencePicker";
import { cx } from "../ui/cx";

const COLORS = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6"];

/** Create/edit a habit. `habit` is undefined when creating. */
export function HabitEditor({
  habit,
  onSave,
  onArchive,
  onDelete,
  onClose,
}: {
  habit?: Habit;
  onSave: (input: HabitInput) => void;
  onArchive?: (archived: boolean) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(habit?.name ?? "");
  const [emoji, setEmoji] = useState(habit?.emoji ?? "✅");
  const [color, setColor] = useState(habit?.color ?? COLORS[4]);
  const [cadence, setCadence] = useState<Cadence>(habit?.cadence ?? "daily");
  const [tags, setTags] = useState((habit?.tags ?? []).join(", "));

  function save() {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      emoji,
      color,
      cadence,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    onClose();
  }

  return (
    <div className="space-y-4">
      <Field label="Name">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Drink water"
          autoFocus
          className="h-11 w-full rounded-lg border border-slate-200 bg-transparent px-3 dark:border-slate-700"
        />
      </Field>

      <Field label="Emoji">
        <EmojiPicker value={emoji} onChange={setEmoji} />
      </Field>

      <Field label="Color">
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
              className={cx(
                "h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900",
                color === c ? "ring-slate-900 dark:ring-white" : "ring-transparent",
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </Field>

      <Field label="Cadence">
        <CadencePicker value={cadence} onChange={setCadence} />
      </Field>

      <Field label="Tags">
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="comma,separated"
          className="h-11 w-full rounded-lg border border-slate-200 bg-transparent px-3 dark:border-slate-700"
        />
      </Field>

      <div className="flex items-center gap-2 pt-2">
        <Button variant="primary" onClick={save} className="flex-1">
          {habit ? "Save" : "Add habit"}
        </Button>
        {habit && onArchive && (
          <Button variant="secondary" onClick={() => { onArchive(!habit.archived); onClose(); }}>
            {habit.archived ? "Unarchive" : "Archive"}
          </Button>
        )}
        {habit && onDelete && (
          <Button variant="danger" onClick={() => { onDelete(); onClose(); }} aria-label="Delete habit">
            Delete
          </Button>
        )}
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
