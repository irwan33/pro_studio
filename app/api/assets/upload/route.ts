import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { handleApiError, ok } from "@/lib/api/response";
import { storage } from "@/lib/storage/storage";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("Missing file");
    const bytes = Buffer.from(await file.arrayBuffer());
    const uploaded = await storage.uploadFile({ filename: file.name, mimeType: file.type, bytes });
    const asset = await prisma.asset.create({ data: { userId: user.id, name: file.name, type: file.type.includes("svg") ? "SVG" : "IMAGE", mimeType: file.type, url: uploaded.url, thumbnailUrl: uploaded.url, fileSize: bytes.byteLength } });
    return ok(asset, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
