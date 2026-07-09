import "server-only";
import { and, asc, eq, isNull, or } from "drizzle-orm";
import { db } from "./db";
import { recruitmentQuestions } from "./db/schema";
import { statusFor, type Domain, type PublicTQ, type TestDurations, type TestScore } from "./recruitment";

/**
 * Cœur du test de recrutement — SERVEUR UNIQUEMENT.
 * Les questions (avec bonnes réponses) vivent en base (`recruitment_questions`)
 * et sont éditables depuis le dashboard admin. `server-only` empêche tout import client.
 */

interface ScoringQuestion {
  block: number;
  section: string;
  text: string;
  options: string[];
  correctIndex: number;
}

/**
 * Questions actives d'un test pour un domaine : blocs 1 & 2 (partagés, domaine null)
 * + bloc 3 du domaine choisi. Ordre déterministe (block, position) — identique pour
 * l'affichage (buildTest) et le scoring (scoreTest) → alignement des réponses garanti.
 */
async function getQuestions(domain: Domain): Promise<ScoringQuestion[]> {
  const rows = await db
    .select()
    .from(recruitmentQuestions)
    .where(
      and(
        eq(recruitmentQuestions.active, true),
        or(isNull(recruitmentQuestions.domain), eq(recruitmentQuestions.domain, domain)),
      ),
    )
    .orderBy(asc(recruitmentQuestions.block), asc(recruitmentQuestions.position));
  return rows.map((r) => ({
    block: r.block,
    section: r.section,
    text: r.text,
    options: r.options,
    correctIndex: r.correctIndex,
  }));
}

/** Questions exposées au candidat (sans bonne réponse), avec le temps par bloc. */
export async function buildTest(domain: Domain, durations?: TestDurations): Promise<PublicTQ[]> {
  const qs = await getQuestions(domain);
  return qs.map((q) => ({
    s: q.section,
    t: q.text,
    o: q.options,
    sec: durations ? (q.block === 1 ? durations.block1 : durations.block23) : 40,
  }));
}

/** Nombre total de questions actives par domaine (blocs partagés + bloc 3 du domaine). */
export async function getDomainQuestionCounts(): Promise<Record<Domain, number>> {
  const rows = await db
    .select({ block: recruitmentQuestions.block, domain: recruitmentQuestions.domain })
    .from(recruitmentQuestions)
    .where(eq(recruitmentQuestions.active, true));
  const shared = rows.filter((r) => r.block !== 3).length;
  const domains: Domain[] = ["ops", "graphiste", "crm", "social", "cyber", "dev"];
  const out = {} as Record<Domain, number>;
  for (const d of domains) {
    out[d] = shared + rows.filter((r) => r.block === 3 && r.domain === d).length;
  }
  return out;
}

/** Notation autoritaire côté serveur à partir des réponses soumises. */
export async function scoreTest(
  domain: Domain,
  answers: (number | null)[],
  passThreshold?: number,
): Promise<TestScore> {
  const qs = await getQuestions(domain);
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  qs.forEach((q, i) => {
    if (answers[i] === q.correctIndex) {
      if (q.block === 1) b1++;
      else if (q.block === 2) b2++;
      else b3++;
    }
  });
  const total = b1 + b2 + b3;
  const max = qs.length;
  const pct = max > 0 ? Math.round((total / max) * 100) : 0;
  return { block1: b1, block2: b2, block3: b3, total, max, status: statusFor(total, max, passThreshold), pct };
}
