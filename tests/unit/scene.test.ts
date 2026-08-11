import { describe, expect, it } from "vitest";
import {
  deserializeEditorState,
  emptyEditorScene,
  isLegacyFabricScene,
  migrateFabricProjectToKonva,
  serializeEditorState
} from "@/lib/editor/scene";
import { toElementPatch } from "@/lib/editor/patch";
import { seedTemplates } from "@/lib/editor/templates";

describe("scene serialization", () => {
  it("creates a valid default scene", () => {
    const scene = emptyEditorScene();
    expect(scene.width).toBe(1080);
    expect(scene.elements.length).toBeGreaterThan(0);
    expect(scene.elements.every((element) => typeof element.id === "string")).toBe(true);
  });

  it("normalizes broken scene input", () => {
    expect(deserializeEditorState(null).elements.length).toBeGreaterThan(0);
    expect(deserializeEditorState({ elements: "nope" }).elements.length).toBeGreaterThan(0);
  });

  it("drops unknown element types and renumbers z-index", () => {
    const scene = deserializeEditorState({
      version: "2.0.0",
      width: 800,
      height: 600,
      background: "#111111",
      elements: [
        { id: "a", type: "rect", zIndex: 5, properties: {} },
        { id: "b", type: "sparkle", zIndex: 6, properties: {} },
        { id: "c", type: "text", zIndex: 9, properties: { text: "hi" } }
      ]
    });
    expect(scene.elements.map((element) => element.id)).toEqual(["a", "c"]);
    expect(scene.elements.map((element) => element.zIndex)).toEqual([0, 1]);
  });

  it("round-trips a scene through serialize", () => {
    const scene = emptyEditorScene(1080, 1080);
    const round = deserializeEditorState(serializeEditorState(scene));
    expect(round.elements).toHaveLength(scene.elements.length);
    expect(round.width).toBe(1080);
    expect(round.height).toBe(1080);
  });
});

describe("legacy fabric migration", () => {
  it("detects the legacy document shape", () => {
    expect(isLegacyFabricScene({ objects: [] })).toBe(true);
    expect(isLegacyFabricScene({ elements: [] })).toBe(false);
  });

  it("migrates a legacy fabric document", () => {
    const scene = deserializeEditorState({
      version: "1.0.0",
      width: 1080,
      height: 1350,
      background: "#000000",
      objects: [
        { type: "textbox", text: "HELLO", left: 10, top: 20, width: 300, fontSize: 40, fill: "#ffffff", name: "Title" },
        { type: "rect", left: 5, top: 5, width: 100, height: 50, fill: "#C7FF00", rx: 8 }
      ]
    });

    expect(scene.elements).toHaveLength(2);
    expect(scene.elements[0].type).toBe("text");
    expect(scene.elements[0].properties.text).toBe("HELLO");
    expect(scene.elements[1].type).toBe("rect");
    expect(scene.elements[1].x).toBe(5);
  });

  it("keeps z-index contiguous after migration", () => {
    const scene = migrateFabricProjectToKonva({
      objects: [{ type: "rect" }, { type: "circle", radius: 20 }, { type: "textbox", text: "x" }]
    });
    expect(scene.elements.map((element) => element.zIndex)).toEqual([0, 1, 2]);
  });

  it("converts fabric center origin to top-left", () => {
    const scene = migrateFabricProjectToKonva({
      objects: [{ type: "rect", left: 100, top: 100, width: 40, height: 20, originX: "center", originY: "center" }]
    });
    expect(scene.elements[0].x).toBe(80);
    expect(scene.elements[0].y).toBe(90);
  });

  it("converts fabric polygons into closed line elements", () => {
    const scene = migrateFabricProjectToKonva({
      objects: [
        {
          type: "polygon",
          left: 10,
          top: 10,
          points: [
            { x: 0, y: 0 },
            { x: 30, y: 0 },
            { x: 15, y: 20 }
          ],
          fill: "#ff0000"
        }
      ]
    });
    const element = scene.elements[0];
    expect(element.type).toBe("line");
    expect(element.properties.closed).toBe(true);
    expect(element.properties.points).toEqual([0, 0, 30, 0, 15, 20]);
  });
});

describe("element patch normalisation", () => {
  it("keeps geometry at the top level and properties nested", () => {
    const patch = toElementPatch({ x: 10, y: 20, rotation: 45, properties: { fill: "#fff" } });
    expect(patch).toEqual({ x: 10, y: 20, rotation: 45, properties: { fill: "#fff" } });
  });

  it("clamps sizes and opacity", () => {
    const patch = toElementPatch({ width: 0, height: -40, opacity: 4 });
    expect(patch.width).toBe(5);
    expect(patch.height).toBe(40);
    expect(patch.opacity).toBe(1);
  });

  it("ignores unknown top-level keys and non-numeric values", () => {
    const patch = toElementPatch({ x: Number.NaN, fill: "#fff" } as never);
    expect(patch).toEqual({});
  });
});

describe("seed templates", () => {
  it("are all valid element-model scenes", () => {
    expect(seedTemplates.length).toBeGreaterThan(0);
    for (const template of seedTemplates) {
      expect(Array.isArray(template.sceneJson.elements)).toBe(true);
      expect(template.sceneJson.elements.length).toBeGreaterThan(0);
      expect(template.sceneJson).not.toHaveProperty("objects");
      expect(template.sceneJson.width).toBe(template.width);
      expect(template.sceneJson.elements.map((element) => element.zIndex)).toEqual(
        template.sceneJson.elements.map((_, index) => index)
      );
    }
  });
});
