import "server-only";
import { asc } from "drizzle-orm";
import { db } from "./db";
import { answers, questions, responses, themes } from "./db/schema";
import { getSurveySettings } from "./settings";
import { avg } from "./utils";
import type {
  CollaboratorRow,
  DashboardStats,
  FreeTextBlock,
  MotivationCount,
  Recommendation,
  ThemeScore,
} from "./types";

const REC_COLORS = { low: "#e11d48", mid: "#d97706", high: "#059669" };
const REC_ICONS = { low: "🔴", mid: "🟡", high: "🟢" };

export async function computeStats(): Promise<DashboardStats> {
  const [themeRows, questionRows, responseRows, answerRows, settings] = await Promise.all([
    db.select().from(themes).orderBy(asc(themes.position)),
    db.select().from(questions).orderBy(asc(questions.position)),
    db.select().from(responses).orderBy(asc(responses.createdAt)),
    db.select().from(answers),
    getSurveySettings(),
  ]);

  const qById = new Map(questionRows.map((q) => [q.id, q]));

  // answers grouped by response
  const byResponse = new Map<string, typeof answerRows>();
  for (const a of answerRows) {
    const arr = byResponse.get(a.responseId) ?? [];
    arr.push(a);
    byResponse.set(a.responseId, arr);
  }

  const n = responseRows.length;

  // Identify the "special" questions by type (first of each).
  const emojiQ = questionRows.find((q) => q.type === "emoji") ?? null;
  const npsQ = questionRows.find((q) => q.type === "nps") ?? null;
  const multiQ = questionRows.find((q) => q.type === "multi") ?? null;
  const openQs = questionRows.filter((q) => q.type === "open");

  // ── Global score: all scored scale5 answers ──
  const scoredQIds = new Set(
    questionRows.filter((q) => q.type === "scale5" && q.includedInScore).map((q) => q.id),
  );
  const globalVals: number[] = [];
  for (const a of answerRows) {
    if (a.questionId && scoredQIds.has(a.questionId) && a.valueNum != null) {
      globalVals.push(a.valueNum);
    }
  }
  const globalAvg = avg(globalVals);

  // ── Theme scores ──
  const themeScores: ThemeScore[] = [];
  for (const t of themeRows) {
    const tqIds = new Set(
      questionRows.filter((q) => q.themeId === t.id && q.type === "scale5").map((q) => q.id),
    );
    if (tqIds.size === 0) continue; // only show themes that actually score
    const vals: number[] = [];
    for (const a of answerRows) {
      if (a.questionId && tqIds.has(a.questionId) && a.valueNum != null) vals.push(a.valueNum);
    }
    themeScores.push({ id: t.id, label: t.label, score: avg(vals), count: vals.length });
  }

  // ── Departments ──
  const deptMap = new Map<string, number>();
  for (const r of responseRows) deptMap.set(r.departmentName, (deptMap.get(r.departmentName) ?? 0) + 1);
  const departments = [...deptMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // ── Ressenti (emoji) ──
  const emojiOptions = (emojiQ?.options as string[]) ?? [];
  const emojiCounts = new Array(emojiOptions.length).fill(0);
  if (emojiQ) {
    for (const a of answerRows) {
      if (a.questionId === emojiQ.id && a.valueNum != null && a.valueNum < emojiCounts.length) {
        emojiCounts[a.valueNum]++;
      }
    }
  }
  const maxEmoji = Math.max(...emojiCounts, 0);
  const dominantIndex = emojiQ && n > 0 && maxEmoji > 0 ? emojiCounts.indexOf(maxEmoji) : null;

  // ── eNPS ──
  let nps: number | null = null;
  let promoters = 0;
  let detractors = 0;
  let passives = 0;
  if (npsQ) {
    const vals: number[] = [];
    for (const a of answerRows) {
      if (a.questionId === npsQ.id && a.valueNum != null) vals.push(a.valueNum);
    }
    promoters = vals.filter((v) => v >= 9).length;
    detractors = vals.filter((v) => v <= 6).length;
    passives = vals.filter((v) => v === 7 || v === 8).length;
    nps = vals.length ? Math.round(((promoters - detractors) / vals.length) * 100) : null;
  }

  // ── Motivations (multi) ──
  const motivations: MotivationCount[] = [];
  if (multiQ) {
    const opts = (multiQ.options as string[]) ?? [];
    const counts = new Array(opts.length).fill(0);
    for (const a of answerRows) {
      if (a.questionId === multiQ.id && Array.isArray(a.valueJson)) {
        for (const idx of a.valueJson) if (idx < counts.length) counts[idx]++;
      }
    }
    opts.forEach((label, i) => motivations.push({ label, count: counts[i] }));
    motivations.sort((a, b) => b.count - a.count);
  }

  // ── Free text ──
  const freeText: FreeTextBlock[] = openQs.map((q) => {
    const block: FreeTextBlock = { questionId: q.id, label: q.label, answers: [] };
    for (const r of responseRows) {
      const a = byResponse.get(r.id)?.find((x) => x.questionId === q.id);
      if (a?.valueText && a.valueText.trim()) {
        block.answers.push({ name: r.respondentName, dept: r.departmentName, text: a.valueText.trim() });
      }
    }
    return block;
  });

  // ── Collaborators ──
  const collaborators: CollaboratorRow[] = responseRows.map((r) => {
    const ans = byResponse.get(r.id) ?? [];
    const themeScoresMap: Record<string, number | null> = {};
    for (const t of themeScores) {
      const tqIds = new Set(
        questionRows.filter((q) => q.themeId === t.id && q.type === "scale5").map((q) => q.id),
      );
      const vals = ans
        .filter((a) => a.questionId && tqIds.has(a.questionId) && a.valueNum != null)
        .map((a) => a.valueNum as number);
      themeScoresMap[t.id] = avg(vals);
    }
    const npsA = npsQ ? ans.find((a) => a.questionId === npsQ.id) : undefined;
    const emojiA = emojiQ ? ans.find((a) => a.questionId === emojiQ.id) : undefined;
    const open: Record<string, string> = {};
    for (const oq of openQs) {
      const a = ans.find((x) => x.questionId === oq.id);
      if (a?.valueText) open[oq.id] = a.valueText;
    }
    return {
      id: r.id,
      name: r.respondentName,
      dept: r.departmentName,
      date: r.createdAt.toISOString(),
      themeScores: themeScoresMap,
      nps: npsA?.valueNum ?? null,
      ressentiIndex: emojiA?.valueNum ?? null,
      open,
    };
  });

  // ── Recommendations ──
  const recommendations = buildRecommendations(themeScores, nps, emojiCounts);

  const dominantEmoji =
    dominantIndex != null ? (emojiOptions[dominantIndex]?.split(" ")[0] ?? null) : null;
  const dominantLabel =
    dominantIndex != null
      ? (emojiOptions[dominantIndex]?.split(" ").slice(1).join(" ") || null)
      : null;

  return {
    totals: {
      responses: n,
      globalAvg,
      nps,
      promoters,
      detractors,
      passives,
      dominantEmoji,
      dominantLabel,
    },
    themes: themeScores,
    departments,
    ressenti: {
      questionLabel: emojiQ?.label ?? null,
      options: emojiOptions,
      counts: emojiCounts,
      dominantIndex,
    },
    motivations: motivations.filter((m) => m.count > 0),
    freeText,
    collaborators,
    recommendations,
    org: { name: settings.org_name, title: settings.survey_title, year: settings.survey_year },
  };
}

function buildRecommendations(
  themeScores: ThemeScore[],
  nps: number | null,
  emojiCounts: number[],
): Recommendation[] {
  const recs: Recommendation[] = [];

  for (const t of themeScores) {
    const s = t.score;
    if (s == null) continue;
    if (s < 3) {
      recs.push({
        level: "low",
        color: REC_COLORS.low,
        icon: REC_ICONS.low,
        title: `Alerte — ${t.label}`,
        body: `Score critique de ${s.toFixed(1)}/5. Organiser un atelier d'écoute ciblé et établir un plan d'action concret sous 30 jours.`,
      });
    } else if (s < 3.8) {
      recs.push({
        level: "mid",
        color: REC_COLORS.mid,
        icon: REC_ICONS.mid,
        title: `À améliorer — ${t.label}`,
        body: `Score intermédiaire de ${s.toFixed(1)}/5. Planifier un point d'équipe pour identifier les leviers d'amélioration rapides.`,
      });
    } else {
      recs.push({
        level: "high",
        color: REC_COLORS.high,
        icon: REC_ICONS.high,
        title: `Point fort — ${t.label}`,
        body: `Performance à ${s.toFixed(1)}/5. Capitaliser sur cet acquis et partager les bonnes pratiques entre équipes.`,
      });
    }
  }

  if (typeof nps === "number") {
    if (nps < 0) {
      recs.push({
        level: "low",
        color: REC_COLORS.low,
        icon: REC_ICONS.low,
        title: "eNPS négatif — Risque de désengagement",
        body: `Score de ${nps}. Des entretiens individuels s'imposent pour identifier les causes profondes rapidement.`,
      });
    } else if (nps < 30) {
      recs.push({
        level: "mid",
        color: REC_COLORS.mid,
        icon: REC_ICONS.mid,
        title: "eNPS modéré — Marge de progression",
        body: `Score de ${nps}. Renforcer la reconnaissance, la communication sur les avancées et la culture d'appartenance.`,
      });
    } else {
      recs.push({
        level: "high",
        color: REC_COLORS.high,
        icon: REC_ICONS.high,
        title: "eNPS positif — Forte ambassade",
        body: `Score de ${nps}. Capitaliser sur cette dynamique via des programmes de référence et de fidélisation.`,
      });
    }
  }

  const neg = (emojiCounts[0] ?? 0) + (emojiCounts[1] ?? 0);
  const tot = emojiCounts.reduce((a, b) => a + b, 0);
  if (tot > 0 && neg / tot > 0.3) {
    recs.push({
      level: "low",
      color: REC_COLORS.low,
      icon: REC_ICONS.low,
      title: "Ressenti global préoccupant",
      body: `${Math.round((neg / tot) * 100)}% des collaborateurs expriment un ressenti négatif ou mitigé. Une initiative bien-être est recommandée rapidement.`,
    });
  }

  return recs;
}
