export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function TemplateDetailPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  const template = await prisma.template.findUnique({ where: { id: templateId } });
  if (!template) notFound();
  return <main className="min-h-screen bg-studio-bg p-8"><h1 className="font-display text-4xl">{template.name}</h1><p className="mt-2 text-studio-secondaryText">{template.description}</p></main>;
}
