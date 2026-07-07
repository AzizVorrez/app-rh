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

/** Score → hex color for charts and inline styles (IZICHANGE palette). */
export function scoreHex(score: number | null | undefined): string {
  if (score == null) return "#94a3b8"; // slate-400
  if (score >= 4) return "#008080"; // brand teal
  if (score >= 3) return "#d97706"; // amber-600
  return "#dc3e4d"; // brand red
}

/** Score → tailwind text color class. */
export function scoreClass(score: number | null | undefined): string {
  if (score == null) return "text-slate-400";
  if (score >= 4) return "text-brand-600";
  if (score >= 3) return "text-amber-600";
  return "text-danger-500";
}

export function npsHex(nps: number | null | undefined): string {
  if (nps == null) return "#94a3b8";
  if (nps >= 30) return "#008080";
  if (nps >= 0) return "#d97706";
  return "#dc3e4d";
}

export function formatDateFR(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function plural(n: number, singular: string, pluralForm?: string): string {
  return n > 1 ? (pluralForm ?? singular + "s") : singular;
}

/** Canonicalise a matricule for comparison (trim, uppercase, strip inner spaces). */
export function normalizeMatricule(s: string): string {
  return s.trim().toUpperCase().replace(/\s+/g, "");
}

export function normalizeEmail(s: string): string {
  return s.trim().toLowerCase();
}

// Source unique de vérité pour la validation email (client + routes check/submit).
// Stricte : ASCII uniquement, pas de points consécutifs ni en bordure, TLD ≥ 2 lettres.
const EMAIL_RE =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

export function isValidEmail(s: string): boolean {
  const v = s.trim();
  return v.length <= 254 && EMAIL_RE.test(v);
}
