import { SignJWT, jwtVerify } from "jose";

/**
 * Edge-safe auth primitives (JWT only — no DB, no bcrypt).
 * Safe to import from middleware. Password checks live in lib/settings.ts.
 */

export const SESSION_COOKIE = "izi_session";
const SESSION_TTL_DAYS = 7;

function getSecret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    // Falls back to a constant in dev so the app still runs; set SESSION_SECRET in prod.
    if (process.env.NODE_ENV === "production") {
      console.error("[auth] SESSION_SECRET is missing or too short in production!");
    }
    return new TextEncoder().encode("izichange-dev-insecure-secret-please-change");
  }
  return new TextEncoder().encode(s);
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_DAYS}d`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export const SESSION_MAX_AGE = SESSION_TTL_DAYS * 24 * 60 * 60;
