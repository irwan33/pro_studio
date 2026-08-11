"use client";

import { Maximize, Minus, Plus } from "lucide-react";
import { useCallback, useMemo } from "react";
import { EDITOR_UI_ATTRIBUTE } from "@/lib/editor/focus-mode";
import { emitStudioAction } from "@/lib/editor/actions";
import { useEditorStore } from "@/store/editorStore";

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 4;
const STEP = 0.01; // 1%

/**
 * Compact bottom-centre zoom control mirroring the Canva-style pill: minus,
 * slider with endpoint dots, percentage readout, plus, and fit-to-screen.
 * The slider speaks the same store zoom as wheel/pinch zoom so every control
 * stays synchronised through one state.
 */
export function ZoomControls() {
  const zoom = useEditorStore((s) => s.zoom);

  const zoomPercent = useMemo(() => Math.round(zoom * 100), [zoom]);
  const canZoomOut = zoom > MIN_ZOOM + STEP / 2;
  const canZoomIn = zoom < MAX_ZOOM - STEP / 2;

  const setZoomFromSlider = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value) / 100;
    if (!Number.isFinite(next)) return;
    useEditorStore.getState().setZoom(next);
  }, []);

  const zoomStep = useCallback((direction: 1 | -1) => {
    emitStudioAction(direction === 1 ? "zoom-in" : "zoom-out");
  }, []);

  const fitToScreen = useCallback(() => {
    emitStudioAction("zoom-fit");
  }, []);

  /* Track fill gradient: filled portion darker than remaining track. */
  const trackPercent = ((zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100;

  return (
    <div
      {...{ [EDITOR_UI_ATTRIBUTE]: "" }}
      role="group"
      aria-label="Zoom controls"
      className="absolute bottom-6 right-6 z-30 flex h-9 items-center gap-1.5 rounded-full border border-studio-border bg-studio-secondary/95 px-2 shadow-[0_6px_24px_rgba(22,24,35,0.12)] backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={() => zoomStep(-1)}
        disabled={!canZoomOut}
        aria-label="Zoom out"
        title="Zoom out"
        className="flex h-8 w-8 items-center justify-center rounded-full text-studio-text transition hover:bg-studio-elevated disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <Minus size={14} />
      </button>

      <div className="flex items-center gap-1">
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full bg-studio-muted"
        />
        <input
          type="range"
          role="slider"
          aria-label="Zoom level"
          aria-valuemin={MIN_ZOOM * 100}
          aria-valuemax={MAX_ZOOM * 100}
          aria-valuenow={zoomPercent}
          aria-valuetext={zoomPercent + "%"}
          min={MIN_ZOOM * 100}
          max={MAX_ZOOM * 100}
          step={STEP * 100}
          value={zoomPercent}
          onChange={setZoomFromSlider}
          className="zoom-slider h-1.5 w-32 cursor-pointer appearance-none rounded-full bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-studio-accent"
          style={{
            background: `linear-gradient(to right, var(--studio-text, #1F1F24) 0%, var(--studio-text, #1F1F24) ${trackPercent}%, var(--studio-border, #E5E7EB) ${trackPercent}%, var(--studio-border, #E5E7EB) 100%)`
          }}
        />
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full bg-studio-muted"
        />
      </div>

      <span
        aria-live="polite"
        className="w-10 shrink-0 text-center font-mono text-xs font-semibold tabular-nums text-studio-text"
      >
        {zoomPercent}%
      </span>

      <button
        type="button"
        onClick={() => zoomStep(1)}
        disabled={!canZoomIn}
        aria-label="Zoom in"
        title="Zoom in"
        className="flex h-8 w-8 items-center justify-center rounded-full text-studio-text transition hover:bg-studio-elevated disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <Plus size={14} />
      </button>

      <button
        type="button"
        onClick={fitToScreen}
        aria-label="Fit to screen"
        title="Fit to screen"
        className="flex h-8 w-8 items-center justify-center rounded-full text-studio-text transition hover:bg-studio-elevated"
      >
        <Maximize size={13} />
      </button>
    </div>
  );
}
