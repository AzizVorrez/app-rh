import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./index";
import { departments, themes, questions, settings, recruitmentQuestions } from "./schema";
import { SEED_QUESTIONS } from "../recruitment-data";
import type { QuestionType } from "../types";

/* ─── Reference data (mirrors the original IZICHANGE 2026 survey) ─────── */

const DEPARTMENTS = [
  "Ressources Humaines",
  "Operations",
  "AML & Compliance",
  "Finance",
  "Marketing & Communication",
  "Tech",
  "Stratégie & Innovation",
  "Direction",
];

const THEMES = [
  "Environnement",
  "Travail d'équipe",
  "Développement",
  "Communication",
  "Implication stratégique",
  "Management",
];

const MOTIVATIONS = [
  "Autonomie",
  "Mission & valeurs",
  "Mon équipe",
  "Évolution",
  "Rémunération",
  "Apprentissage",
  "Impact concret",
  "Ambiance",
  "Reconnaissance",
  "Innovation",
];

const YESNO = ["Oui", "Plutôt oui", "Plutôt non", "Non"];

const EMOJI_OPTIONS = [
  "😞 Pas bien",
  "😐 Ça peut aller",
  "🙂 Bien",
  "😄 Très bien",
  "🤩 Excellent !",
];

interface SeedQuestion {
  code: string;
  section: string;
  label: string;
  type: QuestionType;
  themeName?: string;
  options?: string[];
  scored?: boolean;
}

const QUESTIONS: SeedQuestion[] = [
  { code: "q0", section: "Ressenti global", type: "emoji", options: EMOJI_OPTIONS, label: "En ce moment, comment vous sentez-vous au travail ?" },

  { code: "q1", section: "Environnement", type: "scale5", themeName: "Environnement", scored: true, label: "Je dispose des outils et ressources nécessaires pour accomplir mes missions." },
  { code: "q2", section: "Environnement", type: "scale5", themeName: "Environnement", scored: true, label: "L'environnement de travail est sain, positif et propice à la motivation." },
  { code: "q3", section: "Environnement", type: "scale5", themeName: "Environnement", scored: true, label: "Mon travail est stimulant et a du sens pour moi." },
  { code: "q4", section: "Environnement", type: "scale5", themeName: "Environnement", scored: true, label: "Je suis fier(e) de faire partie d'IZICHANGE." },
  { code: "q5", section: "Environnement", type: "scale5", themeName: "Environnement", scored: true, label: "J'ai une compréhension claire de la vision et des objectifs d'IZICHANGE." },

  { code: "q6", section: "Travail d'équipe", type: "scale5", themeName: "Travail d'équipe", scored: true, label: "Je collabore régulièrement avec mes collègues pour atteindre les objectifs communs." },
  { code: "q7", section: "Travail d'équipe", type: "scale5", themeName: "Travail d'équipe", scored: true, label: "Je peux solliciter librement l'aide ou les conseils de mes pairs." },
  { code: "q8", section: "Travail d'équipe", type: "scale5", themeName: "Travail d'équipe", scored: true, label: "L'ambiance et la cohésion au sein de mon équipe sont bonnes." },

  { code: "q9", section: "Développement", type: "scale5", themeName: "Développement", scored: true, label: "J'ai accès à des opportunités concrètes de développement professionnel." },
  { code: "q10", section: "Développement", type: "scale5", themeName: "Développement", scored: true, label: "Mon plan de carrière est discuté régulièrement avec mon supérieur." },
  { code: "q11", section: "Développement", type: "scale5", themeName: "Développement", scored: true, label: "Je me sens libre de prendre des initiatives dans l'intérêt de l'entreprise." },

  { code: "q12", section: "Communication", type: "scale5", themeName: "Communication", scored: true, label: "Je reçois régulièrement des retours constructifs de mes supérieurs." },
  { code: "q13", section: "Communication", type: "scale5", themeName: "Communication", scored: true, label: "Je me sens libre de proposer des idées nouvelles auprès de la direction." },
  { code: "q14", section: "Communication", type: "scale5", themeName: "Communication", scored: true, label: "Les décisions de la direction sont communiquées de façon claire et cohérente." },

  { code: "q15", section: "Flexibilité", type: "yesno", options: YESNO, label: "Je maintiens un bon équilibre entre vie professionnelle et personnelle." },
  { code: "q16", section: "Flexibilité", type: "yesno", options: YESNO, label: "Les règles et politiques internes sont équitables et appliquées à tous." },

  { code: "q17", section: "Implication stratégique", type: "scale5", themeName: "Implication stratégique", scored: true, label: "Je m'implique activement dans les projets et la croissance d'IZICHANGE." },
  { code: "q18", section: "Implication stratégique", type: "scale5", themeName: "Implication stratégique", scored: true, label: "Je propose régulièrement des idées innovantes ou des pistes d'amélioration." },
  { code: "q19", section: "Implication stratégique", type: "scale5", themeName: "Implication stratégique", scored: true, label: "Je suis motivé(e) et engagé(e) envers les objectifs globaux d'IZICHANGE." },

  { code: "q20", section: "Management", type: "scale5", themeName: "Management", scored: true, label: "Mon manager communique de façon claire et efficace." },
  { code: "q21", section: "Management", type: "scale5", themeName: "Management", scored: true, label: "Mon manager soutient mon développement professionnel." },
  { code: "q22", section: "Management", type: "scale5", themeName: "Management", scored: true, label: "Mon manager me donne des retours constructifs et réguliers." },

  { code: "q23", section: "Engagement global", type: "nps", label: "Sur une échelle de 0 à 10, recommanderiez-vous IZICHANGE comme lieu de travail à un proche ?" },
  { code: "q24", section: "Engagement global", type: "multi", options: MOTIVATIONS, label: "Qu'est-ce qui vous motive le plus en ce moment chez IZICHANGE ?" },
  { code: "q25", section: "Engagement global", type: "open", label: "Si vous pouviez changer une seule chose dans votre quotidien au travail, ce serait quoi ?" },
  { code: "q26", section: "Engagement global", type: "open", label: "Qu'est-ce qu'IZICHANGE fait bien et que vous ne voudriez pas voir changer ?" },
];

const DEFAULT_SETTINGS: Record<string, unknown> = {
  survey_enabled: true,
  org_name: "IZICHANGE",
  survey_title: "Enquête d'engagement",
  survey_year: "2026",
  survey_intro:
    "Vos réponses sont confidentielles et contribuent directement à améliorer votre quotidien au travail. Comptez environ 5 minutes.",
  // Durées (secondes/question) du test de recrutement — modifiables depuis /admin/recrutement.
  recruitment_duration_block1: 30,
  recruitment_duration_block23: 40,
  recruitment_pass_threshold: 75,
  recruitment_enabled: true,
};

async function main() {
  console.log("🌱 Seeding IZICHANGE engagement database…");

  // ── Departments ──
  const existingDepts = await db.select().from(departments);
  if (existingDepts.length === 0) {
    await db.insert(departments).values(
      DEPARTMENTS.map((name, i) => ({ name, position: i })),
    );
    console.log(`  ✓ ${DEPARTMENTS.length} departments`);
  } else {
    console.log(`  • departments already present (${existingDepts.length}) — skipped`);
  }

  // ── Themes ──
  let themeRows = await db.select().from(themes);
  if (themeRows.length === 0) {
    await db.insert(themes).values(THEMES.map((label, i) => ({ label, position: i })));
    themeRows = await db.select().from(themes);
    console.log(`  ✓ ${THEMES.length} themes`);
  } else {
    console.log(`  • themes already present (${themeRows.length}) — skipped`);
  }
  const themeIdByName = new Map(themeRows.map((t) => [t.label, t.id]));

  // ── Questions ──
  const existingQ = await db.select().from(questions);
  if (existingQ.length === 0) {
    await db.insert(questions).values(
      QUESTIONS.map((q, i) => ({
        code: q.code,
        section: q.section,
        label: q.label,
        type: q.type,
        options: q.options ?? [],
        themeId: q.themeName ? (themeIdByName.get(q.themeName) ?? null) : null,
        includedInScore: !!q.scored,
        required: false,
        position: i,
        active: true,
      })),
    );
    console.log(`  ✓ ${QUESTIONS.length} questions`);
  } else {
    console.log(`  • questions already present (${existingQ.length}) — skipped`);
  }

  // ── Settings (upsert defaults that are missing) ──
  const existingSettings = await db.select().from(settings);
  const have = new Set(existingSettings.map((s) => s.key));
  const toInsert: { key: string; value: unknown }[] = [];
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    if (!have.has(key)) toInsert.push({ key, value });
  }
  if (!have.has("admin_password_hash")) {
    const initial = process.env.ADMIN_PASSWORD || "izichange2026";
    toInsert.push({ key: "admin_password_hash", value: bcrypt.hashSync(initial, 10) });
    console.log(`  ✓ admin password initialised (from ${process.env.ADMIN_PASSWORD ? "ADMIN_PASSWORD" : "default 'izichange2026'"})`);
  }
  if (toInsert.length) {
    await db.insert(settings).values(toInsert);
    console.log(`  ✓ ${toInsert.length} settings`);
  } else {
    console.log("  • settings already present — skipped");
  }

  // ── Recruitment questions (seed once if empty) ──
  const existingRQ = await db.select({ id: recruitmentQuestions.id }).from(recruitmentQuestions);
  if (existingRQ.length === 0) {
    await db.insert(recruitmentQuestions).values(
      SEED_QUESTIONS.map((q, i) => ({
        block: q.block,
        domain: q.domain,
        section: q.section,
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        position: i,
        active: true,
      })),
    );
    console.log(`  ✓ ${SEED_QUESTIONS.length} recruitment questions`);
  } else {
    console.log(`  • recruitment questions already present (${existingRQ.length}) — skipped`);
  }

  console.log("✅ Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
