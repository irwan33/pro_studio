import { beforeEach, describe, expect, it } from "vitest";
import { EDITOR_PANELS } from "@/lib/editor/types";
import { useEditorStore } from "@/store/editorStore";

/**
 * The Filters toolbar button and the sidebar both open panels through
 * `setActivePanel`. These tests pin the panel identifiers so a toolbar shortcut
 * cannot drift to a name the asset panel router does not render.
 */
describe("editor panels", () => {
  beforeEach(() => {
    useEditorStore.getState().setActivePanel("elements");
  });

  it("exposes the panels the asset panel can render", () => {
    expect(EDITOR_PANELS).toContain("filters");
    expect(EDITOR_PANELS).toContain("text");
    expect(new Set(EDITOR_PANELS).size).toBe(EDITOR_PANELS.length);
  });

  it("starts on the element library", () => {
    expect(useEditorStore.getState().activePanel).toBe("elements");
  });

  it("switches to the image filters panel", () => {
    useEditorStore.getState().setActivePanel("filters");
    expect(useEditorStore.getState().activePanel).toBe("filters");
  });

  it("switches between panels without leaving stale state", () => {
    const store = useEditorStore.getState();
    store.setActivePanel("filters");
    store.setActivePanel("text");
    expect(useEditorStore.getState().activePanel).toBe("text");
  });
});
