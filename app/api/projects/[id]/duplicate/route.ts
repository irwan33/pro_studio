import { prisma } from "@/lib/db";
import { toPrismaJson } from "@/lib/db-json";
import { requireUser } from "@/lib/auth/session";
import { handleApiError, ok } from "@/lib/api/response";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const project = await prisma.project.findFirst({ where: { id, userId: user.id } });
    if (!project) throw new Error("NOT_FOUND");
    const copy = await prisma.project.create({ data: { userId: user.id, title: project.title + " Copy", slug: project.slug + "-copy-" + Date.now(), width: project.width, height: project.height, sceneJson: toPrismaJson(project.sceneJson), thumbnailUrl: project.thumbnailUrl } });
    return ok(copy, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
