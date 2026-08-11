import { describe, expect, it } from "vitest";
import { reorderItemsForLayerPanel } from "@/lib/editor/layers";

describe("layer panel ordering", () => {
  const getId = (item: { id: string }) => item.id;

  it("moves a visually top layer to the target row and returns bottom-to-top order", () => {
    const canvasOrder = [{ id: "back" }, { id: "middle" }, { id: "front" }];
    const next = reorderItemsForLayerPanel(canvasOrder, "front", "back", getId);
    expect(next.map((item) => item.id)).toEqual(["front", "back", "middle"]);
  });

  it("keeps order unchanged when source or target is missing", () => {
    const canvasOrder = [{ id: "back" }, { id: "front" }];
    expect(reorderItemsForLayerPanel(canvasOrder, "missing", "back", getId)).toBe(canvasOrder);
    expect(reorderItemsForLayerPanel(canvasOrder, "front", undefined, getId)).toBe(canvasOrder);
  });
});
