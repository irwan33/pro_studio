import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyAccessToken } from "@/lib/auth/tokens";

export async function getCurrentUser() {
  const headerStore = await headers();
  const authHeader = headerStore.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!bearer) return null;
  try {
    const payload = verifyAccessToken(bearer);
    return prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, avatarUrl: true, role: true, createdAt: true }
    });
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}
