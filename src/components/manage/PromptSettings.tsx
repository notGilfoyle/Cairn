import { useStore } from "../../store/useStore";
import { Card, CardHeader } from "../ui/Card";
import { Toggle } from "../ui/Toggle";

/** Edit AM/PM journal prompts and toggle them on/off (PRD §10.3). */
export function PromptSettings() {
  const settings = useStore((s) => s.settings);
  const patchSettings = useStore((s) => s.patchSettings);

  return (
    <Card>
      <CardHeader title="Journal prompts" subtitle="Shown on Today; edit or turn off" />

      <div className="space-y-4">
        <PromptRow
          label="Morning prompt"
          enabled={settings.amPromptEnabled}
          value={settings.amPrompt}
          onToggle={(v) => patchSettings({ amPromptEnabled: v })}
          onChange={(v) => patchSettings({ amPrompt: v })}
        />
        <PromptRow
          label="Evening prompt"
          enabled={settings.pmPromptEnabled}
          value={settings.pmPrompt}
          onToggle={(v) => patchSettings({ pmPromptEnabled: v })}
          onChange={(v) => patchSettings({ pmPrompt: v })}
        />
      </div>
    </Card>
  );
}

function PromptRow({
  label,
  enabled,
  value,
  onToggle,
  onChange,
}: {
  label: string;
  enabled: boolean;
  value: string;
  onToggle: (v: boolean) => void;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>
        <Toggle checked={enabled} onChange={onToggle} label={label} />
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={!enabled}
        className="h-10 w-full rounded-lg border border-slate-200 bg-transparent px-3 text-sm disabled:opacity-50 dark:border-slate-700"
      />
    </div>
  );
}
