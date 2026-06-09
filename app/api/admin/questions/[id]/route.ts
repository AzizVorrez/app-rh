import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { questions } from "@/lib/db/schema";
import { guardAdmin } from "@/lib/guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const questionType = z.enum(["emoji", "scale5", "yesno", "nps", "multi", "open"]);

const updateSchema = z.object({
  section: z.string().trim().max(80).optional(),
  label: z.string().trim().min(1).max(500).optional(),
  type: questionType.optional(),
  options: z.array(z.string().max(120)).max(30).optional(),
  themeId: z.string().uuid().nullable().optional(),
  includedInScore: z.boolean().optional(),
  required: z.boolean().optional(),
  active: z.boolean().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  const d = parsed.data;

  // Keep scoring/theme coherent with the (possibly updated) type.
  const patch: Record<string, unknown> = { ...d };
  if (d.type && d.type !== "scale5") {
    patch.themeId = null;
    patch.includedInScore = false;
  }

  const [row] = await db.update(questions).set(patch).where(eq(questions.id, id)).returning();
  if (!row) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await params;
  // Answers referencing this question keep their snapshot (question_id set to null).
  await db.delete(questions).where(eq(questions.id, id));
  return NextResponse.json({ ok: true });
}
