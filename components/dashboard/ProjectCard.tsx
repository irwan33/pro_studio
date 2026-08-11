import { useState } from "react";
import Link from "next/link";
import { Copy, Download, MoreVertical, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export type ProjectCardData = {
  id: string;
  title: string;
  width: number;
  height: number;
  thumbnailUrl?: string | null;
  isFavorite: boolean;
  updatedAt: string | Date;
};

export function ProjectCard({ project }: { project: ProjectCardData }) {
  const [status, setStatus] = useState<"loading" | "error" | "ready">(project.thumbnailUrl ? "loading" : "error");
  const aspectPadding = project.height > 0 ? (project.height / project.width) * 100 : 125;

  return (
    <div className="border border-studio-border bg-studio-panel">
      <Link
        href={"/editor/" + project.id}
        className="relative block w-full overflow-hidden bg-[#0b0c0b]"
        style={{ paddingBottom: aspectPadding + "%" }}
      >
        {project.thumbnailUrl ? (
          <>
            {status === "loading" && (
              <div className="absolute inset-0 animate-pulse bg-studio-elevated" aria-label="Loading thumbnail" />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={project.thumbnailUrl}
              alt={project.title}
              className={
                "absolute inset-0 h-full w-full object-cover " +
                (status === "ready" ? "opacity-100" : "opacity-0")
              }
              onLoad={() => setStatus("ready")}
              onError={() => setStatus("error")}
            />
          </>
        ) : null}
        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center border border-dashed border-studio-border font-display text-3xl text-studio-muted">
            PRO
          </div>
        )}
      </Link>
      <div className="space-y-3 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="line-clamp-1 font-semibold">{project.title}</h3>
            <p className="font-mono text-xs text-studio-muted">{project.width} x {project.height}px</p>
          </div>
          <Star size={16} className={project.isFavorite ? "fill-studio-accent text-studio-accent" : "text-studio-muted"} />
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline"><Copy size={14} />Duplicate</Button>
          <Button size="sm" variant="ghost"><Download size={14} /></Button>
          <Button size="sm" variant="ghost"><Trash2 size={14} /></Button>
          <Button size="sm" variant="ghost"><MoreVertical size={14} /></Button>
        </div>
      </div>
    </div>
  );
}
