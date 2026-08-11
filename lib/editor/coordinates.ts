import type { EditorElement } from "@/lib/editor/types";

/**
 * Geometry helpers for the editor.
 *
 * Convention used across the editor:
 * - `x` / `y` are always the top-left corner of the un-rotated bounding box,
 *   expressed in canvas (artboard) coordinates.
 * - `width` / `height` are the un-scaled box size. After a transform we bake the
 *   scale back into width/height so `scaleX`/`scaleY` stay at 1. The only
 *   exception is `path`, which cannot be resized without scaling in Konva.
 */

export const MIN_ELEMENT_SIZE = 5;

export function keepsScale(element: Pick<EditorElement, "type">) {
  return element.type === "path";
}

export function getElementBox(element: EditorElement) {
  const scaleX = keepsScale(element) ? element.scaleX ?? 1 : 1;
  const scaleY = keepsScale(element) ? element.scaleY ?? 1 : 1;
  return {
    x: element.x,
    y: element.y,
    width: Math.max(0, (element.width ?? 0) * scaleX),
    height: Math.max(0, (element.height ?? 0) * scaleY)
  };
}

export function getElementCenter(element: EditorElement) {
  const box = getElementBox(element);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

export function clampSize(value: number) {
  return Math.max(MIN_ELEMENT_SIZE, Math.abs(value));
}

export function round(value: number, precision = 2) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export function degToRad(degrees: number) {
  return (degrees * Math.PI) / 180;
}

/** Converts a pointer position on the stage container to artboard coordinates. */
export function pointerToCanvas(clientX: number, clientY: number, rect: DOMRect, zoom: number) {
  return {
    x: (clientX - rect.left) / zoom,
    y: (clientY - rect.top) / zoom
  };
}

/** Scale needed to fit `content` inside `viewport` while keeping some padding. */
export function fitScale(
  content: { width: number; height: number },
  viewport: { width: number; height: number },
  padding = 96
) {
  const availableWidth = Math.max(120, viewport.width - padding);
  const availableHeight = Math.max(120, viewport.height - padding);
  if (content.width <= 0 || content.height <= 0) return 1;
  return Math.min(availableWidth / content.width, availableHeight / content.height);
}
