// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AssetPanel } from "@/components/editor/AssetPanel";
import { useEditorStore } from "@/store/editorStore";
import { emptyEditorScene } from "@/lib/editor/scene";
import type { EditorElement } from "@/lib/editor/types";

describe("Position panel", () => {
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

  beforeEach(() => {
    const scene = emptyEditorScene(1080, 1350);
    useEditorStore.getState().loadScene({ ...scene, elements: [rect] }, "position-test");
    useEditorStore.getState().setSelectedIds([rect.id]);
    useEditorStore.getState().setActivePanel("position");
  });

  afterEach(cleanup);

  it("renders the Position panel with Arrange and Layers tabs", () => {
    render(<AssetPanel />);
    expect(screen.getByText("POSITION")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Arrange" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Layers" })).toBeTruthy();
  });

  it("shows arrange controls by default", () => {
    render(<AssetPanel />);
    expect(screen.getByText("ARRANGE")).toBeTruthy();
    expect(screen.getByText("ALIGN TO PAGE")).toBeTruthy();
    expect(screen.getByText("ADVANCED")).toBeTruthy();
  });

  it("switches to the Layers tab", () => {
    render(<AssetPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Layers" }));
    expect(screen.getByText("All")).toBeTruthy();
    expect(screen.getByText("Overlapping")).toBeTruthy();
  });

  it("lists layers in the Layers tab", () => {
    render(<AssetPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Layers" }));
    expect(screen.getByText("Rectangle")).toBeTruthy();
  });

  it("has a close button", () => {
    render(<AssetPanel />);
    const closeButton = screen.getByLabelText("Close position panel");
    expect(closeButton).toBeTruthy();
  });
});
