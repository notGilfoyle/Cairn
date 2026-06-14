import { db } from "../db";
import type { Settings } from "../types";

export const DEFAULT_SETTINGS: Settings = {
  key: "settings",
  theme: "light",
  accent: "indigo",
  weekStart: "monday",
  amPrompt: "What matters most today?",
  pmPrompt: "What went well, and what did you learn?",
  amPromptEnabled: true,
  pmPromptEnabled: true,
  showedUpThreshold: 1,
};

export const settingsRepo = {
  async get(): Promise<Settings> {
    const s = await db.settings.get("settings");
    return s ?? DEFAULT_SETTINGS;
  },

  async save(settings: Settings): Promise<Settings> {
    const next = { ...settings, key: "settings" as const };
    await db.settings.put(next);
    return next;
  },

  async patch(patch: Partial<Omit<Settings, "key">>): Promise<Settings> {
    const current = await this.get();
    const next = { ...current, ...patch, key: "settings" as const };
    await db.settings.put(next);
    return next;
  },
};
