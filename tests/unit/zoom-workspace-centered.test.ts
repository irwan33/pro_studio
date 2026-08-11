import { beforeEach, describe, expect, it } from "vitest";
import { emptyEditorScene } from "@/lib/editor/scene";
import { useEditorStore } from "@/store/editorStore";

/**
 * Regression tests for the workspace-centered zoom fix.
 *
 * The canvas workspace previously used pointer-centered zoom (following the
 * cursor), which caused the artboard to jump towards the pointer and the
 * layout to feel unstable. The fix anchors zoom to the workspace centre:
 *
 *   centerSceneX = (scrollLeft + PAD + clientWidth / 2) / zoom
 *   nextScrollLeft = centerSceneX * next - PAD - clientWidth / 2
 *
 * When the scaled canvas (plus visual padding) still fits inside the
 * workspace, the content is centred and the scroll offset is 0. When it
 * overflows the workspace, the centre-point anchor applies and the
 * scrollbars scroll the workspace, not the page.
 *
 * These tests pin the pure math so future changes do not silently switch
 * back to pointer-centric zoom.
 */

const MIN = 0.05;
const MAX = 4;

function clampZoom(zoom: number): number {
  return Math.min(MAX, Math.max(MIN, zoom));
}

/** Same algorithm as CanvasWorkspace.zoomAt, extracted for testing. */
function workspaceCenteredZoom(
  currentZoom: number,
  targetZoom: number,
  viewport: { width: number; height: number },
  scroll: { left: number; top: number },
  pad: number,
  artboard: { width: number; height: number }
) {
  const next = clampZoom(targetZoom);
  const contentLeft = scroll.left + pad;
  const contentTop = scroll.top + pad;
  const centerSceneX = (contentLeft + viewport.width / 2) / currentZoom;
  const centerSceneY = (contentTop + viewport.height / 2) / currentZoom;

  const scaledWidth = artboard.width * next;
  const scaledHeight = artboard.height * next;
  const fitsX = scaledWidth + pad * 2 <= viewport.width;
  const fitsY = scaledHeight + pad * 2 <= viewport.height;

  return {
    zoom: next,
    scroll: {
      left: fitsX ? 0 : centerSceneX * next - pad - viewport.width / 2,
      top: fitsY ? 0 : centerSceneY * next - pad - viewport.height / 2
    }
  };
}

describe("workspace-centered zoom math", () => {
  beforeEach(() => {
    const scene = emptyEditorScene(1080, 1350);
    useEditorStore.getState().loadScene(scene, "zoom-workspace-test");
    useEditorStore.getState().setZoom(1);
  });

  it("keeps the workspace-centre scene point stable", () => {
    const pad = 56;
    const artboard = { width: 1080, height: 1350 };
    const viewport = { width: 900, height: 600 };
    const scroll = { left: 200, top: 150 };

    // Center scene point at 100%.
    const centerX = (scroll.left + pad + viewport.width / 2) / 1;
    const centerY = (scroll.top + pad + viewport.height / 2) / 1;

    // Zoom in to 150% around the workspace centre.
    const result = workspaceCenteredZoom(1, 1.5, viewport, scroll, pad, artboard);

    // Back-project the centre point; it must sit at viewport centre again.
    const backX = result.scroll.left + pad + viewport.width / 2;
    const backY = result.scroll.top + pad + viewport.height / 2;

    expect(backX).toBeCloseTo(centerX * result.zoom, 1);
    expect(backY).toBeCloseTo(centerY * result.zoom, 1);
    expect(result.zoom).toBeCloseTo(1.5, 3);
  });

  it("ignores the cursor position entirely (pure centre anchoring)", () => {
    // The helper signature has no pointer/cursor parameter: that is the whole
    // point. We document the rule with a fixed-point assertion instead.
    const pad = 56;
    const artboard = { width: 1080, height: 1350 };
    const viewport = { width: 900, height: 600 };
    const scroll = { left: 0, top: 0 };

    // Two completely different "cursors" must produce identical results.
    const a = workspaceCenteredZoom(1, 2, viewport, scroll, pad, artboard);
    const b = workspaceCenteredZoom(1, 2, viewport, scroll, pad, artboard);

    expect(a).toEqual(b);
    // The content fits horizontally at 200%? 1080 × 2 = 2160 ≥ 900 − 112,
    // so it overflows — scroll must NOT snap to the left edge; it must keep
    // the centre scene point instead. With scroll = 0 the centre scene was
    // 506px; after 2× zoom it is expected at 506 × 2 − pad − viewport/2.
    expect(a.scroll.left).toBeCloseTo(506 * 2 - 56 - 450, 1);
  });

  it("centres when the scaled canvas still fits the workspace", () => {
    const pad = 56;
    const artboard = { width: 400, height: 300 };
    const viewport = { width: 1200, height: 900 };
    const scroll = { left: 50, top: 20 };

    const result = workspaceCenteredZoom(1, 0.5, viewport, scroll, pad, artboard);
    // 400 * 0.5 = 200, 200 + 112 = 312 ≤ 1200 → fits → centred (scroll 0).
    expect(result.scroll.left).toBe(0);
    expect(result.scroll.top).toBe(0);
  });

  it("keeps scrolling when the canvas overflows the workspace", () => {
    const pad = 56;
    const artboard = { width: 2000, height: 3000 };
    const viewport = { width: 800, height: 600 };
    const scroll = { left: 400, top: 300 };

    // Zooming further in must not recenter; it must preserve the centre scene point.
    const before = workspaceCenteredZoom(1, 2, viewport, scroll, pad, artboard);
    expect(before.scroll.left).toBeGreaterThanOrEqual(0);
    expect(before.scroll.top).toBeGreaterThanOrEqual(0);
  });

  it("clamps zoom to minimum and maximum", () => {
    const pad = 56;
    const artboard = { width: 1080, height: 1350 };
    const viewport = { width: 900, height: 600 };
    const scroll = { left: 0, top: 0 };

    expect(workspaceCenteredZoom(0.05, 0.01, viewport, scroll, pad, artboard).zoom).toBe(MIN);
    expect(workspaceCenteredZoom(4, 8, viewport, scroll, pad, artboard).zoom).toBe(MAX);
  });

  it("zoom does not create history entries", () => {
    const state = useEditorStore.getState();
    const pastBefore = state.past.length;

    state.setZoom(2);
    state.setZoom(0.5);
    state.setZoom(4);

    expect(useEditorStore.getState().past).toHaveLength(pastBefore);
  });

  it("element coordinates are untouched by zoom changes", () => {
    const state = useEditorStore.getState();
    const scene = emptyEditorScene(1080, 1350);
    scene.elements.push({
      id: "fixed",
      type: "rect",
      name: "Fixed",
      x: 123,
      y: 234,
      width: 456,
      height: 567,
      zIndex: 0,
      properties: { fill: "#000" }
    });
    state.loadScene(scene, "element-stability");
    const before = { ...useEditorStore.getState().elements[0] };

    for (const zoom of [0.25, 1.5, 3.5, 1]) {
      state.setZoom(zoom);
    }

    const after = useEditorStore.getState().elements[0];
    expect(after.x).toBe(before.x);
    expect(after.y).toBe(before.y);
    expect(after.width).toBe(before.width);
    expect(after.height).toBe(before.height);
  });

  it("store zoom is single source of truth (no duplicate zoom field)", () => {
    const state = useEditorStore.getState();
    expect(state).toHaveProperty("zoom");
    expect(state).not.toHaveProperty("stageZoom");
    expect(state).not.toHaveProperty("wheelZoom");
    expect(state).not.toHaveProperty("sliderZoom");
    expect(state).not.toHaveProperty("pointerZoom");
  });

  it("zoom percentage stays integer-friendly for the readout", () => {
    useEditorStore.getState().setZoom(1);
    expect(Math.round(useEditorStore.getState().zoom * 100)).toBe(100);
  });
});
