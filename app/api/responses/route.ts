import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { answers, departments, questions, responses } from "@/lib/db/schema";
import { getSurveySettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  departmentId: z.string().uuid(),
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        num: z.number().int().nullable().optional(),
        text: z.string().max(4000).nullable().optional(),
        json: z.array(z.number().int()).nullable().optional(),
      }),
    )
    .max(200),
});

export async function POST(req: NextRequest) {
  try {
    const settings = await getSurveySettings();
    if (!settings.survey_enabled) {
      return NextResponse.json({ error: "L'enquête est actuellement fermée." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides." }, { status: 400 });
    }
    const { name, departmentId, answers: submitted } = parsed.data;

    const dept = await db
      .select()
      .from(departments)
      .where(eq(departments.id, departmentId))
      .limit(1);
    if (!dept[0]) {
      return NextResponse.json({ error: "Département introuvable." }, { status: 400 });
    }

    // Resolve which questions are valid & active, to attach type/code snapshots.
    const ids = submitted.map((a) => a.questionId);
    const qRows = ids.length
      ? await db
          .select()
          .from(questions)
          .where(and(inArray(questions.id, ids), eq(questions.active, true)))
      : [];
    const qById = new Map(qRows.map((q) => [q.id, q]));

    await db.transaction(async (tx) => {
      const [resp] = await tx
        .insert(responses)
        .values({
          respondentName: name,
          departmentId: dept[0].id,
          departmentName: dept[0].name,
        })
        .returning({ id: responses.id });

      const rows = submitted
        .map((a) => {
          const q = qById.get(a.questionId);
          if (!q) return null;
          const hasValue =
            (a.num != null) ||
            (a.text != null && a.text.trim() !== "") ||
            (Array.isArray(a.json) && a.json.length > 0);
          if (!hasValue) return null;
          return {
            responseId: resp.id,
            questionId: q.id,
            questionCode: q.code,
            questionType: q.type,
            valueNum: a.num ?? null,
            valueText: a.text?.trim() || null,
            valueJson: Array.isArray(a.json) ? a.json : null,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      if (rows.length) await tx.insert(answers).values(rows);
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/responses POST]", err);
    return NextResponse.json({ error: "Échec de l'enregistrement." }, { status: 500 });
  }
}
