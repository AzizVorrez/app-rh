/**
 * Psychotechnic recruitment test — "Programme Jeune Talent 2026".
 * 32 questions across 3 blocks. Block 3 is domain-specific.
 *
 * Types & métadonnées partagés client/serveur (SANS bonnes réponses).
 * La banque de questions (avec réponses `c`/`e`) et le scoring autoritaire
 * vivent dans `recruitment-bank.ts` (server-only) pour ne pas fuiter côté client.
 */

export type Domain = "ops" | "graphiste" | "crm" | "social" | "cyber" | "dev";

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
  graphiste: "Graphiste-Monteur vidéo",
  crm: "CRM & Relation Client",
  social: "Social Media & Content",
  cyber: "IT — Cybersécurité",
  dev: "IT — Développement",
};

export const DOMAIN_OPTIONS: { id: Domain; label: string; sub: string }[] = [
  { id: "ops", label: "Opérations", sub: "Customer Support Officer" },
  { id: "graphiste", label: "Graphiste-Monteur vidéo", sub: "Design · Production audiovisuelle" },
  { id: "crm", label: "CRM & Relation Client", sub: "Chargé(e) CRM & Relation Client" },
  { id: "social", label: "Social Media & Content", sub: "Social Media & Content Creator" },
  { id: "cyber", label: "IT — Cybersécurité", sub: "Analyste Cybersécurité" },
  { id: "dev", label: "IT — Développement", sub: "Développeur · Architecture Logiciel" },
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

export const DEFAULT_PASS_THRESHOLD = 75; // % minimum pour être « Admis » (configurable côté admin)
const RESERVE_THRESHOLD = 60; // % minimum pour être « Réserve »

export function statusFor(total: number, max: number, passThreshold: number = DEFAULT_PASS_THRESHOLD): string {
  const pct = Math.round((total / max) * 100);
  if (pct >= passThreshold) return "Admis";
  if (pct >= RESERVE_THRESHOLD) return "Réserve";
  return "Non retenu";
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
  return (
    v === "ops" || v === "graphiste" || v === "crm" || v === "social" || v === "cyber" || v === "dev"
  );
}
