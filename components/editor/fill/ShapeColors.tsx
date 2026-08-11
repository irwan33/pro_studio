"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, Pipette, Minus, Shapes, Type } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { useSelectedElement } from "@/store/editorSelectors";
import { emitStudioAction } from "@/lib/editor/actions";
import { extractFillFromElement, supportsFill, ShapeFill, createFillPayload } from "@/lib/editor/fill";
import type { GradientConfig } from "@/lib/editor/types";
import { SolidColorPopover } from "@/components/editor/fill/SolidColorPopover";
import { GradientPopover } from "@/components/editor/fill/GradientPopover";

function getActiveFillMode(fill: ShapeFill | null): "none" | "solid" | "gradient" {
  if (!fill || fill.type === "none") return "none";
  if (fill.type === "solid") return "solid";
  return "gradient";
}

function solidColor(fill: ShapeFill | null): string {
  if (fill?.type === "solid") return fill.color;
  if (fill?.type === "gradient") return fill.config.stops[0]?.color ?? "#C7FF00";
  return "#C7FF00";
}

export function ShapeColors() {
  const selected = useSelectedElement();
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const openEyedropper = useEditorStore((s) => s.openEyedropper);
  const closeEyedropper = useEditorStore((s) => s.closeEyedropper);
  const eyedropperTarget = useEditorStore((s) => s.eyedropperTarget);

  const isText = selected?.type === "text";
  const currentFill = selected ? extractFillFromElement(selected.properties) : { type: "none" as const };
  const activeMode = getActiveFillMode(currentFill);
  const currentSolidColor = solidColor(currentFill);

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverTab, setPopoverTab] = useState<"solid" | "gradient">("solid");
  const [popoverAnchor, setPopoverAnchor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when selection changes
  useEffect(() => {
    setPopoverOpen(false);
  }, [selected?.id]);

  const handleFillChange = useCallback((newFill: ShapeFill) => {
    const payload = { properties: { ...createFillPayload(newFill) } };
    emitStudioAction({ action: "update-active", payload });
  }, []);

  const handleFillChangeAndClose = useCallback((newFill: ShapeFill) => {
    const payload = { properties: { ...createFillPayload(newFill) } };
    emitStudioAction({ action: "update-active", payload });
    setPopoverOpen(false);
  }, []);

  const handleGradientChange = useCallback((config: GradientConfig) => {
    handleFillChange({ type: "gradient", config });
  }, [handleFillChange]);

  const handleTransparent = useCallback(() => {
    setPopoverOpen(false);
    emitStudioAction({
      action: "update-active",
      payload: { properties: { fill: "none", gradient: null } }
    });
  }, []);

  const openPopover = useCallback((tab: "solid" | "gradient") => {
    const panel = document.querySelector<HTMLElement>("[data-asset-panel]");
    if (!panel) return;
    const panelRect = panel.getBoundingClientRect();
    setPopoverAnchor({
      x: panelRect.left + panelRect.width / 2,
      y: panelRect.top + 12
    });
    setPopoverTab(tab);
    setPopoverOpen(true);
  }, []);

  // Close popover on outside click / Escape
  useEffect(() => {
    if (!popoverOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (popoverRef.current && !popoverRef.current.contains(target)) {
        setPopoverOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setPopoverOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [popoverOpen]);

  if (selectedIds.length !== 1 || !selected || !supportsFill(selected.type)) {
    return null;
  }

  const isEyedropActive = eyedropperTarget === "fill";

  return (
    <div className="space-y-4" data-testid="shape-colors">
      {/* Contextual header */}
      <div className="flex items-center gap-2">
        {isText ? (
          <>
            <Type size={18} className="text-studio-secondaryText" />
            <span className="text-sm font-semibold text-studio-text">Text colors</span>
          </>
        ) : (
          <>
            <Shapes size={18} className="text-studio-secondaryText" />
            <span className="text-sm font-semibold text-studio-text">Shape colors</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3" role="group" aria-label={isText ? "Text color controls" : "Shape fill controls"}>
        {/* 1. Add Color — rainbow ring with + */}
        <button
          type="button"
          onClick={() => openPopover("solid")}
          className="relative flex h-9 w-9 items-center justify-center rounded-full transition hover:scale-105"
          title="Add Color"
          aria-label="Add Color"
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
              padding: "2px"
            }}
          />
          <div className="relative z-10 flex h-full w-full items-center justify-center rounded-full bg-white">
            <Plus size={16} className="text-gray-700" />
          </div>
        </button>

        {/* 2. Eyedropper */}
        <button
          type="button"
          onClick={() => {
            if (isEyedropActive) {
              closeEyedropper();
            } else {
              openEyedropper("fill");
            }
          }}
          className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition ${
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

        {/* Shape-only: Transparent */}
        {!isText && (
          <button
            type="button"
            onClick={handleTransparent}
            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition ${
              activeMode === "none"
                ? "border-studio-accent bg-studio-accent/10"
                : "border-[#E5E7EB] bg-white hover:bg-gray-50"
            }`}
            title="Transparent"
            aria-label="Transparent"
            aria-pressed={activeMode === "none"}
          >
            <div className="relative w-5 h-5 rounded-full overflow-hidden">
              <div className="absolute inset-0" style={{
                background: "repeating-conic-gradient(#d1d5db 0% 25%, #9ca3af 25% 50%)"
              }} />
              <Minus size={14} className="absolute inset-0 m-auto text-red-500 rotate-45" strokeWidth={2.5} />
            </div>
          </button>
        )}

        {/* Shape: Solid Color preview */}
        {!isText && (
          <button
            type="button"
            onClick={() => openPopover("solid")}
            className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition hover:scale-105 ${
              activeMode === "solid"
                ? "border-studio-accent"
                : "border-[#E5E7EB]"
            }`}
            style={{ backgroundColor: activeMode !== "none" ? currentSolidColor : "transparent" }}
            title="Solid Color"
            aria-label="Solid Color"
          >
            {activeMode === "none" ? (
              <div className="absolute inset-0 rounded-full" style={{
                background: "repeating-conic-gradient(#d1d5db 0% 25%, #9ca3af 25% 50%)"
              }}>
                <Minus size={16} className="absolute inset-0 m-auto text-red-500 rotate-45" strokeWidth={2.5} />
              </div>
            ) : null}
          </button>
        )}

        {/* Shape-only: Gradient preview */}
        {!isText && (
          <button
            type="button"
            onClick={() => openPopover("gradient")}
            className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition hover:scale-105 ${
              activeMode === "gradient"
                ? "border-studio-accent"
                : "border-[#E5E7EB]"
            }`}
            title="Gradient"
            aria-label="Gradient"
            style={{
              background: currentFill.type === "gradient"
                ? (() => {
                    const stops = currentFill.config.stops.map((s: { color: string; offset: number }) => s.color + " " + s.offset * 100 + "%").join(", ");
                    return currentFill.config.type === "linear"
                      ? `linear-gradient(${currentFill.config.angle}deg, ${stops})`
                      : `radial-gradient(circle, ${stops})`;
                  })()
                : activeMode !== "none"
                  ? currentSolidColor
                  : "transparent"
            }}
          >
            {activeMode === "none" ? (
              <div className="absolute inset-0 rounded-full" style={{
                background: "repeating-conic-gradient(#d1d5db 0% 25%, #9ca3af 25% 50%)"
              }}>
                <Minus size={16} className="absolute inset-0 m-auto text-red-500 rotate-45" strokeWidth={2.5} />
              </div>
            ) : null}
          </button>
        )}

        {/* Text: Current Text Color */}
        {isText && (
          <button
            type="button"
            onClick={() => openPopover("solid")}
            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition hover:scale-105 ${
              activeMode === "solid" || activeMode === "none"
                ? "border-studio-accent"
                : "border-[#E5E7EB]"
            }`}
            style={{ backgroundColor: currentSolidColor }}
            title="Text Color"
            aria-label="Text Color"
          />
        )}
      </div>

      {/* Color Picker Popover via Portal */}
      {popoverOpen && createPortal(
        <div
          ref={popoverRef}
          className="fixed inset-0 z-50 pointer-events-none"
        >
          <div
            className="popover-content fixed pointer-events-auto w-80 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl"
            style={{
              left: popoverAnchor.x,
              top: popoverAnchor.y,
              transform: "translateX(-50%)"
            }}
          >
            {/* Tabs — Gradient hidden for text mode */}
            {!isText && (
              <div className="flex border-b border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setPopoverTab("solid")}
                  className={`flex-1 py-3 text-sm font-semibold transition ${
                    popoverTab === "solid"
                      ? "text-studio-accent border-b-2 border-studio-accent"
                      : "text-studio-secondaryText hover:text-studio-text"
                  }`}
                >
                  Solid Color
                </button>
                <button
                  type="button"
                  onClick={() => setPopoverTab("gradient")}
                  className={`flex-1 py-3 text-sm font-semibold transition ${
                    popoverTab === "gradient"
                      ? "text-studio-accent border-b-2 border-studio-accent"
                      : "text-studio-secondaryText hover:text-studio-text"
                  }`}
                >
                  Gradient
                </button>
              </div>
            )}

            {/* Content */}
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
              {popoverTab === "solid" || isText ? (
                <SolidColorPopover
                  initialColor={currentSolidColor}
                  onApply={(color) => handleFillChangeAndClose({ type: "solid", color })}
                  onClose={() => setPopoverOpen(false)}
                />
              ) : (
                <GradientPopover
                  initialConfig={currentFill.type === "gradient" ? currentFill.config : undefined}
                  onChange={(config) => handleGradientChange(config)}
                  onClose={() => setPopoverOpen(false)}
                />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
