import type { Day } from "../../data/types";
import { Card, CardHeader } from "../ui/Card";
import { moodSeries } from "../../lib/streaks";
import { lastNDays, prettyDate } from "../../lib/dates";

/**
 * Hand-rolled SVG sparkline of AM/PM mood over the range (PRD §10.2). Null moods
 * are gaps: each series draws polylines only across consecutive present points,
 * and isolated points render as dots.
 */
export function MoodSparkline({
  days,
  today,
  rangeDays,
}: {
  days: Day[];
  today: string;
  rangeDays: number;
}) {
  const dates = lastNDays(today, rangeDays);
  const series = moodSeries(days, dates);

  const W = 320;
  const H = 80;
  const padX = 6;
  const padY = 10;
  const n = dates.length;

  const x = (i: number) => padX + (n === 1 ? 0 : (i * (W - 2 * padX)) / (n - 1));
  // mood 1..5 mapped to bottom..top
  const y = (m: number) => padY + ((5 - m) / 4) * (H - 2 * padY);

  const hasAny = series.some((p) => p.am !== null || p.pm !== null);

  return (
    <Card>
      <CardHeader title="Mood" subtitle={`AM & PM · last ${rangeDays} days`} />
      {!hasAny ? (
        <p className="py-4 text-sm text-slate-400">No mood logged yet.</p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" preserveAspectRatio="none">
          {/* gridlines at mood levels */}
          {[1, 3, 5].map((m) => (
            <line
              key={m}
              x1={padX}
              x2={W - padX}
              y1={y(m)}
              y2={y(m)}
              className="stroke-slate-100 dark:stroke-slate-800"
              strokeWidth={1}
            />
          ))}
          <Line points={series.map((p, i) => ({ x: x(i), m: p.am }))} y={y} className="stroke-accent-500" />
          <Line points={series.map((p, i) => ({ x: x(i), m: p.pm }))} y={y} className="stroke-amber-400" />
        </svg>
      )}
      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent-500" /> Morning
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> Evening
          </span>
        </span>
        <span>
          {prettyDate(dates[0])} → {prettyDate(dates[dates.length - 1])}
        </span>
      </div>
    </Card>
  );
}

/** Draws connected segments between consecutive non-null points; dots for isolated ones. */
function Line({
  points,
  y,
  className,
}: {
  points: { x: number; m: number | null }[];
  y: (m: number) => number;
  className: string;
}) {
  const segments: { x: number; y: number }[][] = [];
  let cur: { x: number; y: number }[] = [];
  for (const p of points) {
    if (p.m === null) {
      if (cur.length) segments.push(cur);
      cur = [];
    } else {
      cur.push({ x: p.x, y: y(p.m) });
    }
  }
  if (cur.length) segments.push(cur);

  return (
    <g>
      {segments.map((seg, i) =>
        seg.length === 1 ? (
          <circle key={i} cx={seg[0].x} cy={seg[0].y} r={2.5} className={className.replace("stroke", "fill")} />
        ) : (
          <polyline
            key={i}
            points={seg.map((s) => `${s.x},${s.y}`).join(" ")}
            fill="none"
            className={className}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ),
      )}
    </g>
  );
}
