"use client";

import { clsx } from "clsx";
import { useEditorStore } from "@/store/editorStore";

type Props = {
  color: string;
  /** Which property the Color panel should edit: the fill or the border. */
  target: "fill" | "stroke";
  label?: string;
  /** Renders the underlined "A" glyph used for text colour. */
  textGlyph?: boolean;
  disabled?: boolean;
};

/**
 * Toolbar colour control.
 *
 * Clicking it opens the Color panel in the fixed left content panel — there is
 * deliberately no popover or dropdown attached to the button. The selection is
 * preserved so the panel can keep editing the element the colour belongs to.
 */
export function ColorToolbarButton({ color, target, label, textGlyph = false, disabled = false }: Props) {
  const openColorPanel = useEditorStore((s) => s.openColorPanel);
  const active = useEditorStore((s) => s.activePanel === "color" && s.colorPanelTarget === target);

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={() => openColorPanel(target)}
      title={label ?? "Colour"}
      aria-label={label ?? "Colour"}
      className={clsx(
        "flex h-9 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium text-gray-900 transition select-none outline-none focus-visible:ring-2 focus-visible:ring-[#5B2CA0]",
        active ? "bg-purple-100 font-semibold text-purple-800" : "hover:bg-gray-100 active:bg-gray-200",
        disabled && "cursor-not-allowed opacity-40 hover:bg-transparent"
      )}
    >
      {textGlyph ? (
        <span className="flex flex-col items-center leading-none">
          <span className="text-sm font-bold text-gray-900">A</span>
          <span className="mt-0.5 h-0.5 w-4 rounded-full" style={{ backgroundColor: color || "#000000" }} />
        </span>
      ) : (
        <span
          className="h-4 w-4 rounded-full border border-gray-300 shadow-2xs"
          style={{ backgroundColor: color || "#C7FF00" }}
        />
      )}
      {label && <span className="truncate">{label}</span>}
    </button>
  );
}
