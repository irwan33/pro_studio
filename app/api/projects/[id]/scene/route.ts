import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { toPrismaJson } from "@/lib/db-json";
import { handleApiError, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { updateSceneSchema } from "@/lib/validations/project";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const project = await prisma.project.findFirst({ where: { id, userId: user.id } });
    if (!project) throw new Error("NOT_FOUND");
    const input = updateSceneSchema.parse(await request.json());
    const updated = await prisma.project.update({ where: { id }, data: { sceneJson: toPrismaJson(input.sceneJson), thumbnailUrl: input.thumbnailUrl, lastSavedAt: new Date() } });
    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
