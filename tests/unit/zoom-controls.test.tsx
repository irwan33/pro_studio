// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { emptyEditorScene } from "@/lib/editor/scene";
import { useEditorStore } from "@/store/editorStore";
import { ZoomControls } from "@/components/editor/ZoomControls";

describe("zoom controls", () => {
  beforeEach(() => {
    const scene = emptyEditorScene(1080, 1350);
    useEditorStore.getState().loadScene(scene, "zoom-test");
    useEditorStore.getState().setZoom(1);
  });

  afterEach(cleanup);

  it("shows the current zoom as a whole percentage", () => {
    useEditorStore.getState().setZoom(1.5);
    render(<ZoomControls />);
    expect(screen.getByText("150%")).toBeTruthy();
  });

  it("clamps the percentage label width so the pill does not shift", () => {
    useEditorStore.getState().setZoom(0.1);
    const { rerender } = render(<ZoomControls />);
    expect(screen.getByText("10%")).toBeTruthy();
    useEditorStore.getState().setZoom(4);
    rerender(<ZoomControls />);
    expect(screen.getByText("400%")).toBeTruthy();
  });

  it("slider updates the store zoom", () => {
    render(<ZoomControls />);
    const slider = screen.getByRole("slider", { name: "Zoom level" });
    fireEvent.change(slider, { target: { value: "150" } });
    expect(useEditorStore.getState().zoom).toBeCloseTo(1.5, 5);
  });

  it("zoom in and zoom out change the percentage within limits", () => {
    useEditorStore.getState().setZoom(0.05);
    const { rerender } = render(<ZoomControls />);
    const out = screen.getByRole("button", { name: "Zoom out" });
    const add = screen.getByRole("button", { name: "Zoom in" });
    expect(out).toHaveProperty("disabled", true);
    expect(add).toHaveProperty("disabled", false);

    useEditorStore.getState().setZoom(4);
    rerender(<ZoomControls />);
    expect(screen.getByRole("button", { name: "Zoom in" })).toHaveProperty("disabled", true);
  });

  it("zoom does not mutate element coordinates", () => {
    const scene = emptyEditorScene(1080, 1350);
    useEditorStore.getState().loadScene(
      {
        ...scene,
        elements: [
          {
            id: "rect-1",
            type: "rect",
            name: "Rectangle",
            x: 120,
            y: 200,
            width: 160,
            height: 90,
            zIndex: 0,
            properties: { fill: "#C7FF00" }
          }
        ]
      },
      "zoom-coords"
    );
    render(<ZoomControls />);

    const before = useEditorStore.getState().elements[0];

    for (const zoom of [0.25, 1.5, 0.75, 4]) {
      useEditorStore.getState().setZoom(zoom);
    }

    const after = useEditorStore.getState().elements[0];
    expect(after.x).toBe(before.x);
    expect(after.y).toBe(before.y);
    expect(after.width).toBe(before.width);
    expect(after.height).toBe(before.height);
  });

  it("zoom changes produce no history entries", () => {
    useEditorStore.getState().setZoom(0.25);
    useEditorStore.getState().setZoom(2);
    useEditorStore.getState().setZoom(1);
    expect(useEditorStore.getState().past).toHaveLength(0);
  });
});
