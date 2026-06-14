import type { AccentKey } from "../data/types";

/**
 * Accent presets as RGB triplets (Tailwind-friendly). Applying an accent sets
 * the --accent-* CSS variables on :root, which Tailwind's `accent-*` colors read
 * (see tailwind.config.js + styles/index.css). This makes the accent swap a
 * runtime variable change, no rebuild.
 */
type Scale = Record<string, string>;

const PRESETS: Record<AccentKey, { label: string; scale: Scale }> = {
  indigo: {
    label: "Indigo",
    scale: {
      50: "238 242 255",
      100: "224 231 255",
      200: "199 210 254",
      300: "165 180 252",
      400: "129 140 248",
      500: "99 102 241",
      600: "79 70 229",
      700: "67 56 202",
      800: "55 48 163",
      900: "49 46 129",
      950: "30 27 75",
    },
  },
  emerald: {
    label: "Emerald",
    scale: {
      50: "236 253 245",
      100: "209 250 229",
      200: "167 243 208",
      300: "110 231 183",
      400: "52 211 153",
      500: "16 185 129",
      600: "5 150 105",
      700: "4 120 87",
      800: "6 95 70",
      900: "6 78 59",
      950: "2 44 34",
    },
  },
  amber: {
    label: "Amber",
    scale: {
      50: "255 251 235",
      100: "254 243 199",
      200: "253 230 138",
      300: "252 211 77",
      400: "251 191 36",
      500: "245 158 11",
      600: "217 119 6",
      700: "180 83 9",
      800: "146 64 14",
      900: "120 53 15",
      950: "69 26 3",
    },
  },
  teal: {
    label: "Teal",
    scale: {
      50: "240 253 250",
      100: "204 251 241",
      200: "153 246 228",
      300: "94 234 212",
      400: "45 212 191",
      500: "20 184 166",
      600: "13 148 136",
      700: "15 118 110",
      800: "17 94 89",
      900: "19 78 74",
      950: "4 47 46",
    },
  },
};

export const ACCENT_KEYS = Object.keys(PRESETS) as AccentKey[];

export function accentLabel(key: AccentKey): string {
  return PRESETS[key]?.label ?? key;
}

/** Solid CSS color for the 500 shade (useful for inline SVG/styles). */
export function accentColor(key: AccentKey, shade: keyof Scale = "500"): string {
  return `rgb(${PRESETS[key]?.scale[shade] ?? PRESETS.indigo.scale[shade]})`;
}

export function applyAccent(key: AccentKey): void {
  if (typeof document === "undefined") return;
  const scale = PRESETS[key]?.scale ?? PRESETS.indigo.scale;
  const root = document.documentElement;
  for (const [shade, rgb] of Object.entries(scale)) {
    root.style.setProperty(`--accent-${shade}`, rgb);
  }
}
