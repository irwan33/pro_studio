import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { handleApiError, ok } from "@/lib/api/response";
import { clearRefreshCookie, hashToken, refreshCookieName } from "@/lib/auth/tokens";

export async function POST() {
  try {
    const token = (await cookies()).get(refreshCookieName)?.value;
    if (token) await prisma.refreshToken.updateMany({ where: { tokenHash: hashToken(token) }, data: { revokedAt: new Date() } });
    await clearRefreshCookie();
    return ok({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
