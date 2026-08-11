export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  return <main className="min-h-screen bg-studio-bg p-8"><h1 className="font-display text-3xl">Users</h1><div className="mt-6 border border-studio-border">{users.map((u) => <div key={u.id} className="grid grid-cols-3 border-b border-studio-border p-3"><span>{u.name}</span><span>{u.email}</span><span className="font-mono text-studio-accent">{u.role}</span></div>)}</div></main>;
}
