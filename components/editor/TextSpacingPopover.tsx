"use client";

import { useState, useRef, useEffect } from "react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";

type Props = {
  letterSpacing: number;
  lineHeight: number;
  onChange: (payload: { letterSpacing?: number; lineHeight?: number }) => void;
};

export function TextSpacingPopover({ letterSpacing, lineHeight, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const spacing = letterSpacing ?? 0;
  const lHeight = lineHeight ?? 1.16;

  function handleReset() {
    onChange({ letterSpacing: 0, lineHeight: 1.16 });
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 items-center justify-center gap-1 rounded-xl px-2 hover:bg-gray-100 transition outline-none focus-visible:ring-2 focus-visible:ring-[#5B2CA0]"
        title="Spacing"
        aria-label="Spacing"
      >
        <SlidersHorizontal size={16} className="text-gray-800" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-800">Spacing</span>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-purple-800 transition"
              title="Reset spacing"
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>

          {/* Letter Spacing */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Letter spacing</span>
              <span className="font-mono">{spacing} px</span>
            </div>
            <input
              type="range"
              min="-20"
              max="200"
              step="1"
              value={spacing}
              onChange={(e) => onChange({ letterSpacing: Number(e.target.value) })}
              className="w-full accent-[#5B2CA0]"
            />
          </div>

          {/* Line Height */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Line height</span>
              <span className="font-mono">{lHeight}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={lHeight}
              onChange={(e) => onChange({ lineHeight: Number(e.target.value) })}
              className="w-full accent-[#5B2CA0]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
