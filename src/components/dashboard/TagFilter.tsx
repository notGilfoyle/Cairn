import { cx } from "../ui/cx";

export function TagFilter({
  tags,
  selected,
  onSelect,
}: {
  tags: string[];
  selected: string | null;
  onSelect: (tag: string | null) => void;
}) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip active={selected === null} onClick={() => onSelect(null)}>
        All
      </Chip>
      {tags.map((t) => (
        <Chip key={t} active={selected === t} onClick={() => onSelect(t)}>
          #{t}
        </Chip>
      ))}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "rounded-full px-3 py-1 text-sm font-medium transition-colors",
        active
          ? "bg-accent-600 text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
      )}
    >
      {children}
    </button>
  );
}
