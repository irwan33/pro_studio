"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { EditorHeader } from "@/components/editor/EditorHeader";
import { PrimarySidebar } from "@/components/editor/PrimarySidebar";
import { AssetPanel } from "@/components/editor/AssetPanel";
import { ContextualToolbar } from "@/components/editor/ContextualToolbar";
import { ShareModal } from "@/components/editor/ShareModal";
import { ExportModal } from "@/components/editor/ExportModal";
import { useEditorStore } from "@/store/editorStore";
import { isChromeVisible } from "@/lib/editor/focus-mode";
import { api } from "@/lib/client/api";
import { deserializeEditorState } from "@/lib/editor/scene";
import { generateThumbnailFromStage } from "@/lib/editor/thumbnail";

/**
 * react-konva resolves konva's node build when server rendered, and a Konva
 * stage needs a real DOM container, so the canvas is loaded client-side only.
 */
const CanvasWorkspace = dynamic(
  () => import("@/components/editor/CanvasWorkspace").then((module) => module.CanvasWorkspace),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-studio-muted">Loading canvas...</div>
    )
  }
);

export type EditorProject = {
  id: string;
  title: string;
  width: number;
  height: number;
  sceneJson: unknown;
  updatedAt: string;
  lastSavedAt: string | null;
};

export function EditorShell({ project }: { project: EditorProject }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const loadScene = useEditorStore((s) => s.loadScene);
  const setSaveStatus = useEditorStore((s) => s.setSaveStatus);
  const markSaved = useEditorStore((s) => s.markSaved);
  const dirty = useEditorStore((s) => s.dirty);
  const elements = useEditorStore((s) => s.elements);
  const width = useEditorStore((s) => s.width);
  const height = useEditorStore((s) => s.height);
  const background = useEditorStore((s) => s.background);
  const focusMode = useEditorStore((s) => s.isCanvasFocusMode);

  useEffect(() => {
    const recoveryKey = "pro-studio-recovery-" + project.id + "-" + project.updatedAt;
    const legacyKey = "pro-studio-recovery-" + project.id;
    localStorage.removeItem(legacyKey);
    const local = localStorage.getItem(recoveryKey);
    loadScene(
      deserializeEditorState(local ? JSON.parse(local) : project.sceneJson, project.width, project.height),
      project.id
    );
  }, [project, loadScene]);

  // Debounced autosave. `getScene()` serialises the current store state, so the
  // effect only needs to react to the document parts that can change.
  useEffect(() => {
    if (!dirty) return;
    const recoveryKey = "pro-studio-recovery-" + project.id + "-" + project.updatedAt;
    const handle = window.setTimeout(async () => {
      const state = useEditorStore.getState();
      const scene = state.getScene();
      const thumbnailUrl = generateThumbnailFromStage({ width: state.width, height: state.height });
      setSaveStatus("saving");
      localStorage.setItem(recoveryKey, JSON.stringify(scene));
      try {
        await api("/api/projects/" + project.id + "/scene", { method: "PUT", body: { sceneJson: scene, thumbnailUrl } });
        markSaved();
      } catch {
        setSaveStatus("failed");
      }
    }, 1800);
    return () => window.clearTimeout(handle);
  }, [dirty, elements, width, height, background, project.id, project.updatedAt, setSaveStatus, markSaved]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-studio-bg text-studio-text">
      {/*
        Focus mode clears the space around the artboard. It hides only the
        content panel and the contextual toolbar: the navigation rail and the
        main header stay put so the editor never loses its frame. Visibility is
        driven by store state rather than DOM style mutation, so React remains
        the single source of truth.
      */}
      <EditorHeader project={project} onShare={() => setShareOpen(true)} onExport={() => setExportOpen(true)} />
      <div className="relative flex-1 min-h-0">
        {isChromeVisible("contextual-toolbar", focusMode) && <ContextualToolbar />}
        <div
          className={
            "grid h-full gap-0 p-3 pt-0 transition-[grid-template-columns] duration-200 ease-out motion-reduce:transition-none " +
            "grid-cols-[84px_1fr]"
          }
        >
          <PrimarySidebar />
          <main className="relative min-w-0 overflow-hidden workspace-grid">
            <CanvasWorkspace projectId={project.id} />
          </main>
        </div>
        {isChromeVisible("content-panel", focusMode) && <AssetPanel />}
      </div>
      <ShareModal projectId={project.id} open={shareOpen} onClose={() => setShareOpen(false)} />
      <ExportModal projectId={project.id} open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}
