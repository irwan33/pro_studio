export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await prisma.shareLink.findUnique({ where: { token }, include: { project: true } });
  if (!link || (link.expiresAt && link.expiresAt < new Date())) notFound();
  return (
    <main className="flex min-h-screen flex-col items-center bg-studio-bg p-8">
      <div className="mb-4 flex w-full max-w-5xl items-center justify-between"><h1 className="font-display text-3xl">{link.project.title}</h1><a className="border border-studio-accent bg-studio-accent px-4 py-2 font-semibold text-studio-bg" href={"/api/share/" + token}>Download</a></div>
      <pre className="w-full max-w-5xl overflow-auto border border-studio-border bg-studio-panel p-4 text-xs">{JSON.stringify(link.project.sceneJson, null, 2)}</pre>
    </main>
  );
}
