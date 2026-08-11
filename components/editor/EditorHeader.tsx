"use client";

import Link from "next/link";
import { ArrowLeft, Download, Redo2, Save, Share2, Undo2, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useEditorStore } from "@/store/editorStore";
import { emitStudioAction } from "@/lib/editor/actions";
import type { EditorProject } from "@/components/editor/EditorShell";

export function EditorHeader({ project, onShare, onExport }: { project: EditorProject; onShare: () => void; onExport: () => void }) {
  const { width, height, saveStatus } = useEditorStore();
  const status = saveStatus === "saving" ? "Saving..." : saveStatus === "failed" ? "Save failed" : "Saved just now";
  return (
    <header className="flex h-[76px] items-center justify-between gap-3 border-b border-studio-border bg-studio-secondary px-5 shadow-sm">
      <div className="flex min-w-0 items-center gap-4">
        <Link href="/dashboard" className="shrink-0 text-studio-secondaryText hover:text-studio-accent"><ArrowLeft size={26} /></Link>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2 text-xl font-black"><span className="whitespace-nowrap">Pro Studio</span><span className="text-studio-muted">/</span><input className="w-[min(38vw,420px)] min-w-0 truncate bg-transparent font-black outline-none" defaultValue={project.title} /></div>
          <p className="font-mono text-sm text-studio-secondaryText">{width} x {height} px <span className="px-2">.</span> {status}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Undo" onClick={() => emitStudioAction("undo")}><Undo2 size={18} /></Button>
        <Button variant="ghost" size="icon" aria-label="Redo" onClick={() => emitStudioAction("redo")}><Redo2 size={18} /></Button>
        <Button onClick={() => emitStudioAction("save")}><Save size={18} />Save</Button>
        <Button onClick={onShare}><Share2 size={18} />Share</Button>
        <Button variant="primary" onClick={onExport}><Download size={18} />Download</Button>
        <div className="h-8 w-px bg-studio-border" />
        <Button variant="ghost" size="icon" aria-label="Profile"><UserCircle size={25} /></Button>
      </div>
    </header>
  );
}
