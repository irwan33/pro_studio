import { NextRequest } from "next/server";
import slugify from "slugify";
import { prisma } from "@/lib/db";
import { toPrismaJson } from "@/lib/db-json";
import { handleApiError, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { createProjectSchema } from "@/lib/validations/project";
import { emptyEditorScene } from "@/lib/editor/scene";

export async function GET() {
  try {
    const user = await requireUser();
    const projects = await prisma.project.findMany({ where: { userId: user.id, deletedAt: null }, orderBy: { updatedAt: "desc" } });
    return ok(projects);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const input = createProjectSchema.parse(await request.json());
    const template = input.templateId ? await prisma.template.findUnique({ where: { id: input.templateId } }) : null;
    const scene = template?.sceneJson ?? emptyEditorScene(input.width, input.height);
    const project = await prisma.project.create({
      data: { userId: user.id, title: input.title, slug: slugify(input.title, { lower: true, strict: true }) + "-" + Date.now(), width: template?.width ?? input.width, height: template?.height ?? input.height, sceneJson: toPrismaJson(scene), lastSavedAt: new Date() }
    });
    return ok(project, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
