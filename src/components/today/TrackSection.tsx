import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore, activeTrackers } from "../../store/useStore";
import { Card, CardHeader } from "../ui/Card";
import { Modal } from "../ui/Modal";
import { QuickLog } from "../trackers/QuickLog";
import { cx } from "../ui/cx";

/**
 * Collapsible "Track" section on Today for fast logging (PRD §6.3). Tapping a
 * tracker opens QuickLog already focused on that tracker — one tap to the form.
 */
export function TrackSection() {
  const trackers = useStore(useShallow(activeTrackers));
  const [open, setOpen] = useState(true);
  const [logging, setLogging] = useState<string | null>(null);

  if (trackers.length === 0) return null;

  return (
    <Card>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between"
        aria-expanded={open}
      >
        <CardHeader title="Track" subtitle="Tap to log" />
        <span className={cx("text-slate-400 transition-transform", open && "rotate-90")}>›</span>
      </button>

      {open && (
        <div className="flex flex-wrap gap-2">
          {trackers.map((t) => (
            <button
              key={t.id}
              onClick={() => setLogging(t.id)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
            >
              <span className="text-lg">{t.emoji}</span>
              {t.name}
            </button>
          ))}
        </div>
      )}

      <Modal open={!!logging} onClose={() => setLogging(null)} title="Quick log">
        {logging && <QuickLog trackerId={logging} onClose={() => setLogging(null)} />}
      </Modal>
    </Card>
  );
}
