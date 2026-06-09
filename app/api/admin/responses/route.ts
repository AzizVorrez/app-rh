import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { responses } from "@/lib/db/schema";
import { guardAdmin } from "@/lib/guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Wipe all responses (answers cascade). Irreversible. */
export async function DELETE() {
  const denied = await guardAdmin();
  if (denied) return denied;
  await db.delete(responses);
  return NextResponse.json({ ok: true });
}
