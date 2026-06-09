import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/guard";
import { computeStats } from "@/lib/stats";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const stats = await computeStats();
    return NextResponse.json(stats);
  } catch (err) {
    console.error("[api/admin/stats]", err);
    return NextResponse.json({ error: "Impossible de calculer les statistiques." }, { status: 500 });
  }
}
