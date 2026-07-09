import "server-only";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { settings } from "./db/schema";

/** Read a single setting value (typed by the caller). */
export async function getSetting<T = unknown>(key: string): Promise<T | undefined> {
  const rows = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return rows[0]?.value as T | undefined;
}

/** Read several settings at once into a plain object. */
export async function getAllSettings(): Promise<Record<string, unknown>> {
  const rows = await db.select().from(settings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

/** Upsert a setting. */
export async function setSetting(key: string, value: unknown): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
}

const DEFAULTS = {
  survey_enabled: true,
  org_name: "IZICHANGE",
  survey_title: "Enquête d'engagement",
  survey_year: "2026",
  survey_intro:
    "Vos réponses sont confidentielles et contribuent directement à améliorer votre quotidien au travail. Comptez environ 5 minutes.",
} as const;

export interface SurveySettings {
  survey_enabled: boolean;
  org_name: string;
  survey_title: string;
  survey_year: string;
  survey_intro: string;
}

export async function getSurveySettings(): Promise<SurveySettings> {
  const all = await getAllSettings();
  return {
    survey_enabled:
      all.survey_enabled === undefined ? DEFAULTS.survey_enabled : Boolean(all.survey_enabled),
    org_name: (all.org_name as string) ?? DEFAULTS.org_name,
    survey_title: (all.survey_title as string) ?? DEFAULTS.survey_title,
    survey_year: (all.survey_year as string) ?? DEFAULTS.survey_year,
    survey_intro: (all.survey_intro as string) ?? DEFAULTS.survey_intro,
  };
}

/* ─── Recruitment test settings (durées du test psychotechnique) ─────── */

const RECRUITMENT_DEFAULTS = { durationBlock1: 30, durationBlock23: 40, passThreshold: 75 } as const;
const DURATION_MIN = 5;
const DURATION_MAX = 600;

export interface RecruitmentSettings {
  durationBlock1: number;
  durationBlock23: number;
  passThreshold: number; // % minimum pour être « Admis »
}

/** Coerce + clamp une durée stockée (jsonb) vers un entier de secondes valide. */
function clampDuration(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(DURATION_MAX, Math.max(DURATION_MIN, Math.round(n)));
}

/** Coerce + clamp un pourcentage stocké (jsonb) vers un entier 1–100. */
function clampPercent(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(1, Math.round(n)));
}

export async function getRecruitmentSettings(): Promise<RecruitmentSettings> {
  const all = await getAllSettings();
  return {
    durationBlock1: clampDuration(all.recruitment_duration_block1, RECRUITMENT_DEFAULTS.durationBlock1),
    durationBlock23: clampDuration(all.recruitment_duration_block23, RECRUITMENT_DEFAULTS.durationBlock23),
    passThreshold: clampPercent(all.recruitment_pass_threshold, RECRUITMENT_DEFAULTS.passThreshold),
  };
}

/** Verify a password against the stored hash, lazily initialising from env on first use. */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  let hash = await getSetting<string>("admin_password_hash");
  if (!hash) {
    const initial = process.env.ADMIN_PASSWORD || "izichange2026";
    hash = bcrypt.hashSync(initial, 10);
    await setSetting("admin_password_hash", hash);
  }
  return bcrypt.compare(password, hash);
}

export async function setAdminPassword(newPassword: string): Promise<void> {
  const hash = await bcrypt.hash(newPassword, 10);
  await setSetting("admin_password_hash", hash);
}
