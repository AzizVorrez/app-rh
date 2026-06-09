import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./auth";

/** True if the current request carries a valid admin session cookie. */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/**
 * For API route handlers: returns a 401 response if not authenticated,
 * otherwise null. Usage:
 *   const denied = await guardAdmin();
 *   if (denied) return denied;
 */
export async function guardAdmin(): Promise<NextResponse | null> {
  if (await isAdmin()) return null;
  return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
}
