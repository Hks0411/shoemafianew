import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "sm_admin";
const MAX_AGE = 60 * 60 * 24 * 7;

type SessionPayload = {
  adminId: string;
  email: string;
  exp: number;
};

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 16) return null;
  return value;
}

function sign(data: string) {
  const key = secret();
  if (!key) throw new Error("ADMIN_SESSION_SECRET must be set to a long random value");
  return createHmac("sha256", key).update(data).digest("base64url");
}

export function encodeSession(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodeSession(token: string | undefined | null): SessionPayload | null {
  if (!token || !secret()) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setAdminSession(adminId: string, email: string) {
  const token = encodeSession({
    adminId,
    email,
    exp: Date.now() + MAX_AGE * 1000,
  });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getAdminSession() {
  const jar = await cookies();
  return decodeSession(jar.get(COOKIE)?.value);
}
