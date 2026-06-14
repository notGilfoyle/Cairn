import { useStore } from "../../store/useStore";
import { Card, CardHeader } from "../ui/Card";
import { Button } from "../ui/Button";
import { ACCENT_KEYS, accentLabel, accentColor } from "../../lib/accent";
import { cx } from "../ui/cx";
import type { WeekStart } from "../../data/types";

export function AppearanceSettings() {
  const settings = useStore((s) => s.settings);
  const setAccent = useStore((s) => s.setAccent);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const setWeekStart = useStore((s) => s.setWeekStart);
  const patchSettings = useStore((s) => s.patchSettings);

  return (
    <Card>
      <CardHeader title="Appearance" />

      <div className="space-y-4">
        <Row label="Theme">
          <Button variant="secondary" size="sm" onClick={() => toggleTheme()}>
            {settings.theme === "dark" ? "🌙 Dark" : "☀️ Light"}
          </Button>
        </Row>

        <Row label="Accent">
          <div className="flex gap-2">
            {ACCENT_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => setAccent(key)}
                aria-label={accentLabel(key)}
                aria-pressed={settings.accent === key}
                className={cx(
                  "h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-white transition dark:ring-offset-slate-900",
                  settings.accent === key ? "ring-slate-900 dark:ring-white" : "ring-transparent",
                )}
                style={{ backgroundColor: accentColor(key) }}
              />
            ))}
          </div>
        </Row>

        <Row label="Week starts on">
          <div className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
            {(["monday", "sunday"] as WeekStart[]).map((w) => (
              <button
                key={w}
                onClick={() => setWeekStart(w)}
                className={cx(
                  "rounded-md px-3 py-1 text-sm font-medium capitalize transition-colors",
                  settings.weekStart === w
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                    : "text-slate-500",
                )}
              >
                {w}
              </button>
            ))}
          </div>
        </Row>

        <Row label="Currency symbol">
          <input
            value={settings.currency}
            onChange={(e) => patchSettings({ currency: e.target.value.slice(0, 3) })}
            aria-label="Currency symbol"
            className="h-9 w-20 rounded-lg border border-slate-200 bg-transparent px-3 text-center dark:border-slate-700"
          />
        </Row>
      </div>
    </Card>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      {children}
    </div>
  );
}
