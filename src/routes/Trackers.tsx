import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore, activeTrackers } from "../store/useStore";
import type { Tracker } from "../data/types";
import type { TrackerInput } from "../data/repositories";
import { useTrackerEntries } from "../components/trackers/useTrackerEntries";
import { TrackerCard } from "../components/trackers/TrackerCard";
import { TrackerDetail } from "../components/trackers/TrackerDetail";
import { PresetPicker } from "../components/trackers/PresetPicker";
import { TrackerBuilder } from "../components/trackers/TrackerBuilder";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Card } from "../components/ui/Card";

export default function Trackers() {
  const trackers = useStore(useShallow(activeTrackers));
  const weekStart = useStore((s) => s.settings.weekStart);
  const entriesVersion = useStore((s) => s.entriesVersion);
  const createTracker = useStore((s) => s.createTracker);
  const updateTracker = useStore((s) => s.updateTracker);
  const archiveTracker = useStore((s) => s.archiveTracker);
  const deleteTracker = useStore((s) => s.deleteTracker);

  const { quantity, session } = useTrackerEntries(entriesVersion);

  const [picking, setPicking] = useState(false);
  const [building, setBuilding] = useState<TrackerInput | null>(null);
  const [editing, setEditing] = useState<Tracker | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const detailTracker = detailId ? trackers.find((t) => t.id === detailId) : undefined;

  // Detail is a sub-view of the Trackers tab (no separate route needed).
  if (detailTracker) {
    return (
      <>
        <TrackerDetail
          tracker={detailTracker}
          quantity={quantity}
          session={session}
          onBack={() => setDetailId(null)}
          onEdit={() => setEditing(detailTracker)}
        />
        <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit tracker">
          {editing && (
            <TrackerBuilder
              initial={toInput(editing)}
              editing={editing}
              onSave={(input) => updateTracker(editing.id, input)}
              onArchive={(archived) => archiveTracker(editing.id, archived)}
              onDelete={() => {
                void deleteTracker(editing.id);
                setDetailId(null);
              }}
              onClose={() => setEditing(null)}
            />
          )}
        </Modal>
      </>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trackers</h1>
          <p className="text-slate-500 dark:text-slate-400">Quantities &amp; sessions</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setPicking(true)}>
          ＋ New
        </Button>
      </header>

      {trackers.length === 0 ? (
        <Card>
          <p className="text-slate-500 dark:text-slate-400">
            No trackers yet. Create one to start logging finance, weight, water, study hours, or
            workouts.
          </p>
          <Button variant="primary" className="mt-3" onClick={() => setPicking(true)}>
            ＋ New tracker
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {trackers.map((t) => (
            <TrackerCard
              key={t.id}
              tracker={t}
              quantity={quantity}
              session={session}
              weekStart={weekStart}
              onClick={() => setDetailId(t.id)}
            />
          ))}
        </div>
      )}

      {/* Step 1: choose preset or blank */}
      <Modal open={picking} onClose={() => setPicking(false)} title="New tracker">
        <PresetPicker
          onPick={(config) => {
            setPicking(false);
            setBuilding(config);
          }}
        />
      </Modal>

      {/* Step 2: configure & create */}
      <Modal open={!!building} onClose={() => setBuilding(null)} title="Configure tracker">
        {building && (
          <TrackerBuilder
            initial={building}
            onSave={(input) => createTracker(input)}
            onClose={() => setBuilding(null)}
          />
        )}
      </Modal>

      {/* Edit existing */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit tracker">
        {editing && (
          <TrackerBuilder
            initial={toInput(editing)}
            editing={editing}
            onSave={(input) => updateTracker(editing.id, input)}
            onArchive={(archived) => archiveTracker(editing.id, archived)}
            onDelete={() => deleteTracker(editing.id)}
            onClose={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function toInput(t: Tracker): TrackerInput {
  return {
    name: t.name,
    type: t.type,
    emoji: t.emoji,
    color: t.color,
    tags: t.tags,
    presetKey: t.presetKey,
    unit: t.unit,
    aggregation: t.aggregation,
    allowsNegative: t.allowsNegative,
    direction: t.direction,
    goal: t.goal,
    sessionTypes: t.sessionTypes,
  };
}
