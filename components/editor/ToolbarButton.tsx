"use client";

import { ReactNode } from "react";
import { clsx } from "clsx";

type Props = {
  icon: ReactNode;
  label?: string;
  active?: boolean;
  onClick?: () => void;
  tooltip?: string;
  disabled?: boolean;
  className?: string;
};

export function ToolbarButton({ icon, label, active, onClick, tooltip, disabled = false, className }: Props) {
  return (
    <button
      type="button"
      title={tooltip}
      aria-label={tooltip}
      // Only toggle buttons pass `active`, so the pressed state stays off other buttons.
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "flex h-9 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-medium transition select-none outline-none focus-visible:ring-2 focus-visible:ring-[#5B2CA0]",
        active
          ? "bg-purple-100 text-purple-800 font-semibold shadow-2xs"
          : "text-gray-900 hover:bg-gray-100 active:bg-gray-200",
        disabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
        className
      )}
    >
      <span className="flex items-center justify-center text-gray-800">{icon}</span>
      {label && <span className="truncate">{label}</span>}
    </button>
  );
}
