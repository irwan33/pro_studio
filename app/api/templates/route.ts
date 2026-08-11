import { NextRequest } from "next/server";
import slugify from "slugify";
import { prisma } from "@/lib/db";
import { toPrismaJson } from "@/lib/db-json";
import { handleApiError, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/session";
import { templateSchema } from "@/lib/validations/template";

export async function GET() {
  try {
    return ok(await prisma.template.findMany({ where: { isPublished: true }, orderBy: { updatedAt: "desc" } }));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const input = templateSchema.parse(await request.json());
    const { sceneJson, ...rest } = input;
    const template = await prisma.template.create({ data: { ...rest, sceneJson: toPrismaJson(sceneJson), slug: slugify(input.name, { lower: true, strict: true }) + "-" + Date.now(), createdById: user.id } });
    return ok(template, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
