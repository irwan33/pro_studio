"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { SlidersHorizontal } from "lucide-react";

type Props = {
  opacity: number;
  onChange: (opacity: number) => void;
};

const POPOVER_WIDTH = 224; // w-56 = 224px
const GAP = 8;

export function TransparencyPopover({ opacity, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [percent, setPercent] = useState(Math.round((opacity ?? 1) * 100));
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    setPercent(Math.round((opacity ?? 1) * 100));
  }, [opacity]);

  const close = useCallback(() => {
    setOpen(false);
    setPosition(null);
  }, []);

  const handleTriggerClick = useCallback(() => {
    if (open) {
      close();
    } else {
      setOpen(true);
      // Position will be calculated in the next effect
    }
  }, [open, close]);

  // Calculate position when open
  useEffect(() => {
    if (!open || !triggerRef.current) return;

    const trigger = triggerRef.current;
    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Default: below trigger, left-aligned
    let left = rect.left;
    let top = rect.bottom + GAP;

    // Collision detection: keep popover inside viewport
    if (left + POPOVER_WIDTH > viewportWidth - 8) {
      left = viewportWidth - POPOVER_WIDTH - 8;
    }
    if (left < 8) {
      left = 8;
    }

    // Check if there's space below; if not, show above
    if (top + 280 > viewportHeight - 8 && rect.top > 280 + GAP) {
      top = rect.top - 280 - GAP;
    }

    setPosition({ top, left });
  }, [open]);

  // Outside click + Escape
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        close();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, close]);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!open) return;

    const handleScroll = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        let left = rect.left;
        let top = rect.bottom + GAP;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (left + POPOVER_WIDTH > viewportWidth - 8) {
          left = viewportWidth - POPOVER_WIDTH - 8;
        }
        if (left < 8) left = 8;

        if (top + 280 > viewportHeight - 8 && rect.top > 280 + GAP) {
          top = rect.top - 280 - GAP;
        }

        setPosition({ top, left });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open]);

  const handleSliderChange = (value: number) => {
    const clamped = Math.min(100, Math.max(0, value));
    setPercent(clamped);
    onChange(clamped / 100);
  };

  const handleInputChange = (value: string) => {
    const num = Number(value);
    if (Number.isNaN(num)) return;
    const clamped = Math.min(100, Math.max(0, num));
    setPercent(clamped);
    onChange(clamped / 100);
  };

  const handleInputBlur = () => {
    setPercent(Math.round((opacity ?? 1) * 100));
  };

  const popoverContent = (
    <div
      ref={popoverRef}
      className="w-56 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xl space-y-3"
      style={{ pointerEvents: "auto" }}
    >
      <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
        <span>Transparency</span>
        <span className="font-mono">{percent}%</span>
      </div>
      <div className="space-y-2">
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={percent}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          className="w-full accent-[#5B2CA0]"
        />
        <div className="flex items-center gap-2">
          <label htmlFor="transparency-input" className="text-xs text-gray-500 w-16">
            Value
          </label>
          <input
            id="transparency-input"
            type="number"
            min="0"
            max="100"
            step="1"
            value={percent}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={handleInputBlur}
            className="flex-1 h-8 rounded-xl border border-[#E5E7EB] bg-white px-2 text-xs font-mono text-[#1F1F24] outline-none focus:border-[#5B2CA0] focus:ring-1 focus:ring-[#5B2CA0]"
          />
          <span className="text-xs text-gray-500">%</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        className="flex h-9 items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-2.5 text-xs font-medium text-[#1F1F24] hover:bg-gray-50 transition shadow-2xs"
        title="Transparency"
      >
        <SlidersHorizontal size={14} className="text-gray-500" />
        <span>{percent}%</span>
      </button>

      {open && position && createPortal(
        <div
          style={{
            position: "fixed",
            top: position.top,
            left: position.left,
            zIndex: 1000, // above canvas, sidebar, transformer
            pointerEvents: "auto",
          }}
        >
          {popoverContent}
        </div>,
        document.body
      )}
    </>
  );
}