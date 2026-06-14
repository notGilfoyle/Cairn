import { useRef, useState } from "react";
import { useStore } from "../../store/useStore";
import { Card, CardHeader } from "../ui/Card";
import { Button } from "../ui/Button";
import { exportJSON, exportCSVs, downloadText } from "../../data/export";
import { importHabitsCSV, importFullJSON } from "../../data/import";

export function DataExportImport() {
  const reloadHabits = useStore((s) => s.reloadHabits);
  const reloadTodos = useStore((s) => s.reloadTodos);
  const [csvText, setCsvText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const restoreInput = useRef<HTMLInputElement>(null);

  async function doExportJSON() {
    const json = await exportJSON();
    downloadText(`cairn-backup-${Date.now()}.json`, json);
    setStatus("Exported full backup (JSON).");
  }

  async function doExportCSVs() {
    const files = await exportCSVs();
    for (const [name, text] of Object.entries(files)) {
      downloadText(name, text, "text/csv");
    }
    setStatus("Exported per-entity CSVs.");
  }

  async function doImportHabits() {
    if (!csvText.trim()) return;
    const { created } = await importHabitsCSV(csvText);
    await Promise.all([reloadHabits(), reloadTodos()]);
    setCsvText("");
    setStatus(`Imported ${created} habit${created === 1 ? "" : "s"}.`);
  }

  async function onRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = window.confirm(
      "Restoring will REPLACE all current data with the backup. Continue?",
    );
    if (!ok) {
      e.target.value = "";
      return;
    }
    try {
      const text = await file.text();
      await importFullJSON(text);
      // Reload so the whole app (settings, theme, accent) re-hydrates cleanly.
      location.reload();
    } catch (err) {
      setStatus(`Restore failed: ${(err as Error).message}`);
      e.target.value = "";
    }
  }

  return (
    <Card>
      <CardHeader title="Data" subtitle="Your data stays on this device" />

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">Export</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={doExportJSON}>
              Export JSON
            </Button>
            <Button size="sm" variant="secondary" onClick={doExportCSVs}>
              Export CSVs
            </Button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            Import habits (CSV)
          </p>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={3}
            placeholder={"name,emoji,color,cadence,tags\nDrink water,💧,#3b82f6,daily,health\nGym,💪,#ef4444,Mon|Wed|Fri,fitness"}
            className="w-full rounded-lg border border-slate-200 bg-transparent p-2 font-mono text-xs dark:border-slate-700"
          />
          <Button size="sm" variant="secondary" onClick={doImportHabits} className="mt-2">
            Import habits
          </Button>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            Restore full backup (JSON)
          </p>
          <input
            ref={restoreInput}
            type="file"
            accept="application/json,.json"
            onChange={onRestoreFile}
            className="block text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium dark:file:bg-slate-800 dark:file:text-slate-200"
          />
        </div>

        {status && <p className="text-sm text-accent-600 dark:text-accent-400">{status}</p>}
      </div>
    </Card>
  );
}
