import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { departments, questions, themes } from "@/lib/db/schema";
import { guardAdmin } from "@/lib/guard";
import { getSurveySettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const [deptRows, themeRows, questionRows, settings] = await Promise.all([
      db.select().from(departments).orderBy(asc(departments.position)),
      db.select().from(themes).orderBy(asc(themes.position)),
      db.select().from(questions).orderBy(asc(questions.position)),
      getSurveySettings(),
    ]);
    return NextResponse.json({
      departments: deptRows,
      themes: themeRows,
      questions: questionRows,
      settings,
    });
  } catch (err) {
    console.error("[api/admin/config]", err);
    return NextResponse.json({ error: "Impossible de charger la configuration." }, { status: 500 });
  }
}
