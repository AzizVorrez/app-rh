/**
 * Psychotechnic recruitment test — "Programme Jeune Talent 2026".
 * 32 questions across 3 blocks. Block 3 is domain-specific.
 *
 * Types & métadonnées partagés client/serveur (SANS bonnes réponses).
 * La banque de questions (avec réponses `c`/`e`) et le scoring autoritaire
 * vivent dans `recruitment-bank.ts` (server-only) pour ne pas fuiter côté client.
 */

export type Domain = "ops" | "com" | "cyber" | "dev";

/** Question complète (avec bonne réponse `c` + explication `e`) — usage serveur uniquement. */
export interface TQ {
  s: string; // section label
  t: string; // question text
  o: string[]; // options
  c: number; // correct index
  e: string; // explanation
  sec: number; // seconds allowed
}

/** Question telle qu'exposée au client : sans `c` (bonne réponse) ni `e` (explication). */
export interface PublicTQ {
  s: string;
  t: string;
  o: string[];
  sec: number;
}

export const DOMAIN_LABELS: Record<Domain, string> = {
  ops: "Opérations",
  com: "Communication",
  cyber: "IT — Cybersécurité",
  dev: "IT — Développement",
};

export const DOMAIN_OPTIONS: { id: Domain; label: string; sub: string }[] = [
  { id: "ops", label: "Opérations", sub: "Customer Support Officer" },
  { id: "com", label: "Communication & Marketing", sub: "Graphiste · CRM · Social Media" },
  { id: "cyber", label: "Technologie — Cybersécurité", sub: "Analyste Cybersécurité" },
  { id: "dev", label: "Technologie — Développement", sub: "Architecture Logiciel · Développeur" },
];

export const BLOCK_LABELS = [
  "Bloc 1 — Raisonnement logique",
  "Bloc 2 — Personnalité & comportement",
  "Bloc 3 — Aptitudes métier",
];

export interface TestDurations {
  block1: number; // secondes par question — Bloc 1
  block23: number; // secondes par question — Blocs 2 & 3
}

export function statusFor(total: number, max: number): string {
  const pct = Math.round((total / max) * 100);
  return pct >= 70 ? "Admis" : pct >= 60 ? "Réserve" : "Non retenu";
}

export interface TestScore {
  block1: number;
  block2: number;
  block3: number;
  total: number;
  max: number;
  status: string;
  pct: number;
}

export function isDomain(v: unknown): v is Domain {
  return v === "ops" || v === "com" || v === "cyber" || v === "dev";
}
