import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "../../store/useStore";
import { Card, CardHeader } from "../ui/Card";
import { Button } from "../ui/Button";

/** Undated todos that can be added and scheduled onto a specific day (PRD §10.3). */
export function Backlog() {
  const todos = useStore(useShallow((s) => s.todos));
  const today = useStore((s) => s.date);
  const scheduleTodo = useStore((s) => s.scheduleTodo);
  const deleteTodo = useStore((s) => s.deleteTodo);
  const addTodo = useStore((s) => s.addTodo);

  const backlog = todos.filter((t) => t.date === null && !t.done);
  const [draft, setDraft] = useState("");

  async function addToBacklog(e: React.FormEvent) {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    setDraft("");
    // addTodo dates to today; immediately move to backlog (date=null).
    await addTodo(title);
    const created = useStore.getState().todos.at(-1);
    if (created) await scheduleTodo(created.id, null);
  }

  return (
    <Card>
      <CardHeader title="Backlog" subtitle="Undated todos — schedule when ready" />

      {backlog.length === 0 ? (
        <p className="text-sm text-slate-400">Backlog is empty.</p>
      ) : (
        <ul className="space-y-2">
          {backlog.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/60"
            >
              <span className="flex-1 text-sm">{t.title}</span>
              <Button size="sm" variant="secondary" onClick={() => scheduleTodo(t.id, today)}>
                Today
              </Button>
              <button
                onClick={() => deleteTodo(t.id)}
                aria-label="Delete"
                className="px-1 text-slate-400 hover:text-red-500"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={addToBacklog} className="mt-3 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add to backlog…"
          aria-label="Add to backlog"
          className="h-10 flex-1 rounded-lg border border-slate-200 bg-transparent px-3 text-sm dark:border-slate-700"
        />
        <Button size="sm" type="submit" variant="secondary">
          Add
        </Button>
      </form>
    </Card>
  );
}
