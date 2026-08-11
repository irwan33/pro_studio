"use client";

import { useState, useRef, useEffect } from "react";
import { Play } from "lucide-react";

const animations = [
  { name: "Fade", category: "Basic" },
  { name: "Rise", category: "Basic" },
  { name: "Pan", category: "Basic" },
  { name: "Baseline", category: "Text" },
  { name: "Typewriter", category: "Text" },
  { name: "Bounce", category: "Emphasis" },
  { name: "Pulse", category: "Emphasis" }
];

export function AnimationPanelPopover() {
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

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-3 text-xs font-medium text-[#1F1F24] hover:bg-gray-50 transition shadow-2xs"
      >
        <Play size={14} className="text-[#5B2CA0]" />
        <span>Animate</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xl space-y-3">
          <div className="text-xs font-semibold text-gray-800">Page & Element Animations</div>
          <div className="space-y-1">
            {animations.map((anim) => (
              <button
                key={anim.name}
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-[#EEE7FF] hover:text-[#5B2CA0] transition"
              >
                <span>{anim.name}</span>
                <span className="text-[10px] font-mono text-gray-400">{anim.category}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
