import { useState } from "react";
import { useStore } from "../../store/useStore";
import { Modal } from "../ui/Modal";
import { QuickLog } from "./QuickLog";

/**
 * App-wide quick-log entry point: a floating button above the tab bar that
 * opens QuickLog with a tracker picker (PRD §6.3). Hidden when no trackers exist.
 */
export function GlobalLogButton() {
  const hasTrackers = useStore((s) => s.trackers.some((t) => !t.archived));
  const [open, setOpen] = useState(false);

  if (!hasTrackers) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Quick log"
        className="fixed bottom-24 left-1/2 z-30 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-accent-600 text-2xl text-white shadow-lg transition-transform hover:bg-accent-500 active:scale-95"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        ＋
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Quick log">
        <QuickLog onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}
