"use client";

import { Replace } from "lucide-react";
import { toast } from "sonner";
import { ToolbarButton } from "@/components/editor/ToolbarButton";
import { EDITOR_UI_ATTRIBUTE } from "@/lib/editor/focus-mode";
import { useEditorStore } from "@/store/editorStore";
import type { EditorElement } from "@/lib/editor/types";

/**
 * "Replace" control for a selected image.
 *
 * Clicking Replace opens the Images sidebar panel. The user picks a new source
 * from the library; the element keeps its id, layer order, geometry, rotation,
 * opacity, visibility, lock state and frame, and the swap produces exactly one
 * undo entry.
 */
export function ImageReplaceButton({
  element,
  variant = "toolbar"
}: {
  element: EditorElement;
  variant?: "toolbar" | "panel";
}) {
  const setActivePanel = useEditorStore((s) => s.setActivePanel);
  const setPendingReplaceId = useEditorStore((s) => s.setPendingReplaceId);
  const pendingReplaceId = useEditorStore((s) => s.pendingReplaceId);

  const disabled = element.type !== "image" || Boolean(element.locked);
  const armed = pendingReplaceId === element.id;

  function browseLibrary() {
    setPendingReplaceId(element.id);
    setActivePanel("images");
    toast.info("Pick a replacement from the image library");
  }

  return (
    <div className="relative inline-block" {...{ [EDITOR_UI_ATTRIBUTE]: "" }}>
      {variant === "toolbar" ? (
        <ToolbarButton
          icon={<Replace size={15} />}
          label="Replace"
          active={armed}
          disabled={disabled}
          onClick={browseLibrary}
          tooltip={element.locked ? "Unlock the image to replace it" : "Replace image"}
        />
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={browseLibrary}
          title={element.locked ? "Unlock the image to replace it" : "Replace image"}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-studio-border bg-studio-elevated px-4 py-2 text-sm font-semibold text-studio-text transition hover:bg-studio-accentHover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Replace size={16} />
          Replace Image
        </button>
      )}
    </div>
  );
}
