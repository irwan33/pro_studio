import type Konva from "konva";
import { stageToDataUrl } from "@/lib/editor/export";
import { getStage } from "@/lib/editor/stage-registry";

/**
 * Generate a low-resolution dashboard thumbnail from the registered Konva stage.
 *
 * Any visible Transformer nodes are temporarily hidden so the selection chrome
 * does not appear in the preview, then restored to their previous state. This
 * avoids the React render timing issues that come with clearing and restoring
 * selection, while still producing a clean thumbnail.
 */
export function generateThumbnailFromStage(size: { width: number; height: number }): string | null {
  const stage = getStage();
  if (!stage) return null;
  try {
    const transformers = stage.find("Transformer") as Konva.Transformer[];
    const hidden = transformers.map((node) => {
      const previous = node.visible();
      node.visible(false);
      return { node, previous };
    });
    const dataUrl = stageToDataUrl(stage, size, { format: "png", pixelRatio: 0.2, quality: 0.85 });
    hidden.forEach(({ node, previous }) => node.visible(previous));
    return dataUrl;
  } catch {
    return null;
  }
}
