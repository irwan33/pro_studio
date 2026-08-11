import { beforeEach, describe, expect, it } from "vitest";
import { coverCanvas, coverCrop, coversCanvas } from "@/lib/editor/image-fit";
import { createImageElement } from "@/lib/editor/factory";
import { useEditorStore } from "@/store/editorStore";
import { emptyEditorScene } from "@/lib/editor/scene";
import type { EditorElement } from "@/lib/editor/types";

/**
 * `object-fit: cover` behaviour for image elements.
 *
 * A covered image always fills the artboard exactly, so the assertions check two
 * things together: the element box equals the canvas (no gaps), and the crop
 * rectangle keeps the source aspect ratio (no distortion).
 */

const PORTRAIT_CANVAS = { width: 1080, height: 1350 };
const LANDSCAPE_CANVAS = { width: 1600, height: 900 };

/** Aspect ratio the crop rectangle will actually be drawn at. */
function cropRatio(crop: { width: number; height: number }) {
  return crop.width / crop.height;
}

describe("image cover fit", () => {
  it("covers a portrait canvas with a landscape image", () => {
    const fit = coverCanvas({ width: 4000, height: 2000 }, PORTRAIT_CANVAS);

    expect(fit.x).toBe(0);
    expect(fit.y).toBe(0);
    expect(fit.width).toBe(1080);
    expect(fit.height).toBe(1350);
    // The height is the binding dimension: 1350/2000 = 0.675, reported rounded
    // to two decimals like every other value in the fit.
    expect(fit.scale).toBe(0.68);
    expect(fit.renderedWidth).toBeGreaterThanOrEqual(PORTRAIT_CANVAS.width);
    expect(fit.renderedHeight).toBeCloseTo(PORTRAIT_CANVAS.height, 1);
  });

  it("covers a landscape canvas with a portrait image", () => {
    const fit = coverCanvas({ width: 1000, height: 3000 }, LANDSCAPE_CANVAS);

    expect(fit.width).toBe(1600);
    expect(fit.height).toBe(900);
    // The width is the binding dimension here.
    expect(fit.scale).toBeCloseTo(1.6, 3);
    expect(fit.renderedHeight).toBeGreaterThanOrEqual(LANDSCAPE_CANVAS.height);
  });

  it("leaves no gap around the canvas in either orientation", () => {
    for (const natural of [
      { width: 4000, height: 2000 },
      { width: 1000, height: 3000 },
      { width: 500, height: 500 },
      { width: 1080, height: 1350 }
    ]) {
      for (const canvas of [PORTRAIT_CANVAS, LANDSCAPE_CANVAS]) {
        const fit = coverCanvas(natural, canvas);
        expect(fit.renderedWidth + 0.01).toBeGreaterThanOrEqual(canvas.width);
        expect(fit.renderedHeight + 0.01).toBeGreaterThanOrEqual(canvas.height);
        expect(coversCanvas(fit, canvas)).toBe(true);
      }
    }
  });

  it("does not distort the image: the crop matches the canvas aspect ratio", () => {
    const canvasRatio = PORTRAIT_CANVAS.width / PORTRAIT_CANVAS.height;
    const wide = coverCanvas({ width: 4000, height: 2000 }, PORTRAIT_CANVAS);
    const tall = coverCanvas({ width: 1000, height: 3000 }, PORTRAIT_CANVAS);

    // Drawing `crop` into the element box is only undistorted when the crop and
    // the box share an aspect ratio.
    expect(cropRatio(wide.crop)).toBeCloseTo(canvasRatio, 3);
    expect(cropRatio(tall.crop)).toBeCloseTo(canvasRatio, 3);
  });

  it("centres the crop so the overflow is cropped evenly", () => {
    const fit = coverCanvas({ width: 4000, height: 2000 }, PORTRAIT_CANVAS);
    // Only the horizontal axis overflows for a wide source over a tall canvas.
    expect(fit.crop.y).toBe(0);
    expect(fit.crop.height).toBeCloseTo(2000, 1);
    const leftover = 4000 - fit.crop.width;
    expect(fit.crop.x).toBeCloseTo(leftover / 2, 1);

    const tall = coverCanvas({ width: 1000, height: 3000 }, PORTRAIT_CANVAS);
    expect(tall.crop.x).toBe(0);
    expect(tall.crop.y).toBeCloseTo((3000 - tall.crop.height) / 2, 1);
  });

  it("computes a centred cover crop for an arbitrary box", () => {
    const crop = coverCrop({ width: 200, height: 100 }, { width: 50, height: 50 });
    expect(crop).toEqual({ x: 50, y: 0, width: 100, height: 100 });
  });

  it("returns no crop for unusable sizes instead of writing nonsense", () => {
    expect(coverCrop({ width: 0, height: 100 }, { width: 50, height: 50 })).toBeNull();
    expect(coverCrop(undefined, { width: 50, height: 50 })).toBeNull();
    expect(coverCrop({ width: 100, height: 100 }, { width: 0, height: 0 })).toBeNull();
  });
});

describe("new image insertion", () => {
  it("covers the artboard when a canvas is supplied", () => {
    const element = createImageElement({
      src: "data:image/png;base64,xxx",
      name: "Stadium",
      naturalWidth: 4000,
      naturalHeight: 2000,
      canvas: PORTRAIT_CANVAS
    });

    expect(element.type).toBe("image");
    expect(element.x).toBe(0);
    expect(element.y).toBe(0);
    expect(element.width).toBe(1080);
    expect(element.height).toBe(1350);
    expect(element.properties.crop).toBeTruthy();
    expect(element.properties.naturalWidth).toBe(4000);
    // Scale stays at 1: the fit lives in width/height plus crop, not in a
    // visual node scale.
    expect(element.scaleX).toBe(1);
    expect(element.scaleY).toBe(1);
  });

  it("keeps the legacy contained placement when no canvas is supplied", () => {
    const element = createImageElement({
      src: "x",
      naturalWidth: 4000,
      naturalHeight: 2000
    });
    expect(element.properties.crop).toBeNull();
    expect(element.width).toBeLessThan(1080);
  });
});

describe("replaceImage", () => {
  const templateFrame: EditorElement = {
    id: "template-photo",
    type: "image",
    name: "Template Photo",
    x: 120,
    y: 240,
    width: 400,
    height: 300,
    rotation: 12,
    scaleX: 1,
    scaleY: 1,
    opacity: 0.8,
    visible: true,
    locked: false,
    zIndex: 3,
    properties: {
      src: "/original.jpg",
      naturalWidth: 800,
      naturalHeight: 600,
      crop: { x: 0, y: 0, width: 800, height: 600 },
      cornerRadius: 24,
      filters: { brightness: 0.2 },
      flipX: true
    }
  };

  function seed(elements: EditorElement[]) {
    const scene = emptyEditorScene(PORTRAIT_CANVAS.width, PORTRAIT_CANVAS.height);
    useEditorStore.getState().loadScene({ ...scene, elements }, "test-project");
  }

  beforeEach(() => {
    seed([templateFrame]);
  });

  it("replaces the source and preserves the element identity", () => {
    useEditorStore.getState().replaceImage("template-photo", {
      src: "/replacement.jpg",
      naturalWidth: 2000,
      naturalHeight: 1000
    });

    const element = useEditorStore.getState().elements[0];
    expect(element.id).toBe("template-photo");
    expect(element.properties.src).toBe("/replacement.jpg");
    expect(element.properties.naturalWidth).toBe(2000);
  });

  it("preserves position, dimensions and every unrelated property", () => {
    useEditorStore.getState().replaceImage("template-photo", {
      src: "/replacement.jpg",
      naturalWidth: 2000,
      naturalHeight: 1000
    });

    const element = useEditorStore.getState().elements[0];
    expect(element.x).toBe(120);
    expect(element.y).toBe(240);
    expect(element.width).toBe(400);
    expect(element.height).toBe(300);
    expect(element.rotation).toBe(12);
    expect(element.opacity).toBe(0.8);
    expect(element.visible).toBe(true);
    expect(element.locked).toBe(false);
    expect(element.zIndex).toBe(0);
    expect(element.name).toBe("Template Photo");
    // Frame/mask and filter settings survive the swap.
    expect(element.properties.cornerRadius).toBe(24);
    expect(element.properties.filters).toEqual({ brightness: 0.2 });
    expect(element.properties.flipX).toBe(true);
  });

  it("recalculates the crop with cover behaviour inside the existing frame", () => {
    useEditorStore.getState().replaceImage("template-photo", {
      src: "/replacement.jpg",
      naturalWidth: 2000,
      naturalHeight: 1000
    });

    const crop = useEditorStore.getState().elements[0].properties.crop as {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    // The 400x300 frame is 4:3, so a 2:1 source is cropped horizontally.
    expect(cropRatio(crop)).toBeCloseTo(400 / 300, 3);
    expect(crop.y).toBe(0);
    expect(crop.x).toBeCloseTo((2000 - crop.width) / 2, 1);
  });

  it("adds exactly one history entry and marks the project dirty", () => {
    const before = useEditorStore.getState().past.length;
    useEditorStore.getState().replaceImage("template-photo", {
      src: "/replacement.jpg",
      naturalWidth: 2000,
      naturalHeight: 1000
    });

    expect(useEditorStore.getState().past.length).toBe(before + 1);
    expect(useEditorStore.getState().dirty).toBe(true);

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().elements[0].properties.src).toBe("/original.jpg");
    useEditorStore.getState().redo();
    expect(useEditorStore.getState().elements[0].properties.src).toBe("/replacement.jpg");
  });

  it("does not duplicate or recreate the layer", () => {
    useEditorStore.getState().replaceImage("template-photo", { src: "/replacement.jpg" });
    const elements = useEditorStore.getState().elements;
    expect(elements).toHaveLength(1);
    expect(elements[0].id).toBe("template-photo");
  });

  it("keeps the replaced element selected and clears the pending flag", () => {
    const store = useEditorStore.getState();
    store.setSelectedIds(["template-photo"]);
    store.setPendingReplaceId("template-photo");
    store.replaceImage("template-photo", { src: "/replacement.jpg" });

    expect(useEditorStore.getState().selectedIds).toEqual(["template-photo"]);
    expect(useEditorStore.getState().pendingReplaceId).toBeNull();
  });

  it("ignores non-image elements and empty sources", () => {
    const text: EditorElement = {
      id: "text-1",
      type: "text",
      name: "Title",
      x: 0,
      y: 0,
      zIndex: 0,
      properties: { text: "hi" }
    };
    seed([text]);
    useEditorStore.getState().replaceImage("text-1", { src: "/x.jpg" });
    expect(useEditorStore.getState().elements[0].properties.text).toBe("hi");
    expect(useEditorStore.getState().past).toHaveLength(0);

    seed([templateFrame]);
    useEditorStore.getState().replaceImage("template-photo", { src: "" });
    expect(useEditorStore.getState().elements[0].properties.src).toBe("/original.jpg");
  });

  it("covers the canvas on demand without touching other elements", () => {
    useEditorStore.getState().coverCanvasWithImage("template-photo");
    const element = useEditorStore.getState().elements[0];

    expect(element.x).toBe(0);
    expect(element.y).toBe(0);
    expect(element.width).toBe(PORTRAIT_CANVAS.width);
    expect(element.height).toBe(PORTRAIT_CANVAS.height);
    expect(element.rotation).toBe(0);
    expect(element.properties.src).toBe("/original.jpg");
    expect(element.properties.cornerRadius).toBe(24);
  });
});

describe("template image replacement", () => {
  /**
   * A template scene: a locked background, a photo placeholder inside a frame,
   * and a caption above it. Replacing the photo must not disturb the layout
   * around it.
   */
  const background: EditorElement = {
    id: "tpl-bg",
    type: "rect",
    name: "Black Background",
    x: 0,
    y: 0,
    width: 1080,
    height: 1350,
    zIndex: 0,
    locked: true,
    properties: { fill: "#000000" }
  };

  const placeholder: EditorElement = {
    id: "tpl-photo",
    type: "image",
    name: "Player Photo",
    x: 90,
    y: 300,
    width: 900,
    height: 600,
    rotation: -4,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 1,
    properties: {
      src: "/seed/placeholder.svg",
      naturalWidth: 1200,
      naturalHeight: 800,
      crop: { x: 0, y: 0, width: 1200, height: 800 },
      cornerRadius: 32
    }
  };

  const caption: EditorElement = {
    id: "tpl-caption",
    type: "text",
    name: "Quote Text",
    x: 70,
    y: 1086,
    width: 760,
    zIndex: 2,
    properties: { text: "Back and ready to work", fontFamily: "Impact" }
  };

  beforeEach(() => {
    const scene = emptyEditorScene(PORTRAIT_CANVAS.width, PORTRAIT_CANVAS.height);
    useEditorStore
      .getState()
      .loadScene({ ...scene, elements: [background, placeholder, caption] }, "template-test");
    useEditorStore.getState().setSelectedIds(["tpl-photo"]);
    useEditorStore.getState().setPendingReplaceId("tpl-photo");
  });

  it("replaces the placeholder without deleting it first", () => {
    useEditorStore.getState().replaceImage("tpl-photo", {
      src: "/uploads/player.jpg",
      naturalWidth: 3000,
      naturalHeight: 3000
    });

    const elements = useEditorStore.getState().elements;
    // Same count, same ids, same order: nothing was removed and recreated.
    expect(elements.map((element) => element.id)).toEqual(["tpl-bg", "tpl-photo", "tpl-caption"]);
    expect(elements.map((element) => element.zIndex)).toEqual([0, 1, 2]);
    expect(elements[1].properties.src).toBe("/uploads/player.jpg");
  });

  it("keeps the template frame, placement and radius", () => {
    useEditorStore.getState().replaceImage("tpl-photo", {
      src: "/uploads/player.jpg",
      naturalWidth: 3000,
      naturalHeight: 3000
    });

    const photo = useEditorStore.getState().elements[1];
    expect(photo.x).toBe(90);
    expect(photo.y).toBe(300);
    expect(photo.width).toBe(900);
    expect(photo.height).toBe(600);
    expect(photo.rotation).toBe(-4);
    expect(photo.properties.cornerRadius).toBe(32);
    expect(photo.name).toBe("Player Photo");
  });

  it("recalculates cover cropping inside the template frame", () => {
    useEditorStore.getState().replaceImage("tpl-photo", {
      src: "/uploads/player.jpg",
      naturalWidth: 3000,
      naturalHeight: 3000
    });

    const crop = useEditorStore.getState().elements[1].properties.crop as {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    // A square source in a 3:2 frame is cropped vertically, centred.
    expect(cropRatio(crop)).toBeCloseTo(900 / 600, 3);
    expect(crop.x).toBe(0);
    expect(crop.y).toBeCloseTo((3000 - crop.height) / 2, 1);
  });

  it("leaves the surrounding template elements untouched", () => {
    useEditorStore.getState().replaceImage("tpl-photo", { src: "/uploads/player.jpg" });
    const [bg, , text] = useEditorStore.getState().elements;

    expect(bg.locked).toBe(true);
    expect(bg.properties.fill).toBe("#000000");
    expect(text.properties.text).toBe("Back and ready to work");
    expect(text.properties.fontFamily).toBe("Impact");
    expect(text.x).toBe(70);
  });

  it("does not resize an existing image merely because it was selected", () => {
    const before = useEditorStore.getState().elements[1];
    useEditorStore.getState().clearSelection();
    useEditorStore.getState().setSelectedIds(["tpl-photo"]);
    const after = useEditorStore.getState().elements[1];

    // Selection must never trigger the cover recalculation.
    expect(after.x).toBe(before.x);
    expect(after.y).toBe(before.y);
    expect(after.width).toBe(before.width);
    expect(after.height).toBe(before.height);
    expect(after.properties.crop).toEqual(before.properties.crop);
    expect(useEditorStore.getState().past).toHaveLength(0);
  });
});
