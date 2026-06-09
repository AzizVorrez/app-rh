import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { departments } from "@/lib/db/schema";
import { guardAdmin } from "@/lib/guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createSchema = z.object({ name: z.string().trim().min(1).max(120) });

export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Nom requis." }, { status: 400 });

  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${departments.position}), -1)` })
    .from(departments);
  const [row] = await db
    .insert(departments)
    .values({ name: parsed.data.name, position: max + 1 })
    .returning();
  return NextResponse.json(row);
}

// Reorder: { order: string[] }
const reorderSchema = z.object({ order: z.array(z.string().uuid()) });

export async function PATCH(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const parsed = reorderSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Ordre invalide." }, { status: 400 });
  await db.transaction(async (tx) => {
    for (let i = 0; i < parsed.data.order.length; i++) {
      await tx
        .update(departments)
        .set({ position: i })
        .where(sql`${departments.id} = ${parsed.data.order[i]}`);
    }
  });
  return NextResponse.json({ ok: true });
}
