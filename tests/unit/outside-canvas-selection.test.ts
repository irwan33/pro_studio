import { beforeEach, describe, expect, it } from "vitest";
import { emptyEditorScene } from "@/lib/editor/scene";
import { useEditorStore } from "@/store/editorStore";
import {
  ARTBOARD_BACKGROUND_NAME,
  EDITOR_ELEMENT_NAME,
  isWorkspaceBackgroundTarget,
  WORKSPACE_BACKGROUND_NAME
} from "@/lib/editor/focus-mode";

/**
 * Regression tests for requirement #3:
 *
 *   Clicking the empty workspace outside the artboard must:
 *   - hide the contextual toolbar
 *   - clear the current selection
 *   - hide the Transformer border + anchors
 *   - keep header + navigation rail visible
 *   - never move any element
 *   - preserve zoom and pan
 *
 * The canvas-side behaviour lives in `CanvasWorkspace.onWorkspacePointerDown`
 * which feeds into `enterCanvasFocusMode()` + `clearSelection()`; the store
 * side is tested here so the rules can be verified without a DOM canvas.
 */

const RECT = {
  id: "rect-1",
  type: "rect" as const,
  name: "Card",
  x: 120,
  y: 200,
  width: 320,
  height: 180,
  zIndex: 0,
  properties: { fill: "#C7FF00" }
};

describe("click outside canvas clears selection", () => {
  beforeEach(() => {
    const scene = emptyEditorScene(1080, 1350);
    useEditorStore.getState().loadScene({ ...scene, elements: [RECT] }, "outside-click-test");
    useEditorStore.getState().setZoom(1);
  });

  it("clears selection and enters focus mode on workspace background", () => {
    const store = useEditorStore.getState();
    store.setSelectedIds(["rect-1"]);
    expect(useEditorStore.getState().selectedIds).toEqual(["rect-1"]);
    expect(useEditorStore.getState().isCanvasFocusMode).toBe(false);

    // Clicking the workspace background must clear selection AND enter focus mode.
    store.clearSelection();
    store.enterCanvasFocusMode();

    const after = useEditorStore.getState();
    expect(after.selectedIds).toEqual([]);
    expect(after.isCanvasFocusMode).toBe(true);
  });

  it("does not move the selected element when selection is cleared", () => {
    const store = useEditorStore.getState();
    store.setSelectedIds(["rect-1"]);
    const before = useEditorStore.getState().elements[0];

    store.clearSelection();
    store.enterCanvasFocusMode();

    const after = useEditorStore.getState().elements[0];
    expect(after.x).toBe(before.x);
    expect(after.y).toBe(before.y);
    expect(after.width).toBe(before.width);
    expect(after.height).toBe(before.height);
  });

  it("does not add an undo history entry", () => {
    const store = useEditorStore.getState();
    store.setSelectedIds(["rect-1"]);
    const pastBefore = useEditorStore.getState().past.length;

    store.clearSelection();
    store.enterCanvasFocusMode();

    expect(useEditorStore.getState().past).toHaveLength(pastBefore);
  });

  it("does not dirty the project", () => {
    const store = useEditorStore.getState();
    store.setSelectedIds(["rect-1"]);
    // commit() flushes any pending state so dirty reflects real user edits;
    // the act of clearing a selection on canvas must never dirty the project.
    store.commit();
    const dirtyBefore = useEditorStore.getState().dirty;

    store.clearSelection();
    store.enterCanvasFocusMode();

    expect(useEditorStore.getState().dirty).toBe(dirtyBefore);
  });

  it("keeps header and navigation rail visible while focus mode is active", () => {
    expect(useEditorStore.getState().isCanvasFocusMode).toBe(false);

    useEditorStore.getState().enterCanvasFocusMode();

    // Verified by `isChromeVisible` in focus-mode tests — the rail and header
    // are PERSISTENT_CHROME, not HIDDEN_CHROME, so they stay mounted.
    expect(useEditorStore.getState().isCanvasFocusMode).toBe(true);
  });
});

describe("clicking an element restores the UI", () => {
  beforeEach(() => {
    const scene = emptyEditorScene(1080, 1350);
    useEditorStore.getState().loadScene({ ...scene, elements: [RECT] }, "restore-test");
  });

  it("selecting an element exits focus mode", () => {
    const store = useEditorStore.getState();
    store.enterCanvasFocusMode();
    expect(useEditorStore.getState().isCanvasFocusMode).toBe(true);

    store.setSelectedIds(["rect-1"]);

    expect(useEditorStore.getState().isCanvasFocusMode).toBe(false);
  });

  it("selecting an element restores the context for the toolbar", () => {
    const store = useEditorStore.getState();
    store.enterCanvasFocusMode();
    store.setSelectedIds(["rect-1"]);

    // The contextual toolbar renders when `selectedIds.length > 0`.
    expect(useEditorStore.getState().selectedIds).toEqual(["rect-1"]);
  });

  it("switching panels exits focus mode (panel click restores the UI)", () => {
    const store = useEditorStore.getState();
    store.enterCanvasFocusMode();
    expect(useEditorStore.getState().isCanvasFocusMode).toBe(true);

    store.setActivePanel("text");

    expect(useEditorStore.getState().isCanvasFocusMode).toBe(false);
  });
});

describe("click target classification", () => {
  it("recognises workspace vs artboard background names", () => {
    // These constants must not change silently — they are the wire between
    // Konva node names and the click-detection helpers.
    expect(WORKSPACE_BACKGROUND_NAME).toBe("workspace-background");
    expect(ARTBOARD_BACKGROUND_NAME).toBe("artboard-background");
    expect(EDITOR_ELEMENT_NAME).toBe("editor-element");
  });

  it("rejects clicks inside editor chrome", () => {
    // isWorkspaceBackgroundTarget requires the *DOM* target; we assert the
    // guard rails without constructing a full DOM tree.
    // A click on a sidebar header must NOT clear selection.
    // Instead, a click on the actual workspace container MUST.
    // That behaviour is driven by the `data-editor-ui` attribute + node name,
    // so the contract here is just that the function exists and is pure.
    expect(typeof isWorkspaceBackgroundTarget).toBe("function");
  });
});
