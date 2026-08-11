"use client";

import { clsx } from "clsx";
import { useEditorStore } from "@/store/editorStore";
import { Pipette } from "lucide-react";

type Props = {
  /** Which property the eyedropper should sample for: the fill or the border. */
  target: "fill" | "stroke";
  label?: string;
  disabled?: boolean;
};

/**
 * Toolbar eyedropper control.
 *
 * Clicking it activates the eyedropper mode. The user can then click anywhere
 * on the canvas to sample a color. The sampled color is applied to the
 * selected element's target property (fill or stroke).
 */
export function EyedropperButton({ target, label, disabled = false }: Props) {
  const openEyedropper = useEditorStore((s) => s.openEyedropper);
  const closeEyedropper = useEditorStore((s) => s.closeEyedropper);
  const _eyedropperTarget = useEditorStore((s) => s.eyedropperTarget);
  const active = useEditorStore((s) => s.eyedropperTarget === target);

  const handleClick = () => {
    if (disabled) return;
    if (active) {
      closeEyedropper();
    } else {
      openEyedropper(target);
    }
  };

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={handleClick}
      title={label ?? "Eyedropper"}
      aria-label={label ?? "Eyedropper"}
      className={clsx(
        "flex h-9 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium text-gray-900 transition select-none outline-none focus-visible:ring-2 focus-visible:ring-[#5B2CA0]",
        active ? "bg-purple-100 font-semibold text-purple-800" : "hover:bg-gray-100 active:bg-gray-200",
        disabled && "cursor-not-allowed opacity-40 hover:bg-transparent"
      )}
    >
      <Pipette size={16} className={active ? "text-purple-800" : "text-gray-600"} />
      {label && <span className="truncate">{label}</span>}
    </button>
  );
}