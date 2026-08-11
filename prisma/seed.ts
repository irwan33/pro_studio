import { PrismaClient } from "@prisma/client";
import { toPrismaJson } from "../lib/db-json";
import { hashPassword } from "../lib/auth/password";
import { seedTemplates, typographyPresets } from "../lib/editor/templates";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@prostudio.dev" },
    update: {},
    create: { name: "Admin", email: "admin@prostudio.dev", passwordHash: await hashPassword("password123"), role: "ADMIN" }
  });
  const user = await prisma.user.upsert({
    where: { email: "user@prostudio.dev" },
    update: {},
    create: { name: "Creator", email: "user@prostudio.dev", passwordHash: await hashPassword("password123"), role: "USER" }
  });

  for (const template of seedTemplates) {
    const { accent: _accent, ...templateData } = template;
    await prisma.template.upsert({
      where: { slug: templateData.slug },
      update: { ...templateData, sceneJson: toPrismaJson(templateData.sceneJson) },
      create: { ...templateData, sceneJson: toPrismaJson(templateData.sceneJson), createdById: admin.id }
    });
  }

  const assetNames = [
    ...Array.from({ length: 20 }, (_, i) => "Sports graphic element " + (i + 1)),
    ...Array.from({ length: 8 }, (_, i) => "Sample player cutout " + (i + 1)),
    ...Array.from({ length: 6 }, (_, i) => "Stadium background " + (i + 1)),
    ...typographyPresets.map((p) => "Typography preset " + p.name)
  ];
  for (const [index, name] of assetNames.entries()) {
    const type = index < 20 ? "ELEMENT" : index < 28 ? "IMAGE" : index < 34 ? "BACKGROUND" : "ELEMENT";
    await prisma.asset.create({
      data: {
        userId: user.id,
        name,
        type,
        mimeType: "image/svg+xml",
        url: "/seed/asset-" + (index + 1) + ".svg",
        thumbnailUrl: "/seed/asset-" + (index + 1) + ".svg",
        fileSize: 512,
        metadata: { generated: true }
      }
    });
  }
}

main().finally(async () => prisma.$disconnect());
