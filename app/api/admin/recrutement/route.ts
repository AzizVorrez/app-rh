import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { testResults } from "@/lib/db/schema";
import { guardAdmin } from "@/lib/guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const rows = await db.select().from(testResults).orderBy(desc(testResults.createdAt));
    return NextResponse.json({
      results: rows.map((r) => ({
        id: r.id,
        name: r.candidateName,
        domain: r.domain,
        block1: r.block1,
        block2: r.block2,
        block3: r.block3,
        total: r.total,
        max: r.maxScore,
        status: r.status,
        date: r.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[api/admin/recrutement GET]", err);
    return NextResponse.json({ error: "Impossible de charger les résultats." }, { status: 500 });
  }
}

/** Wipe all recruitment test results. */
export async function DELETE() {
  const denied = await guardAdmin();
  if (denied) return denied;
  await db.delete(testResults);
  return NextResponse.json({ ok: true });
}
