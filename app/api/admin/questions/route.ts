import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { questions } from "@/lib/db/schema";
import { guardAdmin } from "@/lib/guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const questionType = z.enum(["emoji", "scale5", "yesno", "nps", "multi", "open"]);

const createSchema = z.object({
  section: z.string().trim().max(80).default(""),
  label: z.string().trim().min(1).max(500),
  type: questionType,
  options: z.array(z.string().max(120)).max(30).default([]),
  themeId: z.string().uuid().nullable().optional(),
  includedInScore: z.boolean().optional(),
  required: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  const d = parsed.data;

  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${questions.position}), -1)` })
    .from(questions);

  const scored = d.type === "scale5" ? (d.includedInScore ?? true) : false;

  const [row] = await db
    .insert(questions)
    .values({
      section: d.section,
      label: d.label,
      type: d.type,
      options: d.options,
      themeId: d.type === "scale5" ? (d.themeId ?? null) : null,
      includedInScore: scored,
      required: d.required ?? false,
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
  const parsed = reorderSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Ordre invalide." }, { status: 400 });
  await db.transaction(async (tx) => {
    for (let i = 0; i < parsed.data.order.length; i++) {
      await tx
        .update(questions)
        .set({ position: i })
        .where(sql`${questions.id} = ${parsed.data.order[i]}`);
    }
  });
  return NextResponse.json({ ok: true });
}
