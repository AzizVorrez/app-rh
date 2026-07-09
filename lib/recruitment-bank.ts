import "server-only";
import { and, asc, eq, inArray, isNull, or } from "drizzle-orm";
import { db } from "./db";
import { recruitmentQuestions } from "./db/schema";
import { computeScore, type Domain, type PublicTQ, type TestDurations, type TestScore } from "./recruitment";

/**
 * Cœur du test de recrutement — SERVEUR UNIQUEMENT.
 * Les questions (avec bonnes réponses) vivent en base (`recruitment_questions`)
 * et sont éditables depuis le dashboard admin. `server-only` empêche tout import client.
 */

interface ScoringQuestion {
  id: string;
  block: number;
  section: string;
  text: string;
  options: string[];
  correctIndex: number;
}

/**
 * Questions actives d'un test pour un domaine : blocs 1 & 2 (partagés, domaine null)
 * + bloc 3 du domaine choisi. Ordre déterministe (block, position).
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
    id: r.id,
    block: r.block,
    section: r.section,
    text: r.text,
    options: r.options,
    correctIndex: r.correctIndex,
  }));
}

/** Questions exposées au candidat (sans bonne réponse), avec le temps par bloc + leur id. */
export async function buildTest(domain: Domain, durations?: TestDurations): Promise<PublicTQ[]> {
  const qs = await getQuestions(domain);
  return qs.map((q) => ({
    id: q.id,
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

/**
 * Notation autoritaire côté serveur.
 * Si `questionIds` est fourni (snapshot des questions réellement vues par le candidat),
 * on note contre CES questions précises, par id — robuste au réordonnancement / ajout /
 * suppression survenus entre le chargement du test et la soumission. Les questions
 * supprimées entre-temps sont ignorées (retirées de la note ET du total).
 */
export async function scoreTest(
  domain: Domain,
  answers: (number | null)[],
  passThreshold?: number,
  questionIds?: string[],
): Promise<TestScore> {
  if (questionIds && questionIds.length > 0) {
    const rows = await db
      .select({
        id: recruitmentQuestions.id,
        block: recruitmentQuestions.block,
        correctIndex: recruitmentQuestions.correctIndex,
      })
      .from(recruitmentQuestions)
      .where(inArray(recruitmentQuestions.id, questionIds));
    const byId = new Map(rows.map((r) => [r.id, r]));
    // Conserver l'alignement answers[i] ↔ questionIds[i], en filtrant les questions absentes.
    const valid = questionIds
      .map((id, i) => ({ q: byId.get(id), a: answers[i] ?? null }))
      .filter((p): p is { q: { id: string; block: number; correctIndex: number }; a: number | null } =>
        Boolean(p.q),
      );
    return computeScore(
      valid.map((p) => ({ block: p.q.block, correctIndex: p.q.correctIndex })),
      valid.map((p) => p.a),
      passThreshold,
    );
  }

  // Fallback (client sans snapshot) : jeu de questions courant du domaine.
  const qs = await getQuestions(domain);
  return computeScore(
    qs.map((q) => ({ block: q.block, correctIndex: q.correctIndex })),
    answers,
    passThreshold,
  );
}
