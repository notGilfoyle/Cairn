import { cx } from "./cx";

const COMMON = [
  "✅", "🏃", "📚", "🧘", "💻", "💪", "🥗", "💧", "😴", "🧹",
  "✍️", "🎯", "🎸", "🎨", "🌱", "☀️", "🌙", "🚭", "💊", "🙏",
  "📵", "🧠", "💰", "🏊", "🚴", "🧺", "🍳", "📝", "🎓", "❤️",
];

/** A compact emoji chooser: preset grid plus a free-text fallback. */
export function EmojiPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (emoji: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1">
        {COMMON.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onChange(e)}
            className={cx(
              "flex h-9 w-9 items-center justify-center rounded-lg text-xl transition-colors",
              value === e ? "bg-accent-100 ring-2 ring-accent-500 dark:bg-accent-950/60" : "hover:bg-slate-100 dark:hover:bg-slate-800",
            )}
          >
            {e}
          </button>
        ))}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 2))}
        aria-label="Custom emoji"
        placeholder="or type one"
        className="h-9 w-28 rounded-lg border border-slate-200 bg-transparent px-2 text-center text-lg dark:border-slate-700"
      />
    </div>
  );
}
