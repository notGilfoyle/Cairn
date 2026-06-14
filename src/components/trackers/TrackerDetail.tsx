import { useState } from "react";
import { useStore } from "../../store/useStore";
import type { Tracker, QuantityEntry, SessionEntry } from "../../data/types";
import { Card, CardHeader } from "../ui/Card";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { QuantityChart } from "./QuantityChart";
import { SessionVolumeChart } from "./SessionVolumeChart";
import { GoalProgress } from "./GoalProgress";
import { EntryEditor } from "./EntryEditor";
import { formatQuantity } from "../../lib/format";
import { prettyDate } from "../../lib/dates";
import { cx } from "../ui/cx";

/** Full-screen detail for one tracker: chart, goal, and editable entries (§6.4). */
export function TrackerDetail({
  tracker,
  quantity,
  session,
  onBack,
  onEdit,
}: {
  tracker: Tracker;
  quantity: QuantityEntry[];
  session: SessionEntry[];
  onBack: () => void;
  onEdit: () => void;
}) {
  const today = useStore((s) => s.date);
  const weekStart = useStore((s) => s.settings.weekStart);

  const [editQ, setEditQ] = useState<QuantityEntry | null>(null);
  const [editS, setEditS] = useState<SessionEntry | null>(null);

  const mineQ = quantity
    .filter((e) => e.trackerId === tracker.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const mineS = session
    .filter((e) => e.trackerId === tracker.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const entryCount = tracker.type === "quantity" ? mineQ.length : mineS.length;

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <button onClick={onBack} aria-label="Back" className="rounded-lg px-2 py-1 text-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
          ‹
        </button>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl text-2xl" style={{ backgroundColor: `${tracker.color}22` }}>
          {tracker.emoji}
        </span>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{tracker.name}</h1>
          <p className="text-xs text-slate-400">
            {entryCount} {entryCount === 1 ? "entry" : "entries"}
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={onEdit}>
          Edit
        </Button>
      </header>

      {tracker.type === "quantity" && tracker.goal && (
        <GoalProgress tracker={tracker} entries={quantity} today={today} weekStart={weekStart} />
      )}

      <Card>
        <CardHeader title={tracker.type === "quantity" ? "Over time" : "Weekly volume"} />
        {tracker.type === "quantity" ? (
          <QuantityChart tracker={tracker} entries={quantity} today={today} rangeDays={30} weekStart={weekStart} />
        ) : (
          <SessionVolumeChart tracker={tracker} entries={session} today={today} weekStart={weekStart} />
        )}
      </Card>

      <Card>
        <CardHeader title="Entries" />
        {entryCount === 0 ? (
          <p className="py-2 text-sm text-slate-400">No entries yet. Use ＋ Log to add one.</p>
        ) : tracker.type === "quantity" ? (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {mineQ.map((e) => (
              <li key={e.id}>
                <button onClick={() => setEditQ(e)} className="flex w-full items-center gap-3 py-2.5 text-left">
                  <span className="flex-1">
                    <span className={cx("font-semibold tabular-nums", tracker.allowsNegative && e.amount < 0 && "text-red-500", tracker.allowsNegative && e.amount > 0 && "text-emerald-600 dark:text-emerald-400")}>
                      {formatQuantity(e.amount, tracker.unit)}
                    </span>
                    {e.tags.length > 0 && <span className="ml-2 text-xs text-slate-400">#{e.tags.join(" #")}</span>}
                    {e.note && <span className="ml-2 text-xs text-slate-400">{e.note}</span>}
                  </span>
                  <span className="text-xs text-slate-400">{prettyDate(e.date)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {mineS.map((e) => (
              <li key={e.id}>
                <button onClick={() => setEditS(e)} className="flex w-full items-center gap-3 py-2.5 text-left">
                  <span className="flex-1">
                    <span className="font-semibold">{e.sessionType}</span>
                    <span className="ml-2 text-xs text-slate-400">
                      {[e.durationMin && `${e.durationMin}m`, e.distanceKm && `${e.distanceKm}km`, e.reps && `${e.reps} reps`, e.intensity && `RPE ${e.intensity}`].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className="text-xs text-slate-400">{prettyDate(e.date)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={!!editQ} onClose={() => setEditQ(null)} title="Edit entry">
        {editQ && <EntryEditor tracker={tracker} quantity={editQ} onClose={() => setEditQ(null)} />}
      </Modal>
      <Modal open={!!editS} onClose={() => setEditS(null)} title="Edit session">
        {editS && <EntryEditor tracker={tracker} session={editS} onClose={() => setEditS(null)} />}
      </Modal>
    </div>
  );
}
