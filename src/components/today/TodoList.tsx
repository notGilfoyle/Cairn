import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore, todayTodos } from "../../store/useStore";
import { Card, CardHeader } from "../ui/Card";
import { cx } from "../ui/cx";
import type { Todo } from "../../data/types";

export function TodoList() {
  const todos = useStore(useShallow(todayTodos));
  const date = useStore((s) => s.date);
  const addTodo = useStore((s) => s.addTodo);
  const [draft, setDraft] = useState("");

  const doneCount = todos.filter((t) => t.done).length;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft;
    setDraft("");
    await addTodo(text);
  }

  return (
    <Card>
      <CardHeader
        title="Todos"
        right={
          todos.length > 0 ? (
            <span className="text-sm font-semibold tabular-nums text-slate-400">
              {doneCount}/{todos.length}
            </span>
          ) : undefined
        }
      />

      <ul className="space-y-1.5">
        {todos.map((t) => (
          <TodoRow key={t.id} todo={t} carried={t.date !== null && t.date < date} />
        ))}
      </ul>

      <form onSubmit={submit} className="mt-2 flex items-center gap-2">
        <span className="pl-1 text-lg text-slate-300 dark:text-slate-600" aria-hidden>
          +
        </span>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a todo…"
          aria-label="Add a todo"
          className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </form>
    </Card>
  );
}

function TodoRow({ todo, carried }: { todo: Todo; carried: boolean }) {
  const toggleTodo = useStore((s) => s.toggleTodo);
  const deleteTodo = useStore((s) => s.deleteTodo);
  const setTodoCarryOver = useStore((s) => s.setTodoCarryOver);

  return (
    <li className="group flex items-center gap-3 rounded-lg px-1 py-1.5">
      <button
        onClick={() => toggleTodo(todo.id)}
        aria-pressed={todo.done}
        aria-label={todo.done ? "Mark not done" : "Mark done"}
        className="-m-2.5 flex h-11 w-11 shrink-0 items-center justify-center p-2.5"
      >
        <span
          className={cx(
            "flex h-6 w-6 items-center justify-center rounded-md border-2 text-xs transition-colors",
            todo.done
              ? "border-accent-500 bg-accent-500 text-white"
              : "border-slate-300 text-transparent hover:border-accent-400 dark:border-slate-600",
          )}
        >
          ✓
        </span>
      </button>

      <span
        className={cx(
          "flex-1 text-sm",
          todo.done && "text-slate-400 line-through dark:text-slate-600",
        )}
      >
        {todo.title}
        {carried && (
          <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
            carried
          </span>
        )}
      </span>

      <button
        onClick={() => setTodoCarryOver(todo.id, !todo.carryOver)}
        aria-pressed={todo.carryOver}
        aria-label={todo.carryOver ? "Carry-over on" : "Carry-over off"}
        title={todo.carryOver ? "Carries over to next day" : "Does not carry over"}
        className={cx(
          "rounded px-1.5 py-1 text-xs transition-colors",
          todo.carryOver
            ? "text-accent-600 dark:text-accent-400"
            : "text-slate-300 hover:text-slate-500 dark:text-slate-600",
        )}
      >
        ↻
      </button>

      <button
        onClick={() => deleteTodo(todo.id)}
        aria-label="Delete todo"
        className="rounded px-1.5 py-1 text-sm text-slate-300 opacity-0 transition-opacity hover:text-red-500 focus:opacity-100 group-hover:opacity-100 dark:text-slate-600"
      >
        ✕
      </button>
    </li>
  );
}
