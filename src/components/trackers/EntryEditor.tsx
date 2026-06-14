import { useState } from "react";
import { useStore } from "../../store/useStore";
import type { Tracker, QuantityEntry, SessionEntry } from "../../data/types";
import { Button } from "../ui/Button";
import { cx } from "../ui/cx";

/** Edit or delete an existing quantity/session entry from the detail view. */
export function EntryEditor({
  tracker,
  quantity,
  session,
  onClose,
}: {
  tracker: Tracker;
  quantity?: QuantityEntry;
  session?: SessionEntry;
  onClose: () => void;
}) {
  if (quantity) return <QuantityEdit tracker={tracker} entry={quantity} onClose={onClose} />;
  if (session) return <SessionEdit tracker={tracker} entry={session} onClose={onClose} />;
  return null;
}

function QuantityEdit({
  tracker,
  entry,
  onClose,
}: {
  tracker: Tracker;
  entry: QuantityEntry;
  onClose: () => void;
}) {
  const update = useStore((s) => s.updateQuantityEntry);
  const del = useStore((s) => s.deleteQuantityEntry);
  const [amount, setAmount] = useState(String(entry.amount));
  const [date, setDate] = useState(entry.date);
  const [tag, setTag] = useState(entry.tags[0] ?? "");
  const [note, setNote] = useState(entry.note ?? "");

  async function save() {
    const n = Number(amount);
    if (Number.isNaN(n)) return;
    const value = tracker.allowsNegative ? n : Math.abs(n);
    await update(entry.id, {
      amount: value,
      date,
      tags: tag.trim() ? [tag.trim()] : [],
      note: note.trim() || null,
    });
    onClose();
  }

  return (
    <div className="space-y-3">
      <Field label={`Amount${tracker.unit ? ` (${tracker.unit})` : ""}`}>
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-11 w-full rounded-lg border border-slate-200 bg-transparent px-3 dark:border-slate-700"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-transparent px-3 dark:border-slate-700" />
        </Field>
        <Field label={tracker.allowsNegative ? "Category" : "Tag"}>
          <input value={tag} onChange={(e) => setTag(e.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-transparent px-3 dark:border-slate-700" />
        </Field>
      </div>
      <Field label="Note">
        <input value={note} onChange={(e) => setNote(e.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-transparent px-3 dark:border-slate-700" />
      </Field>
      <Actions onSave={save} onDelete={() => { void del(entry.id); onClose(); }} />
    </div>
  );
}

function SessionEdit({
  tracker,
  entry,
  onClose,
}: {
  tracker: Tracker;
  entry: SessionEntry;
  onClose: () => void;
}) {
  const update = useStore((s) => s.updateSessionEntry);
  const del = useStore((s) => s.deleteSessionEntry);
  const [sessionType, setSessionType] = useState(entry.sessionType);
  const [date, setDate] = useState(entry.date);
  const [duration, setDuration] = useState(entry.durationMin?.toString() ?? "");
  const [distance, setDistance] = useState(entry.distanceKm?.toString() ?? "");
  const [reps, setReps] = useState(entry.reps?.toString() ?? "");
  const num = (s: string) => (s.trim() === "" ? null : Number(s));

  async function save() {
    await update(entry.id, {
      sessionType,
      date,
      durationMin: num(duration),
      distanceKm: num(distance),
      reps: num(reps),
    });
    onClose();
  }

  return (
    <div className="space-y-3">
      <Field label="Activity">
        <div className="flex flex-wrap gap-1.5">
          {tracker.sessionTypes.map((t) => (
            <button
              key={t}
              onClick={() => setSessionType(t)}
              className={cx(
                "rounded-full px-3 py-1.5 text-sm font-medium",
                sessionType === t ? "bg-accent-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Min"><Num value={duration} onChange={setDuration} /></Field>
        <Field label="km"><Num value={distance} onChange={setDistance} /></Field>
        <Field label="Reps"><Num value={reps} onChange={setReps} /></Field>
      </div>
      <Field label="Date">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-transparent px-3 dark:border-slate-700" />
      </Field>
      <Actions onSave={save} onDelete={() => { void del(entry.id); onClose(); }} />
    </div>
  );
}

function Actions({ onSave, onDelete }: { onSave: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <Button variant="primary" onClick={onSave} className="flex-1">Save</Button>
      <Button variant="danger" onClick={onDelete}>Delete</Button>
    </div>
  );
}

function Num({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input type="number" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} placeholder="—" className="h-11 w-full rounded-lg border border-slate-200 bg-transparent px-2 text-center dark:border-slate-700" />
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">{label}</label>
      {children}
    </div>
  );
}
