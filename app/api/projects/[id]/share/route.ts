import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { handleApiError, ok } from "@/lib/api/response";
import { env } from "@/lib/env";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const project = await prisma.project.findFirst({ where: { id, userId: user.id } });
    if (!project) throw new Error("NOT_FOUND");
    const token = crypto.randomBytes(24).toString("hex");
    const link = await prisma.shareLink.create({ data: { projectId: id, token, permission: "VIEW" } });
    return ok({ ...link, url: env.NEXT_PUBLIC_APP_URL + "/share/" + token });
  } catch (error) { return handleApiError(error); }
}
