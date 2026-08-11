// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { FontFamilyPicker } from "@/components/editor/FontFamilyPicker";
import { emptyEditorScene } from "@/lib/editor/scene";
import { useEditorStore } from "@/store/editorStore";
import type { EditorElement } from "@/lib/editor/types";

/**
 * Font family control.
 *
 * The control shows the active family and routes to the Text panel; it must not
 * open a popup, dialog or dropdown of its own. These tests pin that so the popup
 * cannot creep back in, and check that applying a family through the panel still
 * produces exactly one history entry.
 */

const textElement: EditorElement = {
  id: "text-1",
  type: "text",
  name: "Headline",
  x: 40,
  y: 60,
  width: 500,
  height: 120,
  rotation: 8,
  opacity: 0.9,
  visible: true,
  locked: false,
  zIndex: 0,
  properties: {
    text: "Match Day",
    fontFamily: "Oswald",
    fontSize: 72,
    fontWeight: "bold",
    fontStyle: "italic",
    fill: "#C7FF00",
    align: "center",
    lineHeight: 1.2,
    letterSpacing: 4,
    underline: true
  }
};

beforeEach(() => {
  const scene = emptyEditorScene(1080, 1350);
  useEditorStore.getState().loadScene({ ...scene, elements: [textElement] }, "font-test");
  useEditorStore.getState().setSelectedIds(["text-1"]);
  useEditorStore.getState().setActivePanel("elements");
});

afterEach(cleanup);

describe("font family control", () => {
  it("shows the active family", () => {
    render(<FontFamilyPicker value="Oswald" />);
    expect(screen.getByRole("button", { name: /Oswald/ })).toBeTruthy();
  });

  it("opens no popup, dialog or dropdown when clicked", () => {
    render(<FontFamilyPicker value="Oswald" />);
    const trigger = screen.getByRole("button", { name: /Oswald/ });

    // No popup semantics at all: the control is a plain button.
    expect(trigger.getAttribute("aria-haspopup")).toBeNull();

    fireEvent.click(trigger);

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(document.querySelector("select")).toBeNull();
    // Nothing is rendered beyond the trigger itself.
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("reveals the fonts in the Text panel instead", () => {
    render(<FontFamilyPicker value="Oswald" />);
    fireEvent.click(screen.getByRole("button", { name: /Oswald/ }));
    expect(useEditorStore.getState().activePanel).toBe("text");
  });

  it("marks itself active while the Text panel is open", () => {
    useEditorStore.getState().setActivePanel("text");
    render(<FontFamilyPicker value="Oswald" />);
    expect(screen.getByRole("button", { name: /Oswald/ }).getAttribute("aria-pressed")).toBe("true");
  });

  it("does nothing while the layer is locked", () => {
    render(<FontFamilyPicker value="Oswald" disabled />);
    const trigger = screen.getByRole("button", { name: /Oswald/ });

    expect((trigger as HTMLButtonElement).disabled).toBe(true);
    expect(trigger.getAttribute("title")).toBe("Unlock the text layer to change its font");
    fireEvent.click(trigger);
    expect(useEditorStore.getState().activePanel).toBe("elements");
  });

  it("falls back to a display font when no family is set", () => {
    render(<FontFamilyPicker />);
    expect(screen.getByRole("button", { name: /League Spartan/ })).toBeTruthy();
  });

  it("never mutates the element itself", () => {
    render(<FontFamilyPicker value="Oswald" />);
    fireEvent.click(screen.getByRole("button", { name: /Oswald/ }));

    // Opening the panel is not an edit, so it must not touch the scene.
    expect(useEditorStore.getState().elements[0].properties.fontFamily).toBe("Oswald");
    expect(useEditorStore.getState().past).toHaveLength(0);
    expect(useEditorStore.getState().dirty).toBe(false);
  });
});

describe("applying a font from the Text panel", () => {
  /** Mirrors the panel wiring: one `update-active` patch per pick. */
  function applyFont(family: string) {
    useEditorStore.getState().updateElement("text-1", { properties: { fontFamily: family } });
  }

  it("updates the selected element in the serializable scene", () => {
    applyFont("Bangers");
    const scene = useEditorStore.getState().getScene();
    expect(scene.elements[0].properties.fontFamily).toBe("Bangers");
    // Persisted as scene.elements, never scene.objects.
    expect(scene).not.toHaveProperty("objects");
  });

  it("leaves every other text property untouched", () => {
    applyFont("Bangers");
    const element = useEditorStore.getState().elements[0];

    expect(element.properties.text).toBe("Match Day");
    expect(element.properties.fontSize).toBe(72);
    expect(element.properties.fontWeight).toBe("bold");
    expect(element.properties.fontStyle).toBe("italic");
    expect(element.properties.fill).toBe("#C7FF00");
    expect(element.properties.align).toBe("center");
    expect(element.properties.lineHeight).toBe(1.2);
    expect(element.properties.letterSpacing).toBe(4);
    expect(element.properties.underline).toBe(true);
    expect(element.x).toBe(40);
    expect(element.y).toBe(60);
    expect(element.rotation).toBe(8);
    expect(element.opacity).toBe(0.9);
    expect(element.id).toBe("text-1");
  });

  it("adds exactly one history entry, marks dirty and supports undo/redo", () => {
    const before = useEditorStore.getState().past.length;
    applyFont("Bangers");

    expect(useEditorStore.getState().past.length).toBe(before + 1);
    expect(useEditorStore.getState().dirty).toBe(true);

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().elements[0].properties.fontFamily).toBe("Oswald");
    useEditorStore.getState().redo();
    expect(useEditorStore.getState().elements[0].properties.fontFamily).toBe("Bangers");
  });

  it("keeps the element selected so the inspector stays in sync", () => {
    applyFont("Bangers");
    expect(useEditorStore.getState().selectedIds).toEqual(["text-1"]);
  });
});
