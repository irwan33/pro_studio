import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, ok, fail } from "@/lib/api/response";
import { loginSchema } from "@/lib/validations/auth";
import { verifyPassword } from "@/lib/auth/password";
import { hashToken, setRefreshCookie, signAccessToken, signRefreshToken } from "@/lib/auth/tokens";
import { assertRateLimit } from "@/lib/auth/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const input = loginSchema.parse(await request.json());
    assertRateLimit(input.email);
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) return fail("Invalid email or password", 401, "UNAUTHORIZED");
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    await prisma.refreshToken.create({ data: { userId: user.id, tokenHash: hashToken(refreshToken), expiresAt: new Date(Date.now() + 30 * 86400_000) } });
    await setRefreshCookie(refreshToken);
    return ok({ accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMITED") return fail("Too many login attempts", 429, "RATE_LIMITED");
    return handleApiError(error);
  }
}
