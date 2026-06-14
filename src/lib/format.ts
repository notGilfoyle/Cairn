import type { Tracker } from "../data/types";

/** Trim trailing zeros from a number for compact display (2.50 → "2.5"). */
export function trimNum(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const rounded = Math.round(n * 100) / 100;
  return String(rounded);
}

/**
 * Format a quantity value with its unit. Currency-style units (₹, $, €, £) are
 * prefixed and sign-aware; other units (kg, ml, hrs, km) are suffixed.
 */
export function formatQuantity(value: number, unit: string | null): string {
  const u = (unit ?? "").trim();
  const isCurrency = /^[₹$€£¥]/.test(u);
  if (isCurrency) {
    const sign = value < 0 ? "-" : "";
    return `${sign}${u}${trimNum(Math.abs(value))}`;
  }
  return u ? `${trimNum(value)} ${u}` : trimNum(value);
}

/** Short label for a tracker's aggregation, for captions. */
export function aggregationLabel(t: Tracker): string {
  switch (t.aggregation) {
    case "sum":
      return "Total";
    case "average":
      return "Average";
    case "latest":
      return "Latest";
    case "count":
      return "Count";
    default:
      return "";
  }
}
