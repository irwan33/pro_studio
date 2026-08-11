"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Pipette } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";

type Props = {
  initialColor: string;
  onApply: (color: string) => void;
  onClose: () => void;
};

const SV_SIZE = 188;
const HUE_BAR_H = 18;
const ALPHA_BAR_H = 18;

function hsvToHex(h: number, s: number, v: number): string {
  s /= 100;
  v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  return "#" + [r, g, b].map(c => c.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function hexToHsv(hexColor: string): { h: number; s: number; v: number } {
  const normalized = hexColor.replace("#", "").slice(0, 6);
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : Math.round((delta / max) * 100);
  const v = Math.round(max * 100);
  return { h, s, v };
}

function hexWithAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255).toString(16).padStart(2, "0");
  return hex + a;
}

function parseAlpha(hex: string): number {
  if (hex.length === 9) {
    return parseInt(hex.slice(7, 9), 16) / 255;
  }
  return 1;
}

export function SolidColorPopover({ initialColor, onApply, onClose: _onClose }: Props) {
  const [hex, setHex] = useState(() => initialColor.slice(0, 7).toUpperCase());
  const [opacity, setOpacity] = useState(() => parseAlpha(initialColor));
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [value, setValue] = useState(100);
  const [committedHex, setCommittedHex] = useState(() => initialColor.slice(0, 7).toUpperCase());
  const [isDraggingSV, setIsDraggingSV] = useState(false);
  const [isDraggingHue, setIsDraggingHue] = useState(false);
  const [isDraggingAlpha, setIsDraggingAlpha] = useState(false);
  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const alphaRef = useRef<HTMLDivElement>(null);
  const hexInputRef = useRef<HTMLInputElement>(null);
  const openEyedropper = useEditorStore((s) => s.openEyedropper);
  const closeEyedropper = useEditorStore((s) => s.closeEyedropper);
  const eyedropperTarget = useEditorStore((s) => s.eyedropperTarget);

  const updateFromHsv = useCallback((h: number, s: number, v: number) => {
    const newHex = hsvToHex(h % 360, s, v);
    setHex(newHex);
    setHue(h % 360);
    setSaturation(s);
    setValue(v);
  }, []);

  const updateFromHex = useCallback((hexColor: string) => {
    const clean = hexColor.replace("#", "");
    if (!/^[0-9a-fA-F]{6,8}$/.test(clean)) return;
    const newHex = "#" + clean.slice(0, 6).toUpperCase();
    setHex(newHex);
    const hsv = hexToHsv(newHex);
    setHue(hsv.h);
    setSaturation(hsv.s);
    setValue(hsv.v);
    if (clean.length === 8) {
      setOpacity(parseInt(clean.slice(6, 8), 16) / 255);
    }
  }, []);

  const handleSVDrag = useCallback((clientX: number, clientY: number) => {
    if (!svRef.current) return;
    const rect = svRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(SV_SIZE, clientX - rect.left));
    const y = Math.max(0, Math.min(SV_SIZE, clientY - rect.top));
    const s = Math.round((x / SV_SIZE) * 100);
    const v = Math.round(100 - (y / SV_SIZE) * 100);
    updateFromHsv(hue, s, v);
  }, [hue, updateFromHsv]);

  const handleHueDrag = useCallback((clientX: number) => {
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(SV_SIZE, clientX - rect.left));
    const h = Math.round((x / SV_SIZE) * 360);
    updateFromHsv(h, saturation, value);
  }, [saturation, value, updateFromHsv]);

  const handleAlphaDrag = useCallback((clientX: number) => {
    if (!alphaRef.current) return;
    const rect = alphaRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(SV_SIZE, clientX - rect.left));
    setOpacity(Math.round((x / SV_SIZE) * 100) / 100);
  }, []);

  // Drag handlers
  useEffect(() => {
    if (!isDraggingSV && !isDraggingHue && !isDraggingAlpha) return;
    function handleMouseMove(event: MouseEvent) {
      if (isDraggingSV) handleSVDrag(event.clientX, event.clientY);
      if (isDraggingHue) handleHueDrag(event.clientX);
      if (isDraggingAlpha) handleAlphaDrag(event.clientX);
    }
    function handleMouseUp() {
      setIsDraggingSV(false);
      setIsDraggingHue(false);
      setIsDraggingAlpha(false);
      setCommittedHex(hex);
      onApply(hexWithAlpha(hex, opacity));
    }
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingSV, isDraggingHue, isDraggingAlpha, handleSVDrag, handleHueDrag, handleAlphaDrag, hex, opacity, onApply]);

  // Initialize
  useEffect(() => {
    const hsv = hexToHsv(initialColor);
    setHue(hsv.h);
    setSaturation(hsv.s);
    setValue(hsv.v);
    setHex(initialColor.slice(0, 7).toUpperCase());
    setOpacity(parseAlpha(initialColor));
    setCommittedHex(initialColor.slice(0, 7).toUpperCase());
  }, [initialColor]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Allow typing: auto-uppercase and prepend #
    let processed = input.startsWith("#") ? input : "#" + input;
    processed = processed.toUpperCase();
    setHex(processed);
    if (/^#[0-9A-F]{6}$/.test(processed)) {
      updateFromHex(processed);
    }
  };

  const handleHexBlur = () => {
    if (/^#[0-9A-F]{6}$/.test(hex)) {
      setCommittedHex(hex);
      onApply(hexWithAlpha(hex, opacity));
    } else {
      setHex(committedHex);
    }
  };

  const handleHexKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      hexInputRef.current?.blur();
    }
  };

  const handleOpacityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
    setOpacity(val / 100);
  };

  const handleOpacityBlur = () => {
    onApply(hexWithAlpha(hex, opacity));
  };

  const handleOpacityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onApply(hexWithAlpha(hex, opacity));
    }
  };

  const isEyedropActive = eyedropperTarget === "fill";
  const currentRgb = hex.slice(0, 7);

  return (
    <div className="space-y-4">
      {/* Saturation/Value square */}
      <div
        ref={svRef}
        className="relative rounded-2xl overflow-hidden cursor-crosshair"
        style={{ width: SV_SIZE, height: SV_SIZE, background: `hsl(${hue}, 100%, 50%)` }}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsDraggingSV(true);
          handleSVDrag(e.clientX, e.clientY);
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          setIsDraggingSV(true);
          const t = e.touches[0];
          handleSVDrag(t.clientX, t.clientY);
        }}
      >
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, #fff, transparent)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent, #000)" }} />
        <div
          className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg pointer-events-none"
          style={{ left: `${(saturation / 100) * 100}%`, top: `${(1 - value / 100) * 100}%` }}
        />
      </div>

      {/* Hue slider — horizontal */}
      <div
        ref={hueRef}
        className="relative rounded-full overflow-hidden cursor-ew-resize"
        style={{ height: HUE_BAR_H, width: SV_SIZE, background: "linear-gradient(90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsDraggingHue(true);
          handleHueDrag(e.clientX);
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          setIsDraggingHue(true);
          handleHueDrag(e.touches[0].clientX);
        }}
      >
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 -translate-x-1/2 rounded-full bg-white border-2 border-white shadow-md ring-1 ring-black/10 pointer-events-none"
          style={{ left: `${(hue / 360) * 100}%` }}
        />
      </div>

      {/* Transparency slider */}
      <div
        ref={alphaRef}
        className="relative rounded-full overflow-hidden cursor-ew-resize"
        style={{
          height: ALPHA_BAR_H,
          width: SV_SIZE,
          background: `linear-gradient(90deg, transparent, ${currentRgb})`
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsDraggingAlpha(true);
          handleAlphaDrag(e.clientX);
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          setIsDraggingAlpha(true);
          handleAlphaDrag(e.touches[0].clientX);
        }}
      >
        {/* Checkerboard underneath */}
        <div className="absolute inset-0 -z-10" style={{
          background: "repeating-conic-gradient(#d1d5db 0% 25%, #fff 25% 50%)",
          backgroundSize: "12px 12px"
        }} />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 -translate-x-1/2 rounded-full bg-white border-2 border-white shadow-md ring-1 ring-black/10 pointer-events-none"
          style={{ left: `${opacity * 100}%` }}
        />
      </div>

      {/* Bottom controls row */}
      <div className="flex items-center gap-3">
        {/* Color preview — circular with checkerboard behind */}
        <div className="relative w-[42px] h-[42px] shrink-0 rounded-full overflow-hidden border border-[#E5E7EB]">
          <div className="absolute inset-0 rounded-full" style={{ background: currentRgb }} />
          <div className="absolute inset-0 rounded-full" style={{ opacity: 1 - opacity, background: "repeating-conic-gradient(#d1d5db 0% 25%, #fff 25% 50%)", backgroundSize: "8px 8px" }} />
        </div>

        {/* HEX input */}
        <input
          ref={hexInputRef}
          type="text"
          value={hex}
          onChange={handleHexChange}
          onBlur={handleHexBlur}
          onKeyDown={handleHexKeyDown}
          className="h-10 flex-1 rounded-xl border border-[#E5E7EB] bg-studio-input px-3 font-mono text-xs uppercase text-studio-text outline-none focus:border-studio-accent"
          placeholder="#RRGGBB"
          spellCheck={false}
          autoComplete="off"
        />

        {/* Opacity % input */}
        <input
          type="number"
          min={0}
          max={100}
          value={Math.round(opacity * 100)}
          onChange={handleOpacityInput}
          onBlur={handleOpacityBlur}
          onKeyDown={handleOpacityKeyDown}
          className="h-10 w-14 rounded-xl border border-[#E5E7EB] bg-studio-input px-2 text-center font-mono text-xs text-studio-text outline-none focus:border-studio-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />

        {/* Eyedropper button */}
        <button
          type="button"
          onClick={() => {
            if (isEyedropActive) closeEyedropper();
            else openEyedropper("fill");
          }}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 transition ${
            isEyedropActive
              ? "border-studio-accent bg-studio-accent/10"
              : "border-[#E5E7EB] bg-white hover:bg-gray-50"
          }`}
          title="Eyedropper"
          aria-label="Eyedropper"
          aria-pressed={isEyedropActive}
        >
          <Pipette size={16} className={isEyedropActive ? "text-studio-accent" : "text-gray-700"} />
        </button>
      </div>
    </div>
  );
}
