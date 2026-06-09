import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardAdmin } from "@/lib/guard";
import { getSurveySettings, setAdminPassword, setSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;
  return NextResponse.json(await getSurveySettings());
}

const schema = z.object({
  orgName: z.string().trim().min(1).max(120).optional(),
  title: z.string().trim().min(1).max(160).optional(),
  year: z.string().trim().min(1).max(20).optional(),
  intro: z.string().trim().max(2000).optional(),
  enabled: z.boolean().optional(),
  newPassword: z.string().min(4).max(200).optional(),
});

export async function PUT(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  const d = parsed.data;

  if (d.orgName !== undefined) await setSetting("org_name", d.orgName);
  if (d.title !== undefined) await setSetting("survey_title", d.title);
  if (d.year !== undefined) await setSetting("survey_year", d.year);
  if (d.intro !== undefined) await setSetting("survey_intro", d.intro);
  if (d.enabled !== undefined) await setSetting("survey_enabled", d.enabled);
  if (d.newPassword) await setAdminPassword(d.newPassword);

  return NextResponse.json({ ok: true, settings: await getSurveySettings() });
}
