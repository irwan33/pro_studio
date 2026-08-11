import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { handleApiError, ok } from "@/lib/api/response";
import { hashToken, refreshCookieName, signAccessToken, verifyRefreshToken } from "@/lib/auth/tokens";

export async function POST() {
  try {
    const token = (await cookies()).get(refreshCookieName)?.value;
    if (!token) throw new Error("UNAUTHORIZED");
    const payload = verifyRefreshToken(token);
    const stored = await prisma.refreshToken.findFirst({ where: { userId: payload.sub, tokenHash: hashToken(token), revokedAt: null, expiresAt: { gt: new Date() } }, include: { user: true } });
    if (!stored) throw new Error("UNAUTHORIZED");
    return ok({ accessToken: signAccessToken({ sub: stored.user.id, email: stored.user.email, role: stored.user.role }) });
  } catch (error) {
    return handleApiError(error);
  }
}
