import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Average of a numeric list, ignoring null/undefined/NaN. Returns null if empty. */
export function avg(values: (number | null | undefined)[]): number | null {
  const v = values.filter((x): x is number => x != null && !Number.isNaN(x));
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

/** Score → hex color for charts and inline styles (tuned for light UI). */
export function scoreHex(score: number | null | undefined): string {
  if (score == null) return "#94a3b8"; // slate-400
  if (score >= 4) return "#059669"; // emerald-600
  if (score >= 3) return "#d97706"; // amber-600
  return "#e11d48"; // rose-600
}

/** Score → tailwind text color class. */
export function scoreClass(score: number | null | undefined): string {
  if (score == null) return "text-slate-400";
  if (score >= 4) return "text-accent-600";
  if (score >= 3) return "text-amber-600";
  return "text-rose-600";
}

export function npsHex(nps: number | null | undefined): string {
  if (nps == null) return "#94a3b8";
  if (nps >= 30) return "#059669";
  if (nps >= 0) return "#d97706";
  return "#e11d48";
}

export function formatDateFR(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function plural(n: number, singular: string, pluralForm?: string): string {
  return n > 1 ? (pluralForm ?? singular + "s") : singular;
}
