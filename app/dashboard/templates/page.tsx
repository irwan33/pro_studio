import { seedTemplates } from "@/lib/editor/templates";

export default function TemplatesPage() {
  return (
    <main className="min-h-screen bg-studio-bg p-8">
      <h1 className="font-display text-3xl">Templates</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {seedTemplates.map((template) => (
          <div key={template.slug} className="border border-studio-border bg-studio-panel p-4">
            <div className="aspect-[4/5] bg-black p-4 font-display text-3xl text-studio-accent">{template.category}</div>
            <h2 className="mt-3 font-semibold">{template.name}</h2>
            <p className="font-mono text-xs text-studio-muted">{template.width} x {template.height}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
