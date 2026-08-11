import type { CropConfig } from "@/lib/editor/types";

/**
 * `object-fit: cover` geometry for image elements.
 *
 * The editor renders images with Konva's `crop`, so covering a box is expressed
 * as two serializable parts:
 *
 * - the element box in artboard coordinates (`x`, `y`, `width`, `height`)
 * - a centred `crop` rectangle in *source image pixels*
 *
 * Nothing here reads or writes a Konva node: the result is normalised into the
 * editor store, so it survives save, reload, undo and export.
 */

export type Size = { width: number; height: number };

export type CoverFit = {
  /** Element box in artboard coordinates. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Centred crop rectangle in source-image pixels. */
  crop: CropConfig;
  /** Scale the source is drawn at, i.e. `max(bw / iw, bh / ih)`. */
  scale: number;
  /** Size the uncropped source would occupy at `scale` (CSS equivalent). */
  renderedWidth: number;
  renderedHeight: number;
  /** Offset of that uncropped render, i.e. the overflow that gets cropped away. */
  offsetX: number;
  offsetY: number;
};

const round = (value: number) => Math.round(value * 100) / 100;

function usableSize(size: Partial<Size> | null | undefined): Size | null {
  const width = Number(size?.width);
  const height = Number(size?.height);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  if (width <= 0 || height <= 0) return null;
  return { width, height };
}

/**
 * Centred crop rectangle that makes `natural` cover `box` without distortion.
 *
 * Returns `null` when either size is unusable, so callers can fall back to an
 * uncropped image instead of writing a nonsense crop into the scene.
 */
export function coverCrop(
  natural: Partial<Size> | null | undefined,
  box: Partial<Size> | null | undefined
): CropConfig | null {
  const source = usableSize(natural);
  const target = usableSize(box);
  if (!source || !target) return null;

  const scale = Math.max(target.width / source.width, target.height / source.height);
  const cropWidth = Math.min(source.width, target.width / scale);
  const cropHeight = Math.min(source.height, target.height / scale);

  return {
    x: round(Math.max(0, (source.width - cropWidth) / 2)),
    y: round(Math.max(0, (source.height - cropHeight) / 2)),
    width: round(cropWidth),
    height: round(cropHeight)
  };
}

/**
 * Full cover placement of `natural` over `canvas`.
 *
 * The element box is the whole artboard, so no transparent gap can remain, and
 * the aspect ratio is preserved by cropping the overflow evenly instead of
 * stretching the node.
 */
export function coverCanvas(natural: Partial<Size> | null | undefined, canvas: Size): CoverFit {
  const source = usableSize(natural);
  const scale = source
    ? Math.max(canvas.width / source.width, canvas.height / source.height)
    : 1;
  const renderedWidth = source ? source.width * scale : canvas.width;
  const renderedHeight = source ? source.height * scale : canvas.height;

  return {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height,
    crop:
      coverCrop(source, canvas) ?? {
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height
      },
    scale: round(scale),
    renderedWidth: round(renderedWidth),
    renderedHeight: round(renderedHeight),
    // The CSS-equivalent centred placement. Kept for reference and assertions:
    // the element itself stays at 0,0 because the overflow lives in `crop`.
    offsetX: round((canvas.width - renderedWidth) / 2),
    offsetY: round((canvas.height - renderedHeight) / 2)
  };
}

/** True when an element box already fills the artboard exactly. */
export function coversCanvas(
  box: { x: number; y: number; width?: number; height?: number },
  canvas: Size
) {
  return (
    Math.abs(box.x) < 0.5 &&
    Math.abs(box.y) < 0.5 &&
    Math.abs((box.width ?? 0) - canvas.width) < 0.5 &&
    Math.abs((box.height ?? 0) - canvas.height) < 0.5
  );
}
