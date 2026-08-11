import crypto from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export type JwtUser = { sub: string; email: string; role: "USER" | "DESIGNER" | "ADMIN" };

export const refreshCookieName = "pro_studio_refresh";

const accessOptions: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"] };
const refreshOptions: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"] };

export function signAccessToken(user: JwtUser) {
  return jwt.sign(user, env.JWT_ACCESS_SECRET, accessOptions);
}

export function signRefreshToken(user: JwtUser) {
  return jwt.sign({ sub: user.sub, tokenUse: "refresh" }, env.JWT_REFRESH_SECRET, refreshOptions);
}

export function verifyAccessToken(token: string): JwtUser {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtUser;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string; tokenUse: "refresh" };
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function setRefreshCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(refreshCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function clearRefreshCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(refreshCookieName);
}
