import { useState } from "react";
import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import { MoodPicker } from "./MoodPicker";
import { useDebouncedCallback } from "../../lib/useDebouncedCallback";
import { cx } from "../ui/cx";

/**
 * Morning or Evening journal entry for the current day (PRD §10.1). Text
 * autosaves debounced; mood persists immediately. The optional prompt comes
 * from settings and can be dismissed for this session (editing lives in Manage).
 */
export function JournalCard({ slot }: { slot: "am" | "pm" }) {
  const day = useStore((s) => s.day);
  const settings = useStore((s) => s.settings);
  const saveJournal = useStore((s) => s.saveJournal);
  const setMood = useStore((s) => s.setMood);

  const entry = slot === "am" ? day.amJournal : day.pmJournal;
  const promptText = slot === "am" ? settings.amPrompt : settings.pmPrompt;
  const promptEnabled = slot === "am" ? settings.amPromptEnabled : settings.pmPromptEnabled;

  // Local text state is the source of truth while mounted (avoids cursor jumps);
  // seeded once from the loaded day. Keyed by date in the parent so it resets
  // when the day changes.
  const [text, setText] = useState(entry?.text ?? "");
  const [dismissedPrompt, setDismissedPrompt] = useState(false);
  const [saved, setSaved] = useState(true);

  const debouncedSave = useDebouncedCallback((t: string) => {
    void saveJournal(slot, t).then(() => setSaved(true));
  }, 400);

  function onChange(t: string) {
    setText(t);
    setSaved(false);
    debouncedSave(t);
  }

  const title = slot === "am" ? "Morning" : "Evening";
  const icon = slot === "am" ? "☀️" : "🌙";
  const showPrompt = promptEnabled && !dismissedPrompt && text.trim().length === 0;

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <span aria-hidden>{icon}</span>
          {title}
        </h2>
        <span
          className={cx(
            "text-xs transition-opacity",
            saved ? "text-slate-300 dark:text-slate-600" : "text-accent-500",
          )}
        >
          {saved ? "Saved" : "Saving…"}
        </span>
      </div>

      {showPrompt && (
        <div className="mb-2 flex items-start justify-between gap-2 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-800 dark:bg-accent-950/40 dark:text-accent-200">
          <span>{promptText}</span>
          <button
            onClick={() => setDismissedPrompt(true)}
            aria-label="Dismiss prompt"
            className="shrink-0 text-accent-400 hover:text-accent-600"
          >
            ✕
          </button>
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => debouncedSave.flush()}
        placeholder={slot === "am" ? "How are you starting the day?" : "How did today go?"}
        rows={3}
        aria-label={`${title} journal`}
        className="w-full resize-y rounded-lg bg-transparent text-sm leading-relaxed outline-none placeholder:text-slate-400"
      />

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
        <span className="text-xs uppercase tracking-wide text-slate-400">Mood</span>
        <MoodPicker value={entry?.mood ?? null} onChange={(m) => setMood(slot, m)} />
      </div>
    </Card>
  );
}
