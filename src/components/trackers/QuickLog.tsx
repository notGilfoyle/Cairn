import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore, activeTrackers } from "../../store/useStore";
import type { Tracker } from "../../data/types";
import { Button } from "../ui/Button";
import { today as todayStr } from "../../lib/dates";
import { cx } from "../ui/cx";

/**
 * Fast logging (PRD §6.3). With a preselected tracker the form opens directly
 * (≤2 taps + a number); otherwise the user picks a tracker first.
 */
export function QuickLog({
  trackerId,
  onClose,
}: {
  trackerId?: string;
  onClose: () => void;
}) {
  const trackers = useStore(useShallow(activeTrackers));
  const [picked, setPicked] = useState<string | null>(trackerId ?? null);
  const [flashing, setFlashing] = useState(false);

  const tracker = useMemo(() => trackers.find((t) => t.id === picked), [trackers, picked]);

  // Brief success confirmation before closing (respects reduced-motion via the
  // global CSS rule that neutralizes animations).
  function handleLogged() {
    setFlashing(true);
    setTimeout(onClose, 650);
  }

  if (flashing) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-100 text-3xl text-accent-600 motion-safe:animate-pop-check dark:bg-accent-950/60 dark:text-accent-400">
          ✓
        </span>
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Logged</span>
      </div>
    );
  }

  if (!tracker) {
    return (
      <div className="space-y-2">
        {trackers.length === 0 && (
          <p className="text-sm text-slate-400">Create a tracker first.</p>
        )}
        {trackers.map((t) => (
          <button
            key={t.id}
            onClick={() => setPicked(t.id)}
            className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
          >
            <span className="text-xl">{t.emoji}</span>
            <span className="flex-1 font-medium">{t.name}</span>
            <span className="text-xs text-slate-400 capitalize">{t.type}</span>
          </button>
        ))}
      </div>
    );
  }

  return tracker.type === "quantity" ? (
    <QuantityForm tracker={tracker} onDone={handleLogged} />
  ) : (
    <SessionForm tracker={tracker} onDone={handleLogged} />
  );
}

function QuantityForm({ tracker, onDone }: { tracker: Tracker; onDone: () => void }) {
  const addQuantityEntry = useStore((s) => s.addQuantityEntry);
  const [amount, setAmount] = useState("");
  const [sign, setSign] = useState<1 | -1>(-1); // ledger default = spend
  const [date, setDate] = useState(todayStr());
  const [tag, setTag] = useState("");
  const [note, setNote] = useState("");

  async function save() {
    const n = Number(amount);
    if (!amount.trim() || Number.isNaN(n)) return;
    const value = tracker.allowsNegative ? Math.abs(n) * sign : n;
    await addQuantityEntry({
      trackerId: tracker.id,
      date,
      amount: value,
      tags: tag.trim() ? [tag.trim()] : [],
      note: note.trim() || null,
    });
    onDone();
  }

  return (
    <div className="space-y-4">
      <Header tracker={tracker} />

      {tracker.allowsNegative && (
        <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <SignButton active={sign === -1} onClick={() => setSign(-1)} tone="red">
            Spend −
          </SignButton>
          <SignButton active={sign === 1} onClick={() => setSign(1)} tone="green">
            Income +
          </SignButton>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          placeholder="0"
          autoFocus
          className="h-16 w-full rounded-xl border border-slate-200 bg-transparent px-4 text-3xl font-bold tabular-nums outline-none focus:border-accent-500 dark:border-slate-700"
        />
        {tracker.unit && <span className="text-xl text-slate-400">{tracker.unit}</span>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Labeled label="Date">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 w-full rounded-lg border border-slate-200 bg-transparent px-3 dark:border-slate-700"
          />
        </Labeled>
        <Labeled label={tracker.allowsNegative ? "Category" : "Tag"}>
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder={tracker.allowsNegative ? "food, rent…" : "optional"}
            className="h-11 w-full rounded-lg border border-slate-200 bg-transparent px-3 dark:border-slate-700"
          />
        </Labeled>
      </div>

      <Labeled label="Note">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="optional"
          className="h-11 w-full rounded-lg border border-slate-200 bg-transparent px-3 dark:border-slate-700"
        />
      </Labeled>

      <Button variant="primary" onClick={save} className="w-full">
        Log
      </Button>
    </div>
  );
}

function SessionForm({ tracker, onDone }: { tracker: Tracker; onDone: () => void }) {
  const addSessionEntry = useStore((s) => s.addSessionEntry);
  const [sessionType, setSessionType] = useState(tracker.sessionTypes[0] ?? "Session");
  const [date, setDate] = useState(todayStr());
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [reps, setReps] = useState("");
  const [intensity, setIntensity] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s));

  async function save() {
    await addSessionEntry({
      trackerId: tracker.id,
      date,
      sessionType,
      durationMin: numOrNull(duration),
      distanceKm: numOrNull(distance),
      reps: numOrNull(reps),
      intensity: intensity as 1 | 2 | 3 | 4 | 5 | null,
      note: note.trim() || null,
    });
    onDone();
  }

  return (
    <div className="space-y-4">
      <Header tracker={tracker} />

      <Labeled label="Activity">
        <div className="flex flex-wrap gap-1.5">
          {tracker.sessionTypes.map((t) => (
            <button
              key={t}
              onClick={() => setSessionType(t)}
              className={cx(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                sessionType === t
                  ? "bg-accent-600 text-white"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </Labeled>

      <div className="grid grid-cols-3 gap-2">
        <Labeled label="Duration (min)">
          <NumInput value={duration} onChange={setDuration} />
        </Labeled>
        <Labeled label="Distance (km)">
          <NumInput value={distance} onChange={setDistance} />
        </Labeled>
        <Labeled label="Reps">
          <NumInput value={reps} onChange={setReps} />
        </Labeled>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Labeled label="Date">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 w-full rounded-lg border border-slate-200 bg-transparent px-3 dark:border-slate-700"
          />
        </Labeled>
        <Labeled label="Intensity (RPE)">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setIntensity(intensity === n ? null : n)}
                className={cx(
                  "h-11 flex-1 rounded-lg text-sm font-semibold",
                  intensity === n
                    ? "bg-accent-600 text-white"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </Labeled>
      </div>

      <Labeled label="Note">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="optional"
          className="h-11 w-full rounded-lg border border-slate-200 bg-transparent px-3 dark:border-slate-700"
        />
      </Labeled>

      <Button variant="primary" onClick={save} className="w-full">
        Log session
      </Button>
    </div>
  );
}

function Header({ tracker }: { tracker: Tracker }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl">{tracker.emoji}</span>
      <span className="font-semibold">{tracker.name}</span>
    </div>
  );
}

function NumInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="number"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="—"
      className="h-11 w-full rounded-lg border border-slate-200 bg-transparent px-2 text-center tabular-nums dark:border-slate-700"
    />
  );
}

function SignButton({
  active,
  onClick,
  tone,
  children,
}: {
  active: boolean;
  onClick: () => void;
  tone: "red" | "green";
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "flex-1 rounded-lg py-2 text-sm font-semibold transition-colors",
        active
          ? tone === "red"
            ? "bg-white text-red-600 shadow-sm dark:bg-slate-700 dark:text-red-400"
            : "bg-white text-emerald-600 shadow-sm dark:bg-slate-700 dark:text-emerald-400"
          : "text-slate-500",
      )}
    >
      {children}
    </button>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </label>
      {children}
    </div>
  );
}
