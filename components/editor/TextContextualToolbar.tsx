"use client";

import { useEditorStore } from "@/store/editorStore";
import { useSelectedElement } from "@/store/editorSelectors";
import { FontFamilyPicker } from "@/components/editor/FontFamilyPicker";
import { FontSizeControl } from "@/components/editor/FontSizeControl";
import { ColorToolbarButton } from "@/components/editor/ColorToolbarButton";
import { FormatToggleButton } from "@/components/editor/FormatToggleButton";
import { TextCaseButton } from "@/components/editor/TextCaseButton";
import { TextAlignmentButton } from "@/components/editor/TextAlignmentButton";
import { ListToggleButton } from "@/components/editor/ListToggleButton";
import { TextSpacingPopover } from "@/components/editor/TextSpacingPopover";
import { TransparencyPopover } from "@/components/editor/TransparencyPopover";
import { ToolbarButton } from "@/components/editor/ToolbarButton";
import { ToolbarDivider } from "@/components/editor/ToolbarDivider";
import { Copy, MoveHorizontal, Trash2 } from "lucide-react";
import { emitStudioAction } from "@/lib/editor/actions";
import { EDITOR_UI_ATTRIBUTE } from "@/lib/editor/focus-mode";
import { PositionPanelButton } from "@/components/editor/position/PositionPanelButton";
import type { ElementUpdatePayload } from "@/lib/editor/patch";
import type { TextProperties } from "@/lib/editor/types";

function update(payload: ElementUpdatePayload) {
  emitStudioAction({ action: "update-active", payload });
}

export function TextContextualToolbar() {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const selected = useSelectedElement();

  if (selectedIds.length === 0 || selected?.type !== "text") {
    return null;
  }

  const properties = selected.properties as Partial<TextProperties>;
  const fontFamily = String(properties.fontFamily || "League Spartan");
  const fontSize = Number(properties.fontSize ?? 72);
  const fill = String(properties.fill || "#F5F5F2");
  const fontWeight = String(properties.fontWeight ?? "400");
  const isBold = fontWeight === "bold" || Number(fontWeight) >= 600;
  const isItalic = properties.fontStyle === "italic";
  const underline = Boolean(properties.underline);
  const linethrough = Boolean(properties.linethrough);
  const textTransform = String(properties.textTransform || "none");
  const align = properties.align ?? "left";
  const listType = properties.listType ?? "none";
  const letterSpacing = Number(properties.letterSpacing ?? 0);
  const lineHeight = Number(properties.lineHeight ?? 1.16);
  const opacity = Number(selected.opacity ?? 1);

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      {...{ [EDITOR_UI_ATTRIBUTE]: "" }}
      className="absolute left-1/2 top-3 z-20 flex h-10 -translate-x-1/2 items-center gap-1 rounded-xl border border-gray-200 bg-white px-2 shadow-[0_2px_10px_rgba(22,24,35,0.08)] max-w-[95vw] overflow-x-auto scrollbar-none"
    >
      <div className="flex items-center gap-1 shrink-0">
        <FontFamilyPicker value={fontFamily} disabled={Boolean(selected.locked)} />

        <FontSizeControl value={fontSize} onChange={(size) => update({ properties: { fontSize: size } })} />

        <ToolbarDivider />

        <ColorToolbarButton color={fill} target="fill" label="Color" textGlyph />

        <ToolbarDivider />

        <FormatToggleButton
          type="bold"
          active={isBold}
          onChange={(active) => update({ properties: { fontWeight: active ? "700" : "400" } })}
        />
        <FormatToggleButton
          type="italic"
          active={isItalic}
          onChange={(active) => update({ properties: { fontStyle: active ? "italic" : "normal" } })}
        />
        <FormatToggleButton
          type="underline"
          active={underline}
          onChange={(active) => update({ properties: { underline: active } })}
        />
        <FormatToggleButton
          type="strikethrough"
          active={linethrough}
          onChange={(active) => update({ properties: { linethrough: active } })}
        />

        <ToolbarDivider />

        <TextCaseButton
          value={textTransform}
          onChange={(transform) => update({ properties: { textTransform: transform } })}
        />

        <TextAlignmentButton value={align} onChange={(next) => update({ properties: { align: next } })} />

        <ListToggleButton value={listType} onChange={(list) => update({ properties: { listType: list } })} />

        <TextSpacingPopover
          letterSpacing={letterSpacing}
          lineHeight={lineHeight}
          onChange={(spacing) => update({ properties: spacing })}
        />

        <TransparencyPopover opacity={opacity} onChange={(op) => update({ opacity: op })} />

        <ToolbarDivider />

        {/* Position opens the shared Position panel in the sidebar (not a popover). */}
        <PositionPanelButton />

        <ToolbarDivider />

        <ToolbarButton
          icon={<MoveHorizontal size={15} />}
          onClick={() => emitStudioAction("toggle-text-sizing")}
          tooltip={properties.textSizing === "auto-width" ? "Fixed width" : "Auto width"}
          className={properties.textSizing === "auto-width" ? "text-[#7c3aed]" : undefined}
        />

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
    </div>
  );
}
