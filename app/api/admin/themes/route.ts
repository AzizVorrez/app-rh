import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { themes } from "@/lib/db/schema";
import { guardAdmin } from "@/lib/guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createSchema = z.object({ label: z.string().trim().min(1).max(120) });

export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Libellé requis." }, { status: 400 });
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${themes.position}), -1)` })
    .from(themes);
  const [row] = await db
    .insert(themes)
    .values({ label: parsed.data.label, position: max + 1 })
    .returning();
  return NextResponse.json(row);
}
