export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { EditorShell } from "@/components/editor/EditorShell";

export default async function EditorPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) notFound();
  return <EditorShell project={{ id: project.id, title: project.title, width: project.width, height: project.height, sceneJson: project.sceneJson, updatedAt: project.updatedAt.toISOString(), lastSavedAt: project.lastSavedAt?.toISOString() ?? null }} />;
}
