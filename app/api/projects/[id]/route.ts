import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { updateProjectSchema } from "@/lib/validations/project";

async function ownProject(id: string, userId: string) {
  const project = await prisma.project.findFirst({ where: { id, userId } });
  if (!project) throw new Error("NOT_FOUND");
  return project;
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { const user = await requireUser(); return ok(await ownProject((await params).id, user.id)); } catch (error) { return handleApiError(error); }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await ownProject(id, user.id);
    const input = updateProjectSchema.parse(await request.json());
    return ok(await prisma.project.update({ where: { id }, data: input }));
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await ownProject(id, user.id);
    return ok(await prisma.project.update({ where: { id }, data: { deletedAt: new Date(), status: "TRASHED" } }));
  } catch (error) { return handleApiError(error); }
}
