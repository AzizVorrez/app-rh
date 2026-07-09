import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { recruitmentQuestions } from "@/lib/db/schema";
import { guardAdmin } from "@/lib/guard";
import { getRecruitmentSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LOCKED = "Fermez le test avant de modifier les questions.";

const questionSchema = z
  .object({
    block: z.number().int().min(1).max(3),
    domain: z.enum(["ops", "graphiste", "crm", "social", "cyber", "dev"]).nullable(),
    section: z.string().trim().max(120).default(""),
    text: z.string().trim().min(1).max(2000),
    options: z.array(z.string().trim().min(1).max(500)).min(2).max(6),
    correctIndex: z.number().int().min(0),
    explanation: z.string().trim().max(2000).default(""),
    active: z.boolean().optional(),
  })
  .refine((d) => d.correctIndex < d.options.length, {
    message: "La bonne réponse doit être l'une des options.",
    path: ["correctIndex"],
  })
  .refine((d) => (d.block === 3 ? d.domain !== null : d.domain === null), {
    message: "Bloc 3 = domaine requis ; blocs 1 & 2 = sans domaine.",
    path: ["domain"],
  });

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  if ((await getRecruitmentSettings()).enabled) return NextResponse.json({ error: LOCKED }, { status: 409 });
  const { id } = await params;
  const parsed = questionSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  const d = parsed.data;

  const [row] = await db
    .update(recruitmentQuestions)
    .set({
      block: d.block,
      domain: d.domain,
      section: d.section,
      text: d.text,
      options: d.options,
      correctIndex: d.correctIndex,
      explanation: d.explanation,
      ...(d.active !== undefined ? { active: d.active } : {}),
    })
    .where(eq(recruitmentQuestions.id, id))
    .returning();
  if (!row) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  if ((await getRecruitmentSettings()).enabled) return NextResponse.json({ error: LOCKED }, { status: 409 });
  const { id } = await params;
  await db.delete(recruitmentQuestions).where(eq(recruitmentQuestions.id, id));
  return NextResponse.json({ ok: true });
}
