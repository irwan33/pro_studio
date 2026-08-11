import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, ok, fail } from "@/lib/api/response";
import { registerSchema } from "@/lib/validations/auth";
import { hashPassword } from "@/lib/auth/password";
import { hashToken, setRefreshCookie, signAccessToken, signRefreshToken } from "@/lib/auth/tokens";

export async function POST(request: NextRequest) {
  try {
    const input = registerSchema.parse(await request.json());
    const exists = await prisma.user.findUnique({ where: { email: input.email } });
    if (exists) return fail("Email is already registered", 409, "VALIDATION_ERROR");
    const user = await prisma.user.create({ data: { name: input.name, email: input.email, passwordHash: await hashPassword(input.password) } });
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    await prisma.refreshToken.create({ data: { userId: user.id, tokenHash: hashToken(refreshToken), expiresAt: new Date(Date.now() + 30 * 86400_000) } });
    await setRefreshCookie(refreshToken);
    return ok({ accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
