import { getElementBox } from "@/lib/editor/coordinates";
import type { EditorElement } from "@/lib/editor/types";

export type AlignmentLine = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: "vertical" | "horizontal";
};

export const SNAP_THRESHOLD = 8;

type Bounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  centerX: number;
  centerY: number;
};

function boundsOf(element: EditorElement, position?: { x: number; y: number }): Bounds {
  const box = getElementBox(element);
  const left = position?.x ?? box.x;
  const top = position?.y ?? box.y;
  return {
    left,
    top,
    right: left + box.width,
    bottom: top + box.height,
    centerX: left + box.width / 2,
    centerY: top + box.height / 2
  };
}

/**
 * Guides shown while dragging: canvas centre plus edge/centre alignment with
 * every other visible element.
 */
export function findAlignmentLines(
  elements: EditorElement[],
  active: EditorElement,
  canvas: { width: number; height: number },
  position?: { x: number; y: number }
): AlignmentLine[] {
  const lines: AlignmentLine[] = [];
  const a = boundsOf(active, position);
  const canvasCenterX = canvas.width / 2;
  const canvasCenterY = canvas.height / 2;

  if (Math.abs(a.centerX - canvasCenterX) < SNAP_THRESHOLD) {
    lines.push({ x1: canvasCenterX, y1: 0, x2: canvasCenterX, y2: canvas.height, type: "vertical" });
  }
  if (Math.abs(a.centerY - canvasCenterY) < SNAP_THRESHOLD) {
    lines.push({ x1: 0, y1: canvasCenterY, x2: canvas.width, y2: canvasCenterY, type: "horizontal" });
  }

  for (const element of elements) {
    if (element.id === active.id || element.visible === false) continue;
    const b = boundsOf(element);

    if (Math.abs(a.left - b.left) < SNAP_THRESHOLD) {
      lines.push({ x1: b.left, y1: Math.min(a.top, b.top), x2: b.left, y2: Math.max(a.bottom, b.bottom), type: "vertical" });
    }
    if (Math.abs(a.right - b.right) < SNAP_THRESHOLD) {
      lines.push({ x1: b.right, y1: Math.min(a.top, b.top), x2: b.right, y2: Math.max(a.bottom, b.bottom), type: "vertical" });
    }
    if (Math.abs(a.centerX - b.centerX) < SNAP_THRESHOLD) {
      lines.push({ x1: b.centerX, y1: Math.min(a.top, b.top) - 20, x2: b.centerX, y2: Math.max(a.bottom, b.bottom) + 20, type: "vertical" });
    }
    if (Math.abs(a.top - b.top) < SNAP_THRESHOLD) {
      lines.push({ x1: Math.min(a.left, b.left), y1: b.top, x2: Math.max(a.right, b.right), y2: b.top, type: "horizontal" });
    }
    if (Math.abs(a.bottom - b.bottom) < SNAP_THRESHOLD) {
      lines.push({ x1: Math.min(a.left, b.left), y1: b.bottom, x2: Math.max(a.right, b.right), y2: b.bottom, type: "horizontal" });
    }
    if (Math.abs(a.centerY - b.centerY) < SNAP_THRESHOLD) {
      lines.push({ x1: Math.min(a.left, b.left) - 20, y1: b.centerY, x2: Math.max(a.right, b.right) + 20, y2: b.centerY, type: "horizontal" });
    }
  }

  return lines;
}

/** Returns the snapped top-left position for the dragged element. */
export function snapToAlignment(
  elements: EditorElement[],
  active: EditorElement,
  canvas: { width: number; height: number },
  position: { x: number; y: number }
): { x: number; y: number } {
  const box = getElementBox(active);
  let x = position.x;
  let y = position.y;

  const canvasCenterX = canvas.width / 2;
  const canvasCenterY = canvas.height / 2;
  if (Math.abs(x + box.width / 2 - canvasCenterX) < SNAP_THRESHOLD) x = canvasCenterX - box.width / 2;
  if (Math.abs(y + box.height / 2 - canvasCenterY) < SNAP_THRESHOLD) y = canvasCenterY - box.height / 2;

  for (const element of elements) {
    if (element.id === active.id || element.visible === false) continue;
    const b = boundsOf(element);

    if (Math.abs(x - b.left) < SNAP_THRESHOLD) x = b.left;
    if (Math.abs(x + box.width - b.right) < SNAP_THRESHOLD) x = b.right - box.width;
    if (Math.abs(x + box.width / 2 - b.centerX) < SNAP_THRESHOLD) x = b.centerX - box.width / 2;
    if (Math.abs(y - b.top) < SNAP_THRESHOLD) y = b.top;
    if (Math.abs(y + box.height - b.bottom) < SNAP_THRESHOLD) y = b.bottom - box.height;
    if (Math.abs(y + box.height / 2 - b.centerY) < SNAP_THRESHOLD) y = b.centerY - box.height / 2;
  }

  return { x, y };
}
