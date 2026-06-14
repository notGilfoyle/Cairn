import type { SessionEntry, Tracker, WeekStart } from "../../data/types";
import { weeklyVolume } from "../../lib/workouts";

type Metric = "sessions" | "durationMin" | "distanceKm";

/**
 * Hand-rolled SVG weekly-volume bars for a session tracker (PRD §6.4). Bars show
 * the chosen metric per week over the last `weeks` weeks.
 */
export function SessionVolumeChart({
  tracker,
  entries,
  today,
  weekStart,
  weeks = 8,
  metric = "sessions",
}: {
  tracker: Tracker;
  entries: SessionEntry[];
  today: string;
  weekStart: WeekStart;
  weeks?: number;
  metric?: Metric;
}) {
  const mine = entries.filter((e) => e.trackerId === tracker.id);
  const vol = weeklyVolume(mine, today, weekStart, weeks);
  const values = vol.map((v) => v[metric]);
  const max = Math.max(...values, 1);

  if (values.every((v) => v === 0)) {
    return <p className="py-6 text-center text-sm text-slate-400">No sessions in this range.</p>;
  }

  const W = 320;
  const H = 120;
  const padY = 14;
  const gap = 6;
  const barW = (W - gap * (weeks - 1)) / weeks;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full">
        {vol.map((v, i) => {
          const value = v[metric];
          const h = (value / max) * (H - 2 * padY);
          const xx = i * (barW + gap);
          const yy = H - padY - h;
          return (
            <g key={v.weekStart}>
              <rect x={xx} y={yy} width={barW} height={Math.max(h, value > 0 ? 2 : 0)} rx={3} fill={tracker.color} opacity={0.85} />
              {value > 0 && (
                <text x={xx + barW / 2} y={yy - 3} textAnchor="middle" className="fill-slate-400" fontSize="9">
                  {Math.round(value)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-slate-400">
        <span>{weeks} weeks ago</span>
        <span className="capitalize">{metric === "durationMin" ? "minutes" : metric === "distanceKm" ? "km" : "sessions"} / week</span>
        <span>this week</span>
      </div>
    </div>
  );
}
