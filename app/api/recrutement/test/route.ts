import { NextRequest, NextResponse } from "next/server";
import { buildTest } from "@/lib/recruitment-bank";
import { isDomain, type PublicTQ } from "@/lib/recruitment";
import { getRecruitmentSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Sert les questions du test pour un domaine, SANS bonne réponse ni explication. */
export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get("domain");
  if (!isDomain(domain)) {
    return NextResponse.json({ error: "Domaine invalide." }, { status: 400 });
  }
  const { durationBlock1, durationBlock23, enabled } = await getRecruitmentSettings();
  if (!enabled) {
    return NextResponse.json({ error: "Le test de recrutement est actuellement fermé." }, { status: 403 });
  }
  // buildTest lit la banque serveur et ne renvoie que les champs publics (sans bonnes réponses).
  const questions: PublicTQ[] = await buildTest(domain, { block1: durationBlock1, block23: durationBlock23 });
  return NextResponse.json({ questions });
}
