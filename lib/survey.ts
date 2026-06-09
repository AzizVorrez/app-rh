import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "./db";
import { departments, questions } from "./db/schema";
import { getSurveySettings } from "./settings";
import type { PublicQuestion, SurveyConfig } from "./types";

export async function getPublicSurvey(): Promise<SurveyConfig> {
  const [settings, qRows, deptRows] = await Promise.all([
    getSurveySettings(),
    db.select().from(questions).where(eq(questions.active, true)).orderBy(asc(questions.position)),
    db
      .select({ id: departments.id, name: departments.name })
      .from(departments)
      .where(eq(departments.active, true))
      .orderBy(asc(departments.position)),
  ]);

  const publicQuestions: PublicQuestion[] = qRows.map((q) => ({
    id: q.id,
    code: q.code,
    section: q.section,
    label: q.label,
    type: q.type,
    options: (q.options as string[]) ?? [],
    themeId: q.themeId,
    required: q.required,
    position: q.position,
  }));

  return {
    enabled: settings.survey_enabled,
    title: settings.survey_title,
    year: settings.survey_year,
    orgName: settings.org_name,
    intro: settings.survey_intro,
    questions: publicQuestions,
    departments: deptRows,
  };
}
