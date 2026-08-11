import { beforeEach, describe, expect, it } from "vitest";
import type Konva from "konva";
import {
  ARTBOARD_BACKGROUND_NAME,
  EDITOR_ELEMENT_NAME,
  EDITOR_UI_ATTRIBUTE,
  FOCUS_MODE_HIDDEN_CHROME,
  FOCUS_MODE_PERSISTENT_CHROME,
  WORKSPACE_BACKGROUND_NAME,
  isArtboardBackgroundNode,
  isChromeVisible,
  isEditorContentNode
} from "@/lib/editor/focus-mode";
import { emptyEditorScene } from "@/lib/editor/scene";
import { useEditorStore } from "@/store/editorStore";
import type { EditorElement } from "@/lib/editor/types";

/**
 * Focus mode collapses the panels around the artboard, so the rules that turn it
 * on and off — and the rule for *which* chrome it affects — are the whole
 * feature. These tests cover the Konva-side click classification, the chrome
 * visibility rule and the store transitions. The DOM-side click helper is
 * covered by `focus-mode-dom.test.ts`.
 */

/** Minimal stand-in for the parts of a Konva node the helpers read. */
function fakeNode(name: string, insideTransformer = false) {
  return {
    name: () => name,
    findAncestor: (selector: string) =>
      insideTransformer && selector === "Transformer" ? ({} as Konva.Node) : undefined
  } as unknown as Konva.Node;
}

describe("focus mode click classification", () => {
  it("recognises the artboard background", () => {
    expect(isArtboardBackgroundNode(fakeNode(ARTBOARD_BACKGROUND_NAME))).toBe(true);
    expect(isArtboardBackgroundNode(fakeNode(WORKSPACE_BACKGROUND_NAME))).toBe(false);
    expect(isArtboardBackgroundNode(fakeNode(EDITOR_ELEMENT_NAME))).toBe(false);
    expect(isArtboardBackgroundNode(null)).toBe(false);
  });

  it("recognises elements and transformer handles as content", () => {
    expect(isEditorContentNode(fakeNode(EDITOR_ELEMENT_NAME))).toBe(true);
    // Anchors are named `top-left`, `rotater`, ... so the check walks up instead.
    expect(isEditorContentNode(fakeNode("rotater", true))).toBe(true);
    expect(isEditorContentNode(fakeNode("top-left", true))).toBe(true);
    expect(isEditorContentNode(fakeNode(ARTBOARD_BACKGROUND_NAME))).toBe(false);
    expect(isEditorContentNode(null)).toBe(false);
  });

  it("keeps the UI marker attribute stable", () => {
    // Components spread this attribute literally, so a rename must be deliberate.
    expect(EDITOR_UI_ATTRIBUTE).toBe("data-editor-ui");
  });
});

describe("chrome hidden by focus mode", () => {
  it("hides the content panel and the contextual toolbar", () => {
    expect(isChromeVisible("content-panel", true)).toBe(false);
    expect(isChromeVisible("contextual-toolbar", true)).toBe(false);
  });

  it("keeps the navigation rail and the main header visible", () => {
    // The editor must never lose its frame: the rail and header are how the user
    // switches panels and gets back out of the editor.
    expect(isChromeVisible("navigation-rail", true)).toBe(true);
    expect(isChromeVisible("header", true)).toBe(true);
    expect(isChromeVisible("zoom-controls", true)).toBe(true);
  });

  it("shows everything when focus mode is off", () => {
    for (const chrome of [...FOCUS_MODE_HIDDEN_CHROME, ...FOCUS_MODE_PERSISTENT_CHROME]) {
      expect(isChromeVisible(chrome, false)).toBe(true);
    }
  });

  it("classifies every piece of chrome exactly once", () => {
    const all = [...FOCUS_MODE_HIDDEN_CHROME, ...FOCUS_MODE_PERSISTENT_CHROME];
    expect(new Set(all).size).toBe(all.length);
    // A new panel added to the shell has to be assigned to one of the two lists.
    expect(all).toHaveLength(5);
  });
});

describe("focus mode state", () => {
  const element: EditorElement = {
    id: "el-1",
    type: "text",
    name: "Title",
    x: 0,
    y: 0,
    zIndex: 0,
    properties: { text: "hello" }
  };

  beforeEach(() => {
    const scene = emptyEditorScene(1080, 1350);
    useEditorStore.getState().loadScene({ ...scene, elements: [element] }, "focus-test");
  });

  it("starts inactive and clears on scene load", () => {
    expect(useEditorStore.getState().isCanvasFocusMode).toBe(false);
  });

  it("enters, exits and toggles", () => {
    const store = useEditorStore.getState();
    store.enterCanvasFocusMode();
    expect(useEditorStore.getState().isCanvasFocusMode).toBe(true);
    store.exitCanvasFocusMode();
    expect(useEditorStore.getState().isCanvasFocusMode).toBe(false);
    store.toggleCanvasFocusMode();
    expect(useEditorStore.getState().isCanvasFocusMode).toBe(true);
    store.toggleCanvasFocusMode();
    expect(useEditorStore.getState().isCanvasFocusMode).toBe(false);
  });

  it("drops selection and text editing on entry", () => {
    const store = useEditorStore.getState();
    store.setSelectedIds(["el-1"]);
    store.setEditingId("el-1");

    useEditorStore.getState().enterCanvasFocusMode();

    const next = useEditorStore.getState();
    expect(next.isCanvasFocusMode).toBe(true);
    expect(next.selectedIds).toEqual([]);
    expect(next.editingId).toBeNull();
  });

  it("restores the UI whenever work resumes", () => {
    const cases: Array<[string, () => void]> = [
      ["selecting an element", () => useEditorStore.getState().setSelectedIds(["el-1"])],
      ["editing text", () => useEditorStore.getState().setEditingId("el-1")],
      ["switching panel", () => useEditorStore.getState().setActivePanel("filters")],
      ["opening the text panel", () => useEditorStore.getState().setActivePanel("text")]
    ];

    for (const [, act] of cases) {
      useEditorStore.getState().enterCanvasFocusMode();
      expect(useEditorStore.getState().isCanvasFocusMode).toBe(true);
      act();
      expect(useEditorStore.getState().isCanvasFocusMode).toBe(false);
    }
  });

  it("stays in focus mode when a selection is cleared to empty", () => {
    const store = useEditorStore.getState();
    store.enterCanvasFocusMode();
    store.setSelectedIds([]);
    expect(useEditorStore.getState().isCanvasFocusMode).toBe(true);
  });

  it("is not part of the persisted scene", () => {
    useEditorStore.getState().enterCanvasFocusMode();
    const scene = useEditorStore.getState().getScene();
    expect(scene).not.toHaveProperty("isCanvasFocusMode");
  });
});
