"use client";

import { useEditorStore } from "@/store/editorStore";
import { useSelectedElement } from "@/store/editorSelectors";
import { TextContextualToolbar } from "@/components/editor/TextContextualToolbar";
import { ImageToolbar } from "@/components/editor/ImageToolbar";
import { ShapeToolbar } from "@/components/editor/ShapeToolbar";
import { Copy, Trash2, BringToFront, Ungroup } from "lucide-react";
import { ToolbarButton } from "@/components/editor/ToolbarButton";
import { ToolbarDivider } from "@/components/editor/ToolbarDivider";
import { PositionPanelButton } from "@/components/editor/position/PositionPanelButton";
import { TransparencyPopover } from "@/components/editor/TransparencyPopover";
import { EDITOR_UI_ATTRIBUTE } from "@/lib/editor/focus-mode";
import { emitStudioAction } from "@/lib/editor/actions";

function emit(action: "bring-front" | "duplicate" | "delete" | "ungroup") {
  emitStudioAction(action);
}

export function ContextualToolbar() {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const selected = useSelectedElement();

  if (selectedIds.length === 0 || !selected) {
    return null;
  }

  // Multiple selection common controls
  const baseClass =
    "absolute left-1/2 top-3 z-20 flex h-10 -translate-x-1/2 items-center gap-1 rounded-xl border border-gray-200 bg-white px-2 shadow-[0_2px_10px_rgba(22,24,35,0.08)] max-w-[95vw] overflow-x-auto scrollbar-none";

  if (selectedIds.length > 1) {
    const firstSelected = useEditorStore.getState().elements.find((el) => selectedIds.includes(el.id));
    const opacity = firstSelected ? Number(firstSelected.opacity ?? 1) : 1;
    return (
      <div
        onMouseDown={(e) => e.stopPropagation()}
        {...{ [EDITOR_UI_ATTRIBUTE]: "" }}
        className={baseClass}
      >
        <span className="px-2 text-xs font-semibold text-gray-500">{selectedIds.length} items selected</span>
        <ToolbarDivider />
        <TransparencyPopover
          opacity={opacity}
          onChange={(op) => emitStudioAction({ action: "update-active", payload: { opacity: op } })}
        />
        <ToolbarDivider />
        <ToolbarButton icon={<BringToFront size={16} />} label="Position" onClick={() => emit("bring-front")} />
        <ToolbarButton icon={<Copy size={16} />} label="Duplicate" onClick={() => emit("duplicate")} />
        <ToolbarButton icon={<Trash2 size={16} />} label="Delete" onClick={() => emit("delete")} className="text-red-600 hover:bg-red-50" />
      </div>
    );
  }

  if (selected.type === "text") {
    return <TextContextualToolbar />;
  }

  if (selected.type === "group") {
    return (
      <div
        onMouseDown={(e) => e.stopPropagation()}
        {...{ [EDITOR_UI_ATTRIBUTE]: "" }}
        className={baseClass}
      >
        <ToolbarButton icon={<Ungroup size={16} />} label="Ungroup" onClick={() => emit("ungroup")} />
        <ToolbarButton icon={<Copy size={16} />} label="Duplicate" onClick={() => emit("duplicate")} />
        <ToolbarDivider />
        <TransparencyPopover opacity={Number(selected.opacity ?? 1)} onChange={(op) => emitStudioAction({ action: "update-active", payload: { opacity: op } })} />
        <ToolbarDivider />
        <PositionPanelButton />
        <ToolbarButton icon={<Trash2 size={16} />} label="Delete" onClick={() => emit("delete")} className="text-red-600 hover:bg-red-50" />
      </div>
    );
  }

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      {...{ [EDITOR_UI_ATTRIBUTE]: "" }}
      className={baseClass}
    >
      {selected.type === "image" ? (
        <ImageToolbar element={selected} />
      ) : (
        <ShapeToolbar element={selected} />
      )}
    </div>
  );
}
