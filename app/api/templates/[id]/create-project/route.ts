import { prisma } from "@/lib/db";
import { toPrismaJson } from "@/lib/db-json";
import { requireUser } from "@/lib/auth/session";
import { handleApiError, ok } from "@/lib/api/response";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const template = await prisma.template.findUnique({ where: { id: (await params).id } });
    if (!template) throw new Error("NOT_FOUND");
    const project = await prisma.project.create({ data: { userId: user.id, title: template.name, slug: template.slug + "-" + Date.now(), width: template.width, height: template.height, sceneJson: toPrismaJson(template.sceneJson), thumbnailUrl: template.thumbnailUrl } });
    return ok(project, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
