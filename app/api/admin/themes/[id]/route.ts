import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { themes } from "@/lib/db/schema";
import { guardAdmin } from "@/lib/guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const updateSchema = z.object({
  label: z.string().trim().min(1).max(120).optional(),
  active: z.boolean().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  const [row] = await db.update(themes).set(parsed.data).where(eq(themes.id, id)).returning();
  if (!row) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await params;
  // Questions referencing this theme have theme_id set to null (onDelete: set null).
  await db.delete(themes).where(eq(themes.id, id));
  return NextResponse.json({ ok: true });
}
