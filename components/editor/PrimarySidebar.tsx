"use client";

import { CloudUpload, FileType2, Image, LayoutTemplate, Shapes, Sparkles, Type, Wallpaper, Palette } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { emitStudioAction } from "@/lib/editor/actions";
import { EDITOR_UI_ATTRIBUTE } from "@/lib/editor/focus-mode";
import type { EditorPanel } from "@/lib/editor/types";

type SidebarItem = readonly [EditorPanel, string, typeof FileType2];

// Standalone Stickers and Layers menus were removed: sticker-like elements are
// still supported in saved scenes, and layer ordering lives inside Position.
const items: readonly SidebarItem[] = [
  ["document", "Document", FileType2],
  ["templates", "Templates", LayoutTemplate],
  ["elements", "Elements", Shapes],
  ["uploads", "Uploads", CloudUpload],
  ["images", "Images", Image],
  ["text", "Text", Type],
  ["shapes", "Shapes", Wallpaper],
  ["gradients", "Gradients", Palette],
  ["filters", "Filters", Sparkles]
];

export function PrimarySidebar() {
  const active = useEditorStore((s) => s.activePanel);
  const setActive = useEditorStore((s) => s.setActivePanel);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);

  function activatePanel(id: EditorPanel) {
    if (id === "text") {
      setSelectedIds([]);
      emitStudioAction("clear-selection");
    }
    setActive(id);
  }

  return (
    <aside {...{ [EDITOR_UI_ATTRIBUTE]: "" }} className="mx-2 mt-3 mb-3 h-[calc(100%-1.75rem)] self-start overflow-y-auto rounded-[28px] border border-studio-border bg-studio-secondary py-3 px-1 shadow-[0_4px_20px_rgba(0,0,0,0.08)] scrollbar-thin">
      {items.map(([id, label, Icon]) => (
        <button key={id} onClick={() => activatePanel(id)} className={"relative flex h-[56px] w-full flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold " + (active === id ? "bg-studio-elevated text-studio-accent shadow-inner" : "text-studio-secondaryText hover:bg-studio-elevated hover:text-studio-text")}>
          <Icon size={20} />
          <span className="truncate px-0.5">{label}</span>
        </button>
      ))}
    </aside>
  );
}
