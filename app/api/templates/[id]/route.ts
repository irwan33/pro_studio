import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { toPrismaJson } from "@/lib/db-json";
import { handleApiError, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/session";
import { templateSchema } from "@/lib/validations/template";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const template = await prisma.template.findUnique({ where: { id: (await params).id } });
    if (!template) throw new Error("NOT_FOUND");
    return ok(template);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const input = templateSchema.partial().parse(await request.json());
    const { sceneJson, ...rest } = input;
    return ok(await prisma.template.update({ where: { id: (await params).id }, data: { ...rest, ...(sceneJson ? { sceneJson: toPrismaJson(sceneJson) } : {}) } }));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    return ok(await prisma.template.delete({ where: { id: (await params).id } }));
  } catch (error) {
    return handleApiError(error);
  }
}
