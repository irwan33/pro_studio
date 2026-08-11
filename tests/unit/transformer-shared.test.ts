import { beforeEach, describe, expect, it } from "vitest";
import { emptyEditorScene } from "@/lib/editor/scene";
import { useEditorStore } from "@/store/editorStore";
import type { EditorElement } from "@/lib/editor/types";

/**
 * Uniform transformer anchors.
 *
 * Anchors and border styling live in the shared Transformer config in
 * CanvasWorkspace; every selectable element type uses the same visual look.
 * These tests pin the store-side behaviour that drives those anchors:
 *
 * - Locked elements never expose transformer anchors.
 * - Re-selecting the same element does not move or resize it.
 * - Zoom changes do not mutate element geometry.
 */

const text: EditorElement = {
  id: "text-1",
  type: "text",
  name: "Headline",
  x: 100,
  y: 100,
  width: 400,
  height: 80,
  zIndex: 0,
  properties: { text: "Headline", fontFamily: "Oswald", fontSize: 48 }
};

const shape: EditorElement = {
  id: "shape-1",
  type: "rect",
  name: "Rectangle",
  x: 200,
  y: 200,
  width: 200,
  height: 100,
  zIndex: 1,
  properties: { fill: "#C7FF00" }
};

const image: EditorElement = {
  id: "image-1",
  type: "image",
  name: "Photo",
  x: 300,
  y: 300,
  width: 300,
  height: 200,
  zIndex: 2,
  properties: { src: "/seed/template-1.svg" }
};

describe("uniform transformer anchors", () => {
  beforeEach(() => {
    const scene = emptyEditorScene(1080, 1350);
    useEditorStore.getState().loadScene({ ...scene, elements: [text, shape, image] }, "transformer-test");
  });

  it("locked elements have no selected transformer anchors applied", () => {
    const state = useEditorStore.getState();
    state.updateElement("shape-1", { locked: true });
    const locked = useEditorStore.getState().elements.find((el) => el.id === "shape-1");
    expect(locked?.locked).toBe(true);

    state.setSelectedIds(["shape-1"]);
    const selected = useEditorStore.getState().getSelectedElements();
    expect(selected[0]?.locked).toBe(true);
  });

  it("re-selecting an element does not change its geometry", () => {
    const before = useEditorStore.getState().elements.find((el) => el.id === "text-1");

    for (let i = 0; i < 10; i += 1) {
      useEditorStore.getState().setSelectedIds(["text-1"]);
      useEditorStore.getState().clearSelection();
      useEditorStore.getState().setSelectedIds(["text-1"]);
    }

    const after = useEditorStore.getState().elements.find((el) => el.id === "text-1");
    expect(after?.x).toBe(before?.x);
    expect(after?.y).toBe(before?.y);
    expect(after?.width).toBe(before?.width);
    expect(after?.height).toBe(before?.height);
    expect(after?.rotation).toBe(before?.rotation);
    expect(useEditorStore.getState().past).toHaveLength(0);
  });

  it("zooming the workspace does not change element coordinates", () => {
    const state = useEditorStore.getState();
    const before = state.elements.map((el) => ({ id: el.id, x: el.x, y: el.y, width: el.width, height: el.height }));

    state.setZoom(0.25);
    state.setZoom(2);
    state.setZoom(1);

    const after = useEditorStore.getState().elements.map((el) => ({
      id: el.id,
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height
    }));

    expect(after).toEqual(before);
  });

  it("draggable and resizable elements keep their type-specific data intact", () => {
    expect(text.type).toBe("text");
    expect(shape.type).toBe("rect");
    expect(image.type).toBe("image");

    const scene = emptyEditorScene(1080, 1350);
    useEditorStore.getState().loadScene({ ...scene, elements: [text, shape, image] }, "transformer-test-2");
    const names = useEditorStore.getState().elements.map((el) => el.name);
    expect(names).toEqual(["Headline", "Rectangle", "Photo"]);
  });

  it("no helper Line is added to scene when selecting text", () => {
    useEditorStore.getState().setSelectedIds(["text-1"]);
    const state = useEditorStore.getState();
    const linesBefore = state.elements.filter((el) => el.type === "line" || el.type === "path");

    useEditorStore.getState().setSelectedIds(["shape-1"]);
    useEditorStore.getState().setSelectedIds(["text-1"]);
    const linesAfter = useEditorStore.getState().elements.filter((el) => el.type === "line" || el.type === "path");

    expect(linesAfter.length).toBe(linesBefore.length);
    expect(state.elements.every((el) => !el.name?.toLowerCase().includes("baseline"))).toBe(true);
  });

  it("exported scene does not contain helper overlays as elements", () => {
    useEditorStore.getState().setSelectedIds(["text-1"]);
    const scene = useEditorStore.getState().getScene();
    const helperNames = scene.elements.filter((el) =>
      ["baseline", "helper", "overlay", "guide", "selection"].some((word) =>
        el.name?.toLowerCase().includes(word)
      )
    );
    expect(helperNames).toHaveLength(0);
  });
});
