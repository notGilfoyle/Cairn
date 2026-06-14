import { HabitsManager } from "../components/manage/HabitsManager";
import { Backlog } from "../components/manage/Backlog";
import { PromptSettings } from "../components/manage/PromptSettings";
import { AppearanceSettings } from "../components/manage/AppearanceSettings";
import { DataExportImport } from "../components/manage/DataExportImport";

export default function Manage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Manage</h1>
        <p className="text-slate-500 dark:text-slate-400">Habits, settings &amp; data</p>
      </header>

      <HabitsManager />
      <Backlog />
      <PromptSettings />
      <AppearanceSettings />
      <DataExportImport />
    </div>
  );
}
