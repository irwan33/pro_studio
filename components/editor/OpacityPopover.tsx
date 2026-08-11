"use client";

import { useState, useRef, useEffect } from "react";
import { Sliders } from "lucide-react";

type Props = {
  opacity: number; // 0 to 1
  onChange: (opacity: number) => void;
};

export function OpacityPopover({ opacity, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const percent = Math.round((opacity ?? 1) * 100);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-2.5 text-xs font-medium text-[#1F1F24] hover:bg-gray-50 transition shadow-2xs"
        title="Transparency"
      >
        <Sliders size={14} className="text-gray-500" />
        <span>{percent}%</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
            <span>Transparency</span>
            <span className="font-mono">{percent}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={opacity ?? 1}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-[#5B2CA0]"
          />
        </div>
      )}
    </div>
  );
}
