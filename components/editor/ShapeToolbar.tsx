"use client";

import { Copy, Trash2 } from "lucide-react";
import { ToolbarButton } from "@/components/editor/ToolbarButton";
import { ToolbarDivider } from "@/components/editor/ToolbarDivider";
import { NumberInputControl } from "@/components/editor/NumberInputControl";
import { PositionPanelButton } from "@/components/editor/position/PositionPanelButton";
import { TransparencyPopover } from "@/components/editor/TransparencyPopover";
import { useEditorStore } from "@/store/editorStore";
import { emitStudioAction } from "@/lib/editor/actions";
import type { EditorElement, ShapeProperties } from "@/lib/editor/types";

const FALLBACK_FILL = "#C7FF00";

export function ShapeToolbar({ element }: { element: EditorElement }) {
  const properties = element.properties as Partial<ShapeProperties>;
  const fill = typeof properties.fill === "string" ? properties.fill : FALLBACK_FILL;
  const cornerRadius = Number(properties.cornerRadius ?? 0);
  const opacity = Number(element.opacity ?? 1);
  const showFill = element.type !== "line";
  const supportsCornerRadius = element.type === "rect";
  const openColorPanel = useEditorStore((s) => s.openColorPanel);

  return (
    <div className="flex items-center gap-1 overflow-x-auto px-1 py-0.5 scrollbar-none">
      {/* Fill color circle only — no label, no icon */}
      <button
        type="button"
        disabled={!showFill}
        onClick={() => openColorPanel("fill")}
        title="Fill color"
        aria-label="Fill color"
        className="h-6 w-6 rounded-full border border-gray-300 shadow-2xs transition hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: showFill ? fill : "transparent" }}
      />

      <ToolbarDivider />

      {supportsCornerRadius && (
        <NumberInputControl
          value={cornerRadius}
          min={0}
          max={100}
          step={1}
          unit="px"
          label="Radius"
          onChange={(radius) => emitStudioAction({ action: "update-active", payload: { properties: { cornerRadius: radius } } })}
        />
      )}

      <TransparencyPopover opacity={opacity} onChange={(op) => emitStudioAction({ action: "update-active", payload: { opacity: op } })} />
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
