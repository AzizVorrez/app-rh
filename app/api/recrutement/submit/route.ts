import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { testResults } from "@/lib/db/schema";
import { scoreTest } from "@/lib/recruitment";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  domain: z.enum(["ops", "com", "cyber", "dev"]),
  answers: z.array(z.number().int().nullable()).max(60),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides." }, { status: 400 });
    }
    const { name, domain, answers } = parsed.data;

    // Score authoritatively on the server from the submitted answers.
    const score = scoreTest(domain, answers);

    await db.insert(testResults).values({
      candidateName: name,
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
    console.error("[api/recrutement/submit]", err);
    return NextResponse.json({ error: "Échec de l'enregistrement." }, { status: 500 });
  }
}
