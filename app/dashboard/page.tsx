"use client";

import { useEffect, useState } from "react";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CreateDesignModal } from "@/components/dashboard/CreateDesignModal";
import { ProjectCard, type ProjectCardData } from "@/components/dashboard/ProjectCard";
import { api } from "@/lib/client/api";

export default function DashboardPage() {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectCardData[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api<ProjectCardData[]>("/api/projects").then(setProjects).catch(() => setProjects([]));
  }, []);

  const filtered = projects.filter((project) => project.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <main className="min-h-screen bg-studio-bg">
      <header className="flex h-16 items-center justify-between border-b border-studio-border bg-studio-secondary px-6">
        <div>
          <h1 className="font-display text-2xl">Pro Studio</h1>
          <p className="font-mono text-xs text-studio-muted">Sports Content Creation</p>
        </div>
        <Button variant="primary" onClick={() => setOpen(true)}><Plus size={18} />Create new design</Button>
      </header>
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Recent designs</h2>
            <p className="text-sm text-studio-secondaryText">Projects, templates, favorites, shared work, and trash.</p>
          </div>
          <div className="flex w-full max-w-md gap-2">
            <div className="relative flex-1"><Search className="absolute left-3 top-3 text-studio-muted" size={17} /><Input className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects" /></div>
            <Button size="icon"><SlidersHorizontal size={18} /></Button>
          </div>
        </div>
        {filtered.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{filtered.map((project) => <ProjectCard key={project.id} project={project} />)}</div>
        ) : (
          <div className="flex min-h-80 items-center justify-center border border-dashed border-studio-border bg-studio-panel">
            <div className="text-center"><p className="font-display text-2xl text-studio-secondaryText">No designs yet</p><Button className="mt-4" variant="primary" onClick={() => setOpen(true)}>Create first design</Button></div>
          </div>
        )}
      </section>
      <CreateDesignModal open={open} onClose={() => setOpen(false)} />
    </main>
  );
}
