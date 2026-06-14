import { db } from "../db";
import { SCHEMA_VERSION, type Meta } from "../types";

export const APP_VERSION = "0.1.0";

function defaultMeta(): Meta {
  return {
    key: "meta",
    schemaVersion: SCHEMA_VERSION,
    appVersion: APP_VERSION,
    createdAt: new Date().toISOString(),
    seededDefaults: false,
  };
}

export const metaRepo = {
  async get(): Promise<Meta> {
    const m = await db.meta.get("meta");
    return m ?? defaultMeta();
  },

  /** Ensure a meta row exists; returns it. */
  async ensure(): Promise<Meta> {
    const existing = await db.meta.get("meta");
    if (existing) return existing;
    const m = defaultMeta();
    await db.meta.put(m);
    return m;
  },

  async patch(patch: Partial<Omit<Meta, "key">>): Promise<Meta> {
    const current = await this.ensure();
    const next = { ...current, ...patch, key: "meta" as const };
    await db.meta.put(next);
    return next;
  },
};
