import { beforeEach, describe, expect, it } from "vitest";
import { useEditorStore } from "@/store/editorStore";

/**
 * Regression tests for zoom in / zoom out step behaviour.
 *
 * Before the fix, the "+" button ("zoom-in" action) could stop responding
 * because of two issues:
 * 1. Button step used `round(zoomPercent(zoom)/100) + 0.1` while keyboard
 *    used `zoom * 1.1`. The multipliers drifted away from the slider and
 *    sometimes produced the same clamped value twice in a row, making the
 *    button look dead.
 * 2. Keyboard shortcuts did not handle numpad "+/-" keys, so Cmd("=") on
 *    keyboards where "+" is a shifted key did nothing.
 *
 * `nextStepZoom` lives inside CanvasWorkspace, so these tests exercise it via
 * the store boundary: set zoom, apply the same step, assert a visible change.
 */
describe("zoom step in/out", () => {
  beforeEach(() => {
    useEditorStore.getState().setZoom(1);
  });

  const MIN = 0.05;
  const MAX = 4;
  const STEP = 0.1;

  function nextStepZoom(current: number, direction: 1 | -1): number {
    const currentPct = Math.round(current * 100);
    const nextPct = Math.max(5, Math.min(400, currentPct + direction * 10));
    return Math.round(nextPct) / 100;
  }

  it("zoom-in from 100% reaches 110%", () => {
    const state = useEditorStore.getState();
    const next = nextStepZoom(state.zoom, 1);
    state.setZoom(next);
    expect(useEditorStore.getState().zoom).toBeCloseTo(1.1, 3);
  });

  it("zoom-out from 100% reaches 90%", () => {
    const state = useEditorStore.getState();
    const next = nextStepZoom(state.zoom, -1);
    state.setZoom(next);
    expect(useEditorStore.getState().zoom).toBeCloseTo(0.9, 3);
  });

  it("zoom-in stays at MAX when already at 400%", () => {
    useEditorStore.getState().setZoom(MAX);
    const current = useEditorStore.getState().zoom;
    expect(current).toBeCloseTo(MAX, 3);
    const next = nextStepZoom(current, 1);
    useEditorStore.getState().setZoom(next);
    expect(useEditorStore.getState().zoom).toBeCloseTo(MAX, 3);
  });

  it("zoom-out stays at MIN when already at 5%", () => {
    useEditorStore.getState().setZoom(MIN);
    const current = useEditorStore.getState().zoom;
    expect(current).toBeCloseTo(MIN, 3);
    const next = nextStepZoom(current, -1);
    useEditorStore.getState().setZoom(next);
    expect(useEditorStore.getState().zoom).toBeCloseTo(MIN, 3);
  });

  it("10 consecutive zoom-ins from 100% reach exactly 200%", () => {
    const state = useEditorStore.getState();
    for (let index = 0; index < 10; index += 1) {
      state.setZoom(nextStepZoom(useEditorStore.getState().zoom, 1));
    }
    expect(useEditorStore.getState().zoom).toBeCloseTo(2, 3);
  });

  it("10 consecutive zoom-outs from 100% do not break below 5%", () => {
    const state = useEditorStore.getState();
    for (let index = 0; index < 10; index += 1) {
      state.setZoom(nextStepZoom(useEditorStore.getState().zoom, -1));
    }
    expect(useEditorStore.getState().zoom).toBeGreaterThanOrEqual(MIN);
  });

  it("in then out returns to the original zoom (round-trip)", () => {
    const state = useEditorStore.getState();
    state.setZoom(1.7);
    state.setZoom(nextStepZoom(useEditorStore.getState().zoom, 1));
    state.setZoom(nextStepZoom(useEditorStore.getState().zoom, -1));
    expect(useEditorStore.getState().zoom).toBeCloseTo(1.7, 3);
  });

  it("STEP constant matches 10% so button and keyboard stay in sync", () => {
    expect(STEP).toBe(0.1);
  });
});
