import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { testResults } from "@/lib/db/schema";
import { scoreTest } from "@/lib/recruitment-bank";
import { getRecruitmentSettings } from "@/lib/settings";
import { isValidEmail, normalizeEmail } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  // Même règle que le client (isValidEmail) — cohérence welcome ↔ submit, pas de 400 après le test.
  email: z.string().trim().max(160).refine(isValidEmail, "Email invalide."),
  domain: z.enum(["ops", "graphiste", "crm", "social", "cyber", "dev"]),
  answers: z.array(z.number().int().nullable()).max(300),
  // Snapshot : ids des questions réellement vues par le candidat, dans l'ordre affiché.
  questionIds: z.array(z.string().uuid()).max(300).optional(),
});

const ALREADY = "Vous avez déjà passé ce test avec cet email.";

export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides." }, { status: 400 });
    }
    const { name, domain, answers } = parsed.data;
    const email = normalizeEmail(parsed.data.email);

    // One submission per email.
    const existing = await db
      .select({ id: testResults.id })
      .from(testResults)
      .where(eq(testResults.candidateEmail, email))
      .limit(1);
    if (existing[0]) {
      return NextResponse.json({ error: ALREADY }, { status: 409 });
    }

    // Score authoritatively on the server from the submitted answers.
    const { passThreshold, enabled } = await getRecruitmentSettings();
    if (!enabled) {
      return NextResponse.json({ error: "Le test de recrutement est actuellement fermé." }, { status: 403 });
    }
    const score = await scoreTest(domain, answers, passThreshold, parsed.data.questionIds);

    await db.insert(testResults).values({
      candidateName: name,
      candidateEmail: email,
      domain,
      block1: score.block1,
      block2: score.block2,
      block3: score.block3,
      total: score.total,
      maxScore: score.max,
      status: score.status,
    });

    return NextResponse.json({ ok: true, score });
  } catch (err) {
    // Unique-violation safety net for concurrent submissions.
    if (err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "23505") {
      return NextResponse.json({ error: ALREADY }, { status: 409 });
    }
    console.error("[api/recrutement/submit]", err);
    return NextResponse.json({ error: "Échec de l'enregistrement." }, { status: 500 });
  }
}
