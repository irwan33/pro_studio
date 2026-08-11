import { beforeEach, describe, expect, it } from "vitest";
import { emptyEditorScene } from "@/lib/editor/scene";
import { useEditorStore } from "@/store/editorStore";
import type { EditorElement } from "@/lib/editor/types";

describe("canvas object movement regression", () => {
  const rect: EditorElement = {
    id: "rect-1",
    type: "rect",
    name: "Rectangle",
    x: 120,
    y: 200,
    width: 160,
    height: 90,
    zIndex: 0,
    properties: { fill: "#C7FF00" }
  };

  const text: EditorElement = {
    id: "text-1",
    type: "text",
    name: "Title",
    x: 80,
    y: 150,
    width: 300,
    height: 80,
    zIndex: 1,
    properties: {
      text: "Title",
      fontFamily: "Inter",
      fontSize: 48,
      fontWeight: "400",
      fontStyle: "normal",
      fill: "#ffffff",
      align: "left",
      lineHeight: 1.16,
      letterSpacing: 0,
      underline: false,
      linethrough: false,
      textTransform: "none",
      listType: "none"
    }
  };

  const image: EditorElement = {
    id: "image-1",
    type: "image",
    name: "Photo",
    x: 40,
    y: 60,
    width: 240,
    height: 160,
    zIndex: 2,
    properties: { src: "/seed/template-1.svg" }
  };

  beforeEach(() => {
    const scene = emptyEditorScene(1080, 1350);
    useEditorStore.getState().loadScene({ ...scene, elements: [rect, text, image] }, "movement-test");
  });

  it.each<[string, EditorElement]>([
    ["rect", rect],
    ["text", text],
    ["image", image]
  ])("keeps %s coordinates when clearing selection", (_, element) => {
    useEditorStore.getState().setSelectedIds([element.id]);
    useEditorStore.getState().clearSelection();
    const updated = useEditorStore.getState().elements.find((el) => el.id === element.id);
    expect(updated?.x).toBe(element.x);
    expect(updated?.y).toBe(element.y);
  });

  it.each<[string, EditorElement]>([
    ["rect", rect],
    ["text", text],
    ["image", image]
  ])("keeps %s coordinates when entering focus mode", (_, element) => {
    useEditorStore.getState().setSelectedIds([element.id]);
    useEditorStore.getState().enterCanvasFocusMode();
    const updated = useEditorStore.getState().elements.find((el) => el.id === element.id);
    expect(updated?.x).toBe(element.x);
    expect(updated?.y).toBe(element.y);
  });

  it("does not add a history entry when only selecting and clearing", () => {
    useEditorStore.getState().setSelectedIds([rect.id]);
    useEditorStore.getState().clearSelection();
    expect(useEditorStore.getState().past).toHaveLength(0);
  });
});
