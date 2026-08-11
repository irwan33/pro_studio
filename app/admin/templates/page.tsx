export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";

export default async function AdminTemplatesPage() {
  const templates = await prisma.template.findMany();
  return <main className="min-h-screen bg-studio-bg p-8"><h1 className="font-display text-3xl">Templates</h1><div className="mt-6 grid gap-3">{templates.map((t) => <div key={t.id} className="border border-studio-border bg-studio-panel p-4"><h2>{t.name}</h2><p className="font-mono text-xs text-studio-muted">{t.category} / {t.isPublished ? "Published" : "Draft"}</p></div>)}</div></main>;
}
