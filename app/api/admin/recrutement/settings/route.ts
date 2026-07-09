import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardAdmin } from "@/lib/guard";
import { getRecruitmentSettings, setSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;
  return NextResponse.json(await getRecruitmentSettings());
}

const schema = z.object({
  durationBlock1: z.number().int().min(5).max(600).optional(),
  durationBlock23: z.number().int().min(5).max(600).optional(),
  passThreshold: z.number().int().min(1).max(100).optional(),
});

export async function PUT(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  const d = parsed.data;

  if (d.durationBlock1 !== undefined) await setSetting("recruitment_duration_block1", d.durationBlock1);
  if (d.durationBlock23 !== undefined) await setSetting("recruitment_duration_block23", d.durationBlock23);
  if (d.passThreshold !== undefined) await setSetting("recruitment_pass_threshold", d.passThreshold);

  return NextResponse.json({ ok: true, settings: await getRecruitmentSettings() });
}
