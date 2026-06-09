import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";
import { verifyAdminPassword } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({ password: z.string().min(1).max(200) });

export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Mot de passe requis." }, { status: 400 });
    }
    const ok = await verifyAdminPassword(parsed.data.password);
    if (!ok) {
      return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
    }
    const token = await createSessionToken();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return res;
  } catch (err) {
    console.error("[api/admin/login]", err);
    return NextResponse.json({ error: "Erreur de connexion." }, { status: 500 });
  }
}
