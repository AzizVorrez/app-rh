import { NextResponse } from "next/server";
import { getPublicSurvey } from "@/lib/survey";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const survey = await getPublicSurvey();
    return NextResponse.json(survey);
  } catch (err) {
    console.error("[api/survey]", err);
    return NextResponse.json({ error: "Impossible de charger l'enquête." }, { status: 500 });
  }
}
