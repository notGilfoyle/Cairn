import { db } from "../db";
import type { Todo, DateStr } from "../types";
import { newId } from "../../lib/id";

export const todosRepo = {
  async all(): Promise<Todo[]> {
    return db.todos.toArray();
  },

  async get(id: string): Promise<Todo | undefined> {
    return db.todos.get(id);
  },

  /** Items explicitly dated to `date`. */
  async forDate(date: DateStr): Promise<Todo[]> {
    return db.todos.where("date").equals(date).toArray();
  },

  /** Undated items (backlog). */
  async backlog(): Promise<Todo[]> {
    return (await db.todos.toArray()).filter((t) => t.date === null);
  },

  /**
   * Undone, carry-over-enabled items dated strictly before `date`. These surface
   * on Today without mutating their stored date, so history stays intact.
   */
  async carriedInto(date: DateStr): Promise<Todo[]> {
    return (await db.todos.toArray()).filter(
      (t) => !t.done && t.carryOver && t.date !== null && t.date < date,
    );
  },

  async create(input: Partial<Todo> & Pick<Todo, "title">): Promise<Todo> {
    const todo: Todo = {
      id: input.id ?? newId(),
      title: input.title,
      date: input.date ?? null,
      done: input.done ?? false,
      carryOver: input.carryOver ?? true,
      tags: input.tags ?? [],
      createdAt: input.createdAt ?? new Date().toISOString(),
      completedAt: input.completedAt ?? null,
    };
    await db.todos.put(todo);
    return todo;
  },

  async update(id: string, patch: Partial<Omit<Todo, "id">>): Promise<Todo | undefined> {
    const current = await db.todos.get(id);
    if (!current) return undefined;
    const next = { ...current, ...patch, id };
    await db.todos.put(next);
    return next;
  },

  async setDone(id: string, done: boolean): Promise<Todo | undefined> {
    return this.update(id, { done, completedAt: done ? new Date().toISOString() : null });
  },

  async remove(id: string): Promise<void> {
    await db.todos.delete(id);
  },

  async clear(): Promise<void> {
    await db.todos.clear();
  },
};
