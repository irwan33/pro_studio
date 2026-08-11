import type { EditorScene } from "@/lib/editor/types";
import type { CompositeKind } from "@/lib/editor/factory";
import type { ElementUpdatePayload } from "@/lib/editor/patch";

/**
 * The editor panels communicate with the canvas through window custom events.
 * Payloads speak the editor element model: geometry at the top level, everything
 * type-specific under `properties`.
 */
export const STUDIO_ACTION_EVENT = "studio-action";
export const STUDIO_LAYER_ACTION_EVENT = "studio-layer-action";
export const STUDIO_DRAG_TYPE = "application/x-pro-studio-action";

export type SimpleStudioAction =
  | "duplicate"
  | "delete"
  | "save"
  | "undo"
  | "redo"
  | "clear-selection"
  | "select-all"
  | "group"
  | "ungroup"
  | "bring-front"
  | "send-back"
  | "bring-forward"
  | "send-backward"
  | "flip"
  | "flip-vertical"
  | "color"
  | "align-left"
  | "align-center-horizontal"
  | "align-right"
  | "align-top"
  | "align-center-vertical"
  | "align-bottom"
  | "toggle-text-sizing"
  | "start-crop"
  | "apply-crop"
  | "cancel-crop"
  | "zoom-in"
  | "zoom-out"
  | "zoom-fit"
  | "zoom-reset";

export type StudioActionDetail =
  | { action: "apply-template"; payload: EditorScene | unknown }
  | { action: "document"; payload: { width?: number; height?: number; background?: string } }
  | { action: "add-page" }
  | {
      action: "add-text";
      payload: {
        text?: string;
        fontSize?: number;
        fontFamily?: string;
        fill?: string;
        name?: string;
        fontWeight?: string;
        fontStyle?: string;
      };
    }
  | {
      action: "add-shape";
      payload: {
        shape?: "rect" | "circle" | "line" | "frame" | "polygon" | "arrow";
        name?: string;
        svgPath?: string;
        viewBox?: string;
      };
    }
  | { action: "add-image"; payload: { src: string; name: string; cover?: boolean } }
  /** Arms the Replace flow for an image element (or the selected one). */
  | { action: "replace-image"; payload?: { elementId?: string } }
  /** Completes the Replace flow with a picked source. */
  | { action: "replace-image-source"; payload: { elementId?: string; src: string; name?: string } }
  /** Explicit "Cover canvas" action for an already placed image. */
  | { action: "cover-canvas"; payload?: { elementId?: string } }
  | { action: "add-asset"; payload: { kind: "player" | "atmosphere" | "light"; name: string } }
  | { action: "add-element"; payload: { kind: CompositeKind; name: string } }
  | { action: "add-sticker"; payload: { kind: "trophy" | "ball" | "whistle" | "boot" | "spark"; name: string } }
  | { action: "update-active"; payload: ElementUpdatePayload }
  | { action: "apply-filter"; payload: { filterType: string; value: number } }
  | { action: "apply-filter-preset"; payload: { filters: Record<string, number> } }
  | { action: "reset-filters"; payload?: Record<string, never> }
  | {
      action: "apply-gradient";
      payload: { type: "linear" | "radial"; angle: number; stops: Array<{ color: string; offset: number }> };
    }
  | { action: "remove-gradient"; payload?: Record<string, never> }
  | {
      action: "apply-text-shadow";
      payload: { enabled: boolean; color?: string; blur?: number; offsetX?: number; offsetY?: number };
    }
  | { action: "apply-text-stroke"; payload: { enabled: boolean; color?: string; width?: number } }
  | { action: "apply-text-glow"; payload: { enabled: boolean; color?: string; blur?: number } }
  | { action: "reset-text-effects"; payload?: Record<string, never> }
  | { action: "set-crop-aspect-ratio"; payload: { aspectRatio: number | null } }
  | { action: "export"; payload: { format: "png" | "jpeg" | "jpg" | "svg" | "pdf"; multiplier?: number } }
  | { action: SimpleStudioAction };

export type StudioAction = SimpleStudioAction | StudioActionDetail;

export type LayerActionDetail = {
  action: "select" | "toggle-visibility" | "toggle-lock" | "delete" | "rename" | "reorder";
  objectId: string;
  targetObjectId?: string;
  name?: string;
};

export function emitStudioAction(detail: StudioAction) {
  window.dispatchEvent(new CustomEvent(STUDIO_ACTION_EVENT, { detail }));
}

export function emitLayerAction(detail: LayerActionDetail) {
  window.dispatchEvent(new CustomEvent(STUDIO_LAYER_ACTION_EVENT, { detail }));
}

export function setActionDragPayload(event: React.DragEvent, detail: StudioAction) {
  event.dataTransfer.setData(STUDIO_DRAG_TYPE, JSON.stringify(detail));
  event.dataTransfer.effectAllowed = "copy";
}
