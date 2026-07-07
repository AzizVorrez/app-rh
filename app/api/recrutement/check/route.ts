import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { testResults } from "@/lib/db/schema";
import { isValidEmail, normalizeEmail } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Returns whether an email has already submitted the recruitment test. */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("email") ?? "";
  if (!isValidEmail(raw)) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }
  try {
    const email = normalizeEmail(raw);
    const rows = await db
      .select({ id: testResults.id })
      .from(testResults)
      .where(eq(testResults.candidateEmail, email))
      .limit(1);
    return NextResponse.json({ taken: !!rows[0] });
  } catch (err) {
    console.error("[api/recrutement/check]", err);
    return NextResponse.json({ error: "Vérification impossible." }, { status: 500 });
  }
}
