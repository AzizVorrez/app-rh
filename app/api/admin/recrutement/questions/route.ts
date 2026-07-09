import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { recruitmentQuestions } from "@/lib/db/schema";
import { guardAdmin } from "@/lib/guard";
import { getRecruitmentSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LOCKED = "Fermez le test avant de modifier les questions.";

export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;
  const rows = await db
    .select()
    .from(recruitmentQuestions)
    .orderBy(asc(recruitmentQuestions.block), asc(recruitmentQuestions.position));
  return NextResponse.json({ questions: rows });
}

// Validation partagée (create). Bloc 3 ⇒ domaine requis ; blocs 1 & 2 ⇒ sans domaine ;
// la bonne réponse doit exister dans les options.
const questionSchema = z
  .object({
    block: z.number().int().min(1).max(3),
    domain: z.enum(["ops", "graphiste", "crm", "social", "cyber", "dev"]).nullable(),
    section: z.string().trim().max(120).default(""),
    text: z.string().trim().min(1).max(2000),
    options: z.array(z.string().trim().min(1).max(500)).min(2).max(6),
    correctIndex: z.number().int().min(0),
    explanation: z.string().trim().max(2000).default(""),
  })
  .refine((d) => d.correctIndex < d.options.length, {
    message: "La bonne réponse doit être l'une des options.",
    path: ["correctIndex"],
  })
  .refine((d) => (d.block === 3 ? d.domain !== null : d.domain === null), {
    message: "Bloc 3 = domaine requis ; blocs 1 & 2 = sans domaine.",
    path: ["domain"],
  });

export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  if ((await getRecruitmentSettings()).enabled) return NextResponse.json({ error: LOCKED }, { status: 409 });
  const parsed = questionSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  const d = parsed.data;

  // Position = fin du groupe (block, domain) — l'ordre est scopé par bloc/domaine.
  const groupWhere =
    d.domain === null
      ? and(eq(recruitmentQuestions.block, d.block), isNull(recruitmentQuestions.domain))
      : and(eq(recruitmentQuestions.block, d.block), eq(recruitmentQuestions.domain, d.domain));
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${recruitmentQuestions.position}), -1)` })
    .from(recruitmentQuestions)
    .where(groupWhere);

  const [row] = await db
    .insert(recruitmentQuestions)
    .values({
      block: d.block,
      domain: d.domain,
      section: d.section,
      text: d.text,
      options: d.options,
      correctIndex: d.correctIndex,
      explanation: d.explanation,
      position: max + 1,
      active: true,
    })
    .returning();
  return NextResponse.json(row);
}

const reorderSchema = z.object({ order: z.array(z.string().uuid()) });

export async function PATCH(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  if ((await getRecruitmentSettings()).enabled) return NextResponse.json({ error: LOCKED }, { status: 409 });
  const parsed = reorderSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Ordre invalide." }, { status: 400 });
  // Renumérote les positions du groupe envoyé (une liste d'ids d'un même bloc/domaine).
  await db.transaction(async (tx) => {
    for (let i = 0; i < parsed.data.order.length; i++) {
      await tx
        .update(recruitmentQuestions)
        .set({ position: i })
        .where(eq(recruitmentQuestions.id, parsed.data.order[i]));
    }
  });
  return NextResponse.json({ ok: true });
}
