"use client";

import { useState, useRef, useEffect } from "react";

type Props = {
  color: string;
  onChange: (color: string) => void;
};

const presetColors = [
  "#000000", "#FFFFFF", "#111827", "#374151", "#9CA3AF", "#F3F4F6",
  "#C7FF00", "#10B981", "#3B82F6", "#6366F1", "#EC4899", "#EF4444",
  "#F59E0B", "#8B5CF6", "#14B8A6", "#06B6D4", "#F43F5E", "#84CC16"
];

export function TextColorPicker({ color, onChange }: Props) {
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

  const activeColor = color || "#F5F5F2";

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-11 items-center justify-center gap-1 rounded-xl px-3 hover:bg-gray-100 transition outline-none focus-visible:ring-2 focus-visible:ring-[#5B2CA0]"
        title="Text color"
        aria-label="Text color"
      >
        <div className="flex flex-col items-center leading-none">
          <span className="font-bold text-lg text-gray-900">A</span>
          <span className="h-1 w-5 rounded-full mt-0.5 shadow-2xs" style={{ backgroundColor: activeColor }} />
        </div>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl">
          <div className="mb-3 text-xs font-semibold text-gray-800">Text Color</div>
          
          <div className="mb-3 flex items-center gap-2">
            <input
              type="color"
              value={activeColor.startsWith("#") ? activeColor : "#F5F5F2"}
              onChange={(e) => onChange(e.target.value)}
              className="h-9 w-9 cursor-pointer rounded-xl border border-gray-200 bg-transparent p-0"
            />
            <input
              type="text"
              value={activeColor}
              onChange={(e) => onChange(e.target.value)}
              className="h-9 flex-1 rounded-xl border border-gray-200 px-3 font-mono text-xs uppercase outline-none focus:border-[#5B2CA0]"
            />
          </div>

          <div className="mb-2 text-[11px] font-medium text-gray-500">Preset Colors</div>
          <div className="grid grid-cols-6 gap-2">
            {presetColors.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => {
                  onChange(hex);
                  setOpen(false);
                }}
                className={`h-7 w-7 rounded-full transition hover:scale-105 focus-visible:ring-2 focus-visible:ring-[#7C3AED] ${
                  activeColor.toLowerCase() === hex.toLowerCase() ? "ring-2 ring-[#7C3AED] ring-offset-1" : "border border-gray-200"
                }`}
                style={{ backgroundColor: hex }}
                title={hex}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
