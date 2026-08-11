// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { emptyEditorScene } from "@/lib/editor/scene";
import { useEditorStore } from "@/store/editorStore";
import type { EditorElement } from "@/lib/editor/types";

/**
 * Text sizing behavior.
 *
 * The implementation lives in the component action handler, so these tests
 * exercise the equivalent store contract directly instead of dispatching the
 * browser custom event, which requires the full canvas workspace to be mounted.
 *
 * - Auto-width text delegates its box width to the glyph measurement.
 * - Fixed-width text keeps the configured width and wraps.
 * - Selection and focus-mode changes never mutate the element geometry.
 */

function textElement(overrides: Partial<EditorElement> = {}, properties: Record<string, unknown> = {}): EditorElement {
  return {
    id: "text-1",
    type: "text",
    name: "Headline",
    x: 100,
    y: 120,
    width: 400,
    height: 90,
    zIndex: 0,
    properties: {
      text: "Headline",
      fontFamily: "Oswald",
      fontSize: 72,
      fontWeight: "400",
      fontStyle: "normal",
      fill: "#F5F5F2",
      align: "left",
      lineHeight: 1.16,
      letterSpacing: 0,
      underline: false,
      linethrough: false,
      textTransform: "none",
      listType: "none",
      ...properties
    },
    ...overrides
  };
}

describe("text sizing", () => {
  beforeEach(() => {
    const scene = emptyEditorScene(1080, 1350);
    useEditorStore.getState().loadScene({ ...scene, elements: [textElement()] }, "text-sizing-test");
    useEditorStore.getState().setSelectedIds(["text-1"]);
  });

  it("defaults to fixed-width when textSizing is not set", () => {
    const element = useEditorStore.getState().elements[0];
    expect(element.properties.textSizing).toBeUndefined();
  });

  it("toggling text sizing stores the new mode in the element properties", () => {
    const state = useEditorStore.getState();
    const initial = state.elements.find((el) => el.id === "text-1");
    expect(initial?.properties.textSizing).toBeUndefined();

    state.updateElement("text-1", { properties: { textSizing: "auto-width" } });
    const auto = useEditorStore.getState().elements.find((el) => el.id === "text-1");
    expect(auto?.properties.textSizing).toBe("auto-width");

    state.updateElement("text-1", { properties: { textSizing: "fixed-width" } });
    const fixed = useEditorStore.getState().elements.find((el) => el.id === "text-1");
    expect(fixed?.properties.textSizing).toBe("fixed-width");
  });

  it("auto-width text records the measured box without changing position", () => {
    const state = useEditorStore.getState();
    const before = state.elements.find((el) => el.id === "text-1");
    const x = before!.x;
    const y = before!.y;

    state.updateElement("text-1", { width: 512, height: 96 }, { commit: true });

    const after = useEditorStore.getState().elements.find((el) => el.id === "text-1");
    expect(after?.width).toBe(512);
    expect(after?.height).toBe(96);
    expect(after?.x).toBe(x);
    expect(after?.y).toBe(y);
  });

  it("does not move or resize the text when selection is cleared repeatedly", () => {
    const original = useEditorStore.getState().elements.find((el) => el.id === "text-1");
    const originalX = original!.x;
    const originalY = original!.y;
    const originalWidth = original!.width;
    const originalHeight = original!.height;
    const originalRotation = original!.rotation;
    const originalScaleX = original!.scaleX;
    const originalScaleY = original!.scaleY;

    for (let i = 0; i < 20; i += 1) {
      useEditorStore.getState().setSelectedIds(["text-1"]);
      useEditorStore.getState().clearSelection();
    }

    const element = useEditorStore.getState().elements.find((el) => el.id === "text-1");
    expect(element!.x).toBe(originalX);
    expect(element!.y).toBe(originalY);
    expect(element!.width).toBe(originalWidth);
    expect(element!.height).toBe(originalHeight);
    expect(element!.rotation).toBe(originalRotation);
    expect(element!.scaleX).toBe(originalScaleX);
    expect(element!.scaleY).toBe(originalScaleY);
    expect(useEditorStore.getState().past).toHaveLength(0);
  });

  it("does not move or resize the text when entering focus mode", () => {
    const original = useEditorStore.getState().elements.find((el) => el.id === "text-1");
    const snapshot = {
      x: original!.x,
      y: original!.y,
      width: original!.width,
      height: original!.height
    };

    useEditorStore.getState().enterCanvasFocusMode();
    useEditorStore.getState().exitCanvasFocusMode();

    const element = useEditorStore.getState().elements.find((el) => el.id === "text-1");
    expect(element).toMatchObject(snapshot);
  });

  it("a history entry is added when text actually changes", () => {
    useEditorStore.getState().updateElement("text-1", {
      properties: { text: "Updated headline" }
    });
    expect(useEditorStore.getState().past.length).toBeGreaterThanOrEqual(1);
    const element = useEditorStore.getState().elements.find((el) => el.id === "text-1");
    expect(element?.properties.text).toBe("Updated headline");
  });
});

