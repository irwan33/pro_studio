"use client";

import { ChevronRight, Type } from "lucide-react";
import { EDITOR_UI_ATTRIBUTE } from "@/lib/editor/focus-mode";
import { useEditorStore } from "@/store/editorStore";

export type FontFamilyPickerProps = {
  value?: string;
  disabled?: boolean;
  className?: string;
};

const FALLBACK_FONT = "League Spartan";

/**
 * Font family control.
 *
 * The control shows the active family and reveals the font list in the Text
 * panel on the left; there is no popup or dropdown attached to it. Applying a
 * family is the panel's job, so this component never touches the selected
 * element and produces no history entry of its own.
 */
export function FontFamilyPicker({ value, disabled = false, className }: FontFamilyPickerProps) {
  const setActivePanel = useEditorStore((s) => s.setActivePanel);
  const activePanel = useEditorStore((s) => s.activePanel);

  const displayFont = value || FALLBACK_FONT;

  return (
    <div className={"relative inline-block " + (className ?? "")} {...{ [EDITOR_UI_ATTRIBUTE]: "" }}>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={activePanel === "text"}
        onClick={() => setActivePanel("text")}
        className={
          "flex h-9 items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-2 text-sm font-semibold text-gray-900 shadow-2xs outline-none transition hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-[#5B2CA0] disabled:cursor-not-allowed disabled:opacity-40 " +
          (className ? "w-full" : "min-w-[160px] max-w-[180px]")
        }
        title={disabled ? "Unlock the text layer to change its font" : "Show fonts in the Text panel"}
      >
        <Type size={15} className="shrink-0 text-gray-500" aria-hidden="true" />
        <span className="flex-1 truncate text-left" style={{ fontFamily: '"' + displayFont + '"' }}>
          {displayFont}
        </span>
        <ChevronRight size={16} className="shrink-0 text-gray-500" aria-hidden="true" />
      </button>
    </div>
  );
}
