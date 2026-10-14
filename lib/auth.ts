import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@/models/User";

const COOKIE = "societysetu_session";
function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) throw new Error("JWT_SECRET must be at least 32 characters.");
  return new TextEncoder().encode(value);
}

export type Session = { userId: string; name: string; email: string; role: UserRole; building?: string; flat?: string };

export async function createSession(session: Session) {
  const token = await new SignJWT(session as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
}

export async function getSession(): Promise<Session | null> {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as Session;
  } catch { return null; }
}

export async function requireApiSession(req?: NextRequest): Promise<Session | null> {
  try {
    const token = req?.cookies.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as Session;
  } catch { return null; }
}

export function unauthorized() {
  return NextResponse.json({ error: "લોગિન જરૂરી છે / Login required" }, { status: 401 });
}
