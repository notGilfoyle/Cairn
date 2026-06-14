import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "../../store/useStore";
import type { Habit } from "../../data/types";
import { Card, CardHeader } from "../ui/Card";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { HabitEditor } from "./HabitEditor";
import { cadenceSummary } from "../../lib/cadence";
import { cx } from "../ui/cx";

export function HabitsManager() {
  const habits = useStore(useShallow((s) => s.habits));
  const createHabit = useStore((s) => s.createHabit);
  const updateHabit = useStore((s) => s.updateHabit);
  const archiveHabit = useStore((s) => s.archiveHabit);
  const deleteHabit = useStore((s) => s.deleteHabit);

  const [editing, setEditing] = useState<Habit | null>(null);
  const [creating, setCreating] = useState(false);

  const active = habits.filter((h) => !h.archived);
  const archived = habits.filter((h) => h.archived);

  return (
    <Card>
      <CardHeader
        title="Habits"
        right={
          <Button size="sm" variant="primary" onClick={() => setCreating(true)}>
            + Add
          </Button>
        }
      />

      {active.length === 0 && <p className="text-sm text-slate-400">No habits yet.</p>}

      <ul className="space-y-2">
        {active.map((h) => (
          <HabitListRow key={h.id} habit={h} onClick={() => setEditing(h)} />
        ))}
      </ul>

      {archived.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-slate-400">
            Archived ({archived.length})
          </summary>
          <ul className="mt-2 space-y-2">
            {archived.map((h) => (
              <HabitListRow key={h.id} habit={h} onClick={() => setEditing(h)} archived />
            ))}
          </ul>
        </details>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New habit">
        <HabitEditor onSave={(input) => createHabit(input)} onClose={() => setCreating(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit habit">
        {editing && (
          <HabitEditor
            habit={editing}
            onSave={(input) => updateHabit(editing.id, input)}
            onArchive={(archived) => archiveHabit(editing.id, archived)}
            onDelete={() => deleteHabit(editing.id)}
            onClose={() => setEditing(null)}
          />
        )}
      </Modal>
    </Card>
  );
}

function HabitListRow({
  habit,
  onClick,
  archived,
}: {
  habit: Habit;
  onClick: () => void;
  archived?: boolean;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className={cx(
          "flex w-full items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60",
          archived && "opacity-60",
        )}
      >
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg text-xl"
          style={{ backgroundColor: `${habit.color}22` }}
        >
          {habit.emoji}
        </span>
        <span className="flex-1">
          <span className="block font-medium">{habit.name}</span>
          <span className="block text-xs text-slate-400">
            {cadenceSummary(habit.cadence)}
            {habit.tags.length > 0 && ` · ${habit.tags.map((t) => `#${t}`).join(" ")}`}
          </span>
        </span>
        <span className="text-slate-300">›</span>
      </button>
    </li>
  );
}
