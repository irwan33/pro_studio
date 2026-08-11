"use client";

import { Copy, Crop, FlipHorizontal2, Maximize2, Sparkles, Trash2 } from "lucide-react";
import { ToolbarButton } from "@/components/editor/ToolbarButton";
import { ToolbarDivider } from "@/components/editor/ToolbarDivider";
import { TransparencyPopover } from "@/components/editor/TransparencyPopover";
import { PositionPanelButton } from "@/components/editor/position/PositionPanelButton";
import { ImageReplaceButton } from "@/components/editor/ImageReplaceButton";
import { emitStudioAction } from "@/lib/editor/actions";
import { useEditorStore } from "@/store/editorStore";
import type { EditorElement } from "@/lib/editor/types";

export function ImageToolbar({ element }: { element: EditorElement }) {
  const opacity = Number(element.opacity ?? 1);
  const activePanel = useEditorStore((state) => state.activePanel);
  const setActivePanel = useEditorStore((state) => state.setActivePanel);

  // The filters panel only edits image elements, and a locked element cannot be
  // modified, so the button follows the same rule as the rest of the toolbar.
  const filtersDisabled = element.type !== "image" || Boolean(element.locked);
  const filtersOpen = activePanel === "filters";

  return (
    <div className="flex items-center gap-1 overflow-x-auto px-2 py-1 scrollbar-none">
      <ImageReplaceButton element={element} />

      <ToolbarButton
        icon={<Maximize2 size={15} />}
        label="Cover"
        disabled={filtersDisabled}
        onClick={() => emitStudioAction({ action: "cover-canvas", payload: { elementId: element.id } })}
        tooltip="Cover canvas"
      />

      <ToolbarDivider />

      <ToolbarButton
        icon={<Sparkles size={15} />}
        label="Filters"
        active={filtersOpen}
        disabled={filtersDisabled}
        // Clicking again returns to the element library, matching how the other
        // sidebar panels toggle.
        onClick={() => setActivePanel(filtersOpen ? "elements" : "filters")}
        tooltip="Image Filters"
      />

      <ToolbarButton
        icon={<Crop size={15} />}
        label="Crop"
        onClick={() => emitStudioAction("start-crop")}
        tooltip="Crop Image"
      />

      <ToolbarDivider />

      <ToolbarButton
        icon={<FlipHorizontal2 size={15} />}
        label="Flip"
        onClick={() => emitStudioAction("flip")}
        tooltip="Flip Image"
      />

      <ToolbarDivider />

      <TransparencyPopover
        opacity={opacity}
        onChange={(op) => emitStudioAction({ action: "update-active", payload: { opacity: op } })}
      />
      <PositionPanelButton />

      <ToolbarDivider />

      <ToolbarButton
        icon={<Copy size={15} />}
        onClick={() => emitStudioAction("duplicate")}
        tooltip="Duplicate"
      />
      <ToolbarButton
        icon={<Trash2 size={15} />}
        onClick={() => emitStudioAction("delete")}
        tooltip="Delete"
        className="text-red-600 hover:bg-red-50"
      />
    </div>
  );
}
