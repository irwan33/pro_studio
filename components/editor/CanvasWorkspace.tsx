"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Konva from "konva";
import { Layer, Rect, Stage, Transformer } from "react-konva";
import { toast } from "sonner";
import { useEditorStore } from "@/store/editorStore";
import { ElementNode, type ElementHandlers } from "@/components/editor/elements";
import { AlignmentGuides } from "@/components/editor/AlignmentGuides";
import { CropTool } from "@/components/editor/CropTool";
import { TextEditorOverlay } from "@/components/editor/TextEditorOverlay";
import { ZoomControls } from "@/components/editor/ZoomControls";
import { findAlignmentLines, snapToAlignment, type AlignmentLine } from "@/lib/editor/alignment";
import { clampSize, fitScale, getElementBox, keepsScale, pointerToCanvas, round } from "@/lib/editor/coordinates";

/**
 * Snap the current zoom to a whole percentage so step actions stay clean
 * (e.g. 45% → 55% → 65%) instead of drifting with float multiplications.
 */
function zoomPercent(zoom: number) {
  return Math.round(zoom * 100);
}

/**
 * Calculate the next zoom level for step in/out.
 * Uses a consistent 10% step for button and keyboard so they behave the same.
 */
function nextStepZoom(current: number, direction: 1 | -1): number {
  const currentPct = zoomPercent(current);
  const nextPct = Math.max(5, Math.min(400, currentPct + direction * 10));
  return round(nextPct / 100);
}
import { deserializeEditorState } from "@/lib/editor/serialization";
import { registerStage } from "@/lib/editor/stage-registry";
import { probeImageSize } from "@/lib/editor/image-source";
import {
  ARTBOARD_BACKGROUND_NAME,
  WORKSPACE_BACKGROUND_NAME,
  isWorkspaceBackgroundTarget
} from "@/lib/editor/focus-mode";
import { exportStage } from "@/lib/editor/export";
import { toElementPatch, type ElementUpdatePayload } from "@/lib/editor/patch";
import {
  STUDIO_ACTION_EVENT,
  STUDIO_DRAG_TYPE,
  STUDIO_LAYER_ACTION_EVENT,
  type LayerActionDetail,
  type StudioAction
} from "@/lib/editor/actions";
import {
  createAssetElements,
  createCircleElement,
  createCompositeElements,
  createImageElement,
  createLineElement,
  createPathElement,
  createRectElement,
  createStickerElements,
  createTextElement,
  type CompositeKind
} from "@/lib/editor/factory";
import type { CropConfig, GradientConfig, ImageFilterConfig } from "@/lib/editor/types";

type Box = { x: number; y: number; width: number; height: number };

type CropState = {
  active: boolean;
  imageId: string | null;
  aspectRatio: number | null;
  rect: Box | null;
};

const IDLE_CROP: CropState = { active: false, imageId: null, aspectRatio: null, rect: null };

const ARTBOARD_NAME = ARTBOARD_BACKGROUND_NAME;

/**
 * Breathing room (in px) kept around the artboard inside the scrolling
 * workspace so the artboard shadow and transformer anchors never stick to the
 * workspace edge. Reflected in the render as the `p-*` padding utility — keep
 * them in sync.
 */
const PAD = 56;

/**
 * Shared transformer anchor set for every selectable element — the text
 * transformer previously used a separate look, which this unifies.
 */
const SHARED_TRANSFORMER_ANCHORS = [
  "top-left",
  "top-right",
  "middle-left",
  "middle-right",
  "bottom-left",
  "bottom-right"
];

/** One style, applied to whichever element type is selected. */
const SHARED_TRANSFORMER_STYLE = {
  borderStroke: "#7c3aed",
  borderStrokeWidth: 1.5,
  anchorFill: "#ffffff",
  anchorStroke: "#7c3aed",
  anchorStrokeWidth: 1.5,
  anchorCornerRadius: 999,
  anchorSize: 10,
  sideAnchorWidth: 8,
  sideAnchorHeight: 24
} as const;

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable=true]"));
}

function intersects(a: Box, b: Box) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function normalizeBox(start: { x: number; y: number }, end: { x: number; y: number }): Box {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y)
  };
}

/**
 * The editor canvas.
 *
 * Everything the user sees on the artboard is rendered by react-konva from the
 * serializable element model in the editor store. This component owns the
 * imperative parts that cannot live in the model: the transformer, the crop
 * overlay, the DOM textarea used for text editing, zoom/pan of the viewport and
 * the window action bus the surrounding panels talk to.
 */
export function CanvasWorkspace({ projectId }: { projectId: string }) {
  const stageRef = useRef<Konva.Stage | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);
  const cropRectRef = useRef<Konva.Rect | null>(null);
  const cropTransformerRef = useRef<Konva.Transformer | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const marqueeStart = useRef<{ x: number; y: number } | null>(null);
  const panState = useRef<{ x: number; y: number; left: number; top: number } | null>(null);

  const width = useEditorStore((s) => s.width);
  const height = useEditorStore((s) => s.height);
  const background = useEditorStore((s) => s.background);
  const elements = useEditorStore((s) => s.elements);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const editingId = useEditorStore((s) => s.editingId);
  const zoom = useEditorStore((s) => s.zoom);
  const eyedropperTarget = useEditorStore((s) => s.eyedropperTarget);
  const closeEyedropper = useEditorStore((s) => s.closeEyedropper);

  const [alignmentLines, setAlignmentLines] = useState<AlignmentLine[]>([]);
  const [crop, setCrop] = useState<CropState>(IDLE_CROP);
  const [marquee, setMarquee] = useState<Box | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [panning, setPanning] = useState(false);
  const [eyedropperPos, setEyedropperPos] = useState<{ x: number; y: number } | null>(null);
  const magnifierCanvasRef = useRef<HTMLCanvasElement>(null);

  const ordered = useMemo(() => elements.slice().sort((a, b) => a.zIndex - b.zIndex), [elements]);
  const editingElement = useMemo(
    () => (editingId ? ordered.find((element) => element.id === editingId) ?? null : null),
    [editingId, ordered]
  );
  /* ---------------------------------------------------------------- */
  /* Stage registration + font readiness                              */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    registerStage(stageRef.current);
    return () => {
      // The header and export modal read the stage from this registry, so it has
      // to be cleared when the canvas unmounts or they would hold a dead node.
      registerStage(null);
    };
  }, []);

  useEffect(() => {
    void document.fonts?.ready.then(() => layerRef.current?.batchDraw());
  }, [elements]);

  // Eyedropper magnifier overlay
  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace || !eyedropperTarget) {
      setEyedropperPos(null);
      return;
    }

    const MAGNIFIER_SIZE = 80;
    const SAMPLE_SIZE = 15;

    function handleMouseMove(event: MouseEvent) {
      const stage = stageRef.current;
      const layer = layerRef.current;
      if (!stage || !layer) return;

      const container = stage.container();
      const containerRect = container.getBoundingClientRect();

      const x = event.clientX - containerRect.left;
      const y = event.clientY - containerRect.top;

      // Position the magnifier relative to workspace
      const wsRect = workspace!.getBoundingClientRect();
      setEyedropperPos({
        x: event.clientX - wsRect.left,
        y: event.clientY - wsRect.top
      });

      // Render magnifier preview from layer canvas
      const magnifier = magnifierCanvasRef.current;
      if (!magnifier) return;

      const layerCanvas = layer.getCanvas();
      if (!layerCanvas) return;

      const scaleX = stage.scaleX();
      const scaleY = stage.scaleY();
      const layerX = Math.round(x / scaleX);
      const layerY = Math.round(y / scaleY);

      magnifier.width = MAGNIFIER_SIZE;
      magnifier.height = MAGNIFIER_SIZE;
      const ctx = magnifier.getContext("2d");
      if (!ctx) return;

      const halfSample = Math.floor(SAMPLE_SIZE / 2);
      const pxPerTile = Math.floor(MAGNIFIER_SIZE / SAMPLE_SIZE);

      try {
        const sampleCanvas = document.createElement("canvas");
        sampleCanvas.width = SAMPLE_SIZE;
        sampleCanvas.height = SAMPLE_SIZE;
        const sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
        if (!sampleCtx) return;

        sampleCtx.drawImage(
          layerCanvas._canvas,
          Math.max(0, layerX - halfSample),
          Math.max(0, layerY - halfSample),
          SAMPLE_SIZE,
          SAMPLE_SIZE,
          0,
          0,
          SAMPLE_SIZE,
          SAMPLE_SIZE
        );

        const imgData = sampleCtx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        for (let row = 0; row < SAMPLE_SIZE; row += 1) {
          for (let col = 0; col < SAMPLE_SIZE; col += 1) {
            const i = (row * SAMPLE_SIZE + col) * 4;
            ctx.fillStyle = `rgb(${imgData.data[i]},${imgData.data[i + 1]},${imgData.data[i + 2]})`;
            ctx.fillRect(col * pxPerTile, row * pxPerTile, pxPerTile, pxPerTile);
          }
        }
      } catch {
        ctx.fillStyle = "#eee";
        ctx.fillRect(0, 0, MAGNIFIER_SIZE, MAGNIFIER_SIZE);
      }

      // Center crosshair
      const c = MAGNIFIER_SIZE / 2;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      ctx.strokeRect(c - pxPerTile / 2, c - pxPerTile / 2, pxPerTile, pxPerTile);
    }

    function handleMouseLeave() {
      setEyedropperPos(null);
    }

    workspace.addEventListener("mousemove", handleMouseMove);
    workspace.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      workspace.removeEventListener("mousemove", handleMouseMove);
      workspace.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [eyedropperTarget]);

  /* ---------------------------------------------------------------- */
  /* Transformer wiring                                               */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;
    if (crop.active || editingId) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }
    const nodes = selectedIds
      .map((id) => stage.findOne("#" + id))
      .filter((node): node is Konva.Node => Boolean(node));
    transformer.nodes(nodes);
    transformer.getLayer()?.batchDraw();
  }, [selectedIds, ordered, crop.active, editingId]);

  useEffect(() => {
    const transformer = cropTransformerRef.current;
    const rect = cropRectRef.current;
    if (!transformer) return;
    transformer.nodes(crop.active && rect ? [rect] : []);
    transformer.getLayer()?.batchDraw();
  }, [crop.active, crop.rect]);

  /* ---------------------------------------------------------------- */
  /* Element interaction: select, drag, resize, rotate                */
  /* ---------------------------------------------------------------- */

  const handlers = useMemo<ElementHandlers>(() => {
    const store = useEditorStore.getState;

    return {
      onSelect: (element, event) => {
        if (crop.active) return;
        const native = event.evt as MouseEvent | TouchEvent;
        const additive =
          native instanceof MouseEvent && (native.shiftKey || native.metaKey || native.ctrlKey);
        const state = store();
        if (element.locked) return;
        if (additive) {
          state.toggleSelected(element.id);
          return;
        }
        if (!state.selectedIds.includes(element.id)) state.setSelectedIds([element.id]);
        if (element.type === "text") state.setActivePanel("text");
        if (element.type === "image") state.setActivePanel("filters");
      },

      onEditText: (element) => {
        if (element.type !== "text" || element.locked) return;
        store().setEditingId(element.id);
      },

      onDragStart: (element) => {
        const state = store();
        if (!state.selectedIds.includes(element.id)) state.setSelectedIds([element.id]);
      },

      onDragMove: (element, event) => {
        const state = store();
        const node = event.target;
        const position = { x: node.x(), y: node.y() };
        const canvas = { width: state.width, height: state.height };
        const snapped = snapToAlignment(state.elements, element, canvas, position);
        node.position(snapped);
        setAlignmentLines(findAlignmentLines(state.elements, element, canvas, snapped));
      },

      onDragEnd: (element, event) => {
        const node = event.target;
        setAlignmentLines([]);
        const dx = node.x() - element.x;
        const dy = node.y() - element.y;
        // If the pointer never moved, reset the node to the stored geometry and
        // avoid creating a history entry. This also prevents any accidental
        // coordinate drift when a drag-like event fires without movement.
        if (Math.round(dx) === 0 && Math.round(dy) === 0) {
          node.position({ x: element.x, y: element.y });
          return;
        }
        const state = store();
        // Multi-selection drags move every selected element by the same delta.
        if (state.selectedIds.length > 1 && state.selectedIds.includes(element.id)) {
          node.position({ x: element.x, y: element.y });
          state.moveSelected(dx, dy);
          return;
        }
        state.updateElement(element.id, { x: node.x(), y: node.y() });
      },

      onTransformEnd: (element, event) => {
        const node = event.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        const state = store();
        const properties = element.properties;
        // Flipped nodes carry a baseline negative scale that must not be baked
        // into width/height.
        const baseX = properties.flipX ? -1 : 1;
        const baseY = properties.flipY ? -1 : 1;

        if (keepsScale(element)) {
          state.updateElement(element.id, {
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            scaleX: Math.abs(scaleX),
            scaleY: Math.abs(scaleY)
          });
          return;
        }

        // Bake the transform scale back into width/height and reset the node.
        const nextWidth = clampSize((element.width ?? node.width()) * Math.abs(scaleX));
        const nextHeight = clampSize((element.height ?? node.height()) * Math.abs(scaleY));
        node.scale({ x: baseX, y: baseY });

        if (element.type === "text") {
          // Text resize keeps the font size constant and only changes the box.
          // Persist both axes and force fixed-width mode so the transformer
          // stops recalculating from glyph metrics — the user has taken over.
          state.updateElement(element.id, {
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            width: nextWidth,
            height: nextHeight,
            properties: { textSizing: "fixed-width" }
          });
          return;
        }

        if (element.type === "line") {
          const points = (properties.points as number[] | undefined) ?? [];
          const factorX = nextWidth / Math.max(1, element.width ?? 1);
          const factorY = nextHeight / Math.max(1, element.height ?? 1);
          state.updateElement(element.id, {
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            width: nextWidth,
            height: nextHeight,
            properties: {
              points: points.map((value, index) => (index % 2 === 0 ? value * factorX : value * factorY))
            }
          });
          return;
        }

        state.updateElement(element.id, {
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          width: nextWidth,
          height: nextHeight
        });
      }
    };
  }, [crop.active]);

  /* ---------------------------------------------------------------- */
  /* Deselection + marquee selection on empty canvas                  */
  /* ---------------------------------------------------------------- */

  const onStageMouseDown = useCallback(
    (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (crop.active || spaceHeld) return;
      const stage = event.target.getStage();
      const isArtboard = event.target.name() === ARTBOARD_NAME;
      const isStage = event.target === stage;
      if (!isArtboard && !isStage) return;

      const store = useEditorStore.getState();
      store.clearSelection();
      // Clicking the empty artboard also hides the panels so the canvas
      // gets the full focus.
      if (!store.editingId) store.enterCanvasFocusMode();
      setAlignmentLines([]);

      const pointer = stage?.getPointerPosition();
      if (!pointer) return;
      marqueeStart.current = { x: pointer.x / zoom, y: pointer.y / zoom };
    },
    [crop.active, spaceHeld, zoom]
  );

  /**
   * Clicking the empty workspace around the artboard hides the contextual
   * toolbar and the expanded left panel (AssetPanel) by entering canvas
   * focus mode. This gives the user a clean, distraction-free canvas view.
   *
   * The Konva stage renders into a `canvas`, and every panel, toolbar, modal
   * and dropdown is excluded by `isWorkspaceBackgroundTarget`, so an element,
   * transformer handle or control can never trigger this.
   */
  const onWorkspacePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if (!isWorkspaceBackgroundTarget(event.target, workspaceRef.current)) return;
    const store = useEditorStore.getState();
    if (store.editingId) return;
    store.clearSelection();
    store.enterCanvasFocusMode();
  }, []);

  const onStageMouseMove = useCallback(
    (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const start = marqueeStart.current;
      if (!start) return;
      const pointer = event.target.getStage()?.getPointerPosition();
      if (!pointer) return;
      setMarquee(normalizeBox(start, { x: pointer.x / zoom, y: pointer.y / zoom }));
    },
    [zoom]
  );

  const onStageMouseUp = useCallback(() => {
    const box = marquee;
    marqueeStart.current = null;
    setMarquee(null);
    if (!box || box.width < 4 || box.height < 4) return;
    const state = useEditorStore.getState();
    const hits = state.elements
      .filter((element) => !element.locked && element.visible !== false)
      .filter((element) => intersects(box, getElementBox(element)))
      .map((element) => element.id);
    if (hits.length > 0) state.setSelectedIds(hits);
  }, [marquee]);

  /**
   * Samples a color from the canvas at the given stage coordinates.
   * Returns a HEX color string or null if sampling fails.
   */
  const sampleColorAt = useCallback(
    (stageX: number, stageY: number): string | null => {
      const stage = stageRef.current;
      const layer = layerRef.current;
      if (!stage || !layer) return null;

      // Create a temporary small canvas to sample the pixel
      const scaleX = stage.scaleX();
      const scaleY = stage.scaleY();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;

      // We only need a 1x1 pixel sample
      canvas.width = 1;
      canvas.height = 1;

      // Draw the layer to the small canvas at the target position
      // We need to account for the stage scale and position
      const layerCanvas = layer.getCanvas();
      if (!layerCanvas) return null;

      // Calculate the position on the layer canvas
      const layerX = (stageX - stage.x()) / scaleX;
      const layerY = (stageY - stage.y()) / scaleY;

      // Draw a 1x1 pixel from the layer canvas
      ctx.drawImage(layerCanvas._canvas, layerX, layerY, 1, 1, 0, 0, 1, 1);

      // Read the pixel data
      const pixel = ctx.getImageData(0, 0, 1, 1).data;
      if (!pixel) return null;

      const [r, g, b, a] = pixel;
      // If fully transparent, return null (let caller handle fallback)
      if (a === 0) return null;

      // Convert to HEX
      const toHex = (n: number) => n.toString(16).padStart(2, "0");
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
    },
    []
  );

  /**
   * Handles eyedropper color sampling on stage click.
   * Only triggers when eyedropperTarget is active.
   */
  const onEyedropperClick = useCallback(
    (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (!eyedropperTarget) return;
      if (crop.active || spaceHeld || editingId) return;

      const stage = event.target.getStage();
      if (!stage) return;

      // Only sample when clicking on the artboard background or stage
      const isArtboard = event.target.name() === ARTBOARD_NAME;
      const isStage = event.target === stage;
      if (!isArtboard && !isStage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Convert pointer position to stage coordinates (unscaled)
      const stageX = pointer.x;
      const stageY = pointer.y;

      const color = sampleColorAt(stageX, stageY);
      if (!color) return;

      const store = useEditorStore.getState();
      const selected = store.elements.find((el) => store.selectedIds.includes(el.id));
      if (!selected) return;

      // Apply the sampled color to the selected element
      const properties: Record<string, unknown> = { [eyedropperTarget]: color };
      // If sampling for stroke, ensure strokeWidth is set
      if (eyedropperTarget === "stroke" && !Number(selected.properties.strokeWidth ?? 0)) {
        properties.strokeWidth = 2;
      }
      // A solid fill replaces the gradient
      if (eyedropperTarget === "fill") properties.gradient = null;

      store.updateSelected({ properties });
      closeEyedropper();
    },
    [eyedropperTarget, crop.active, spaceHeld, editingId, sampleColorAt, closeEyedropper]
  );

  /* ---------------------------------------------------------------- */
  /* Zoom + pan                                                       */
  /* ---------------------------------------------------------------- */
  /**
   * The workspace is the single scroll container (`overflow: auto` with thin
   * scrollbars; see globals.css). The artboard wrapper inside carries the
   * scaled dimensions (canvas size × zoom), so when the canvas grows larger
   * than the workspace the workspace itself shows scrollbars — nothing else
   * in the editor moves, and the page never gains a second scrollbar.
   *
   * Zooming is workspace-centered: the scene point sitting at the middle of
   * the visible workspace stays in the middle regardless of where the cursor
   * or trackpad pointer happens to be.
   */

  /**
   * Whether the content box (padding included) should be centered along an
   * axis, i.e. the scaled artboard plus the visual padding still fits inside
   * the visible workspace on that axis.
   */
  const fitsAxis = useCallback(
    (scaledLength: number, viewportLength: number, padding: number) =>
      scaledLength + padding * 2 <= viewportLength,
    []
  );

  /**
   * Zooms around the centre of the workspace. The scene coordinate currently
   * displayed at the workspace centre is preserved, so the canvas never
   * follows the cursor, never jumps sideways and never hides behind panels.
   */
  const zoomAt = useCallback(
    (nextZoom: number) => {
      const state = useEditorStore.getState();
      const workspace = workspaceRef.current;
      const previous = state.zoom;
      const next = Math.min(4, Math.max(0.05, nextZoom));
      if (!workspace || next === previous) {
        state.setZoom(next);
        return;
      }

      // Scene coordinate at the current centre of the visible workspace.
      const contentLeft = workspace.scrollLeft + PAD;
      const contentTop = workspace.scrollTop + PAD;
      const centerSceneX = (contentLeft + workspace.clientWidth / 2) / previous;
      const centerSceneY = (contentTop + workspace.clientHeight / 2) / previous;

      state.setZoom(next);

      // After React applies the new stage size the browser may clamp the
      // scroll offsets. Re-center on the preserved scene point next frame.
      requestAnimationFrame(() => {
        const scaledWidth = state.width * next;
        const scaledHeight = state.height * next;
        const centerX = fitsAxis(scaledWidth, workspace.clientWidth, PAD)
          ? 0
          : centerSceneX * next - PAD - workspace.clientWidth / 2;
        const centerY = fitsAxis(scaledHeight, workspace.clientHeight, PAD)
          ? 0
          : centerSceneY * next - PAD - workspace.clientHeight / 2;
        workspace.scrollTo({ left: centerX, top: centerY });
      });
    },
    // `PAD` is a module-level constant, not reactive state — ESLint's
    // exhaustive-deps accepts it, but we keep the callback lean.
    [fitsAxis]
  );

  /**
   * Native non-passive wheel listener. React's synthetic onWheel is passive
   * by default in modern browsers, so preventDefault() there is ignored and
   * the browser would still zoom the page on Ctrl/trackpad-pinch.
   *
   * `zoomAt` is stable, so the listener attaches once per mount — safe for
   * React Strict Mode.
   */
  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;

    const handleWheel = (event: WheelEvent) => {
      // Ctrl/Cmd + wheel is the standard zoom gesture and also what browsers
      // send for trackpad pinch. Plain wheel keeps native workspace scrolling,
      // which drives the dedicated workspace scrollbars.
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const factor = Math.exp(-event.deltaY / 400);
      zoomAt(useEditorStore.getState().zoom * factor);
    };

    workspace.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      workspace.removeEventListener("wheel", handleWheel);
    };
  }, [zoomAt]);

  const onPanPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onWorkspacePointerDown(event);
      const workspace = workspaceRef.current;
      if (!workspace) return;
      const isMiddle = event.button === 1;
      if (!isMiddle && !(spaceHeld && event.button === 0)) return;
      event.preventDefault();
      panState.current = {
        x: event.clientX,
        y: event.clientY,
        left: workspace.scrollLeft,
        top: workspace.scrollTop
      };
      setPanning(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [onWorkspacePointerDown, spaceHeld]
  );

  const onPanPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const origin = panState.current;
    const workspace = workspaceRef.current;
    if (!origin || !workspace) return;
    workspace.scrollLeft = origin.left - (event.clientX - origin.x);
    workspace.scrollTop = origin.top - (event.clientY - origin.y);
  }, []);

  const onPanPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!panState.current) return;
    panState.current = null;
    setPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const zoomToFit = useCallback(() => {
    const workspace = workspaceRef.current;
    const state = useEditorStore.getState();
    if (!workspace) return;
    state.setZoom(
      fitScale(
        { width: state.width, height: state.height },
        { width: workspace.clientWidth, height: workspace.clientHeight }
      )
    );
    // After fit, the artboard is smaller than the workspace so the flex
    // centring in the render takes over; scroll offsets reset cleanly.
    requestAnimationFrame(() => {
      workspace.scrollTo({ left: 0, top: 0 });
    });
  }, []);

  /* ---------------------------------------------------------------- */
  /* Crop                                                             */
  /* ---------------------------------------------------------------- */

  const startCrop = useCallback(() => {
    const state = useEditorStore.getState();
    const target = state.elements.find(
      (element) => state.selectedIds.includes(element.id) && element.type === "image"
    );
    if (!target) {
      toast.error("Please select an image to crop");
      return;
    }
    setCrop({
      active: true,
      imageId: target.id,
      aspectRatio: null,
      rect: { x: target.x, y: target.y, width: target.width ?? 100, height: target.height ?? 100 }
    });
    toast.info("Adjust crop area and click Apply");
  }, []);

  const cancelCrop = useCallback(() => {
    setCrop((current) => (current.active ? IDLE_CROP : current));
  }, []);

  const applyCrop = useCallback(() => {
    const node = cropRectRef.current;
    const state = useEditorStore.getState();
    if (!crop.active || !crop.imageId || !node) return;
    const image = state.elements.find((element) => element.id === crop.imageId);
    if (!image) {
      setCrop(IDLE_CROP);
      return;
    }

    const boxWidth = Math.abs(node.width() * node.scaleX());
    const boxHeight = Math.abs(node.height() * node.scaleY());
    const displayWidth = image.width ?? boxWidth;
    const displayHeight = image.height ?? boxHeight;
    const naturalWidth = Number(image.properties.naturalWidth ?? displayWidth) || displayWidth;
    const naturalHeight = Number(image.properties.naturalHeight ?? displayHeight) || displayHeight;
    const previous = (image.properties.crop as CropConfig | null) ?? {
      x: 0,
      y: 0,
      width: naturalWidth,
      height: naturalHeight
    };

    // Convert the crop box from artboard space into source-image pixels.
    const ratioX = previous.width / Math.max(1, displayWidth);
    const ratioY = previous.height / Math.max(1, displayHeight);
    const offsetX = Math.max(0, node.x() - image.x);
    const offsetY = Math.max(0, node.y() - image.y);

    state.updateElement(image.id, {
      x: image.x + offsetX,
      y: image.y + offsetY,
      width: clampSize(boxWidth),
      height: clampSize(boxHeight),
      properties: {
        crop: {
          x: previous.x + offsetX * ratioX,
          y: previous.y + offsetY * ratioY,
          width: Math.max(1, boxWidth * ratioX),
          height: Math.max(1, boxHeight * ratioY)
        }
      }
    });

    setCrop(IDLE_CROP);
    toast.success("Crop applied");
  }, [crop.active, crop.imageId]);

  const setCropAspectRatio = useCallback((aspectRatio: number | null) => {
    setCrop((current) => {
      if (!current.active || !current.rect) return { ...current, aspectRatio };
      if (!aspectRatio) return { ...current, aspectRatio };
      const rect = { ...current.rect, height: current.rect.width / aspectRatio };
      cropRectRef.current?.setAttrs({ ...rect, scaleX: 1, scaleY: 1 });
      cropRectRef.current?.getLayer()?.batchDraw();
      return { ...current, aspectRatio, rect };
    });
  }, []);

  /* ---------------------------------------------------------------- */
  /* Action bus                                                       */
  /* ---------------------------------------------------------------- */

  const runAction = useCallback(
    (detail: StudioAction) => {
      const state = useEditorStore.getState();
      const canvas = { width: state.width, height: state.height };
      const action = typeof detail === "string" ? detail : detail.action;
      const payload = typeof detail === "string" ? undefined : (detail as { payload?: unknown }).payload;

      const selectedImages = () =>
        state.elements.filter((element) => state.selectedIds.includes(element.id) && element.type === "image");

      switch (action) {
        case "duplicate":
          state.duplicateSelected();
          return;
        case "delete":
          state.removeSelected();
          return;
        case "save":
          state.commit();
          toast.success("Project saved");
          return;
        case "undo":
          state.undo();
          return;
        case "redo":
          state.redo();
          return;
        case "clear-selection":
          state.clearSelection();
          return;
        case "select-all":
          state.selectAll();
          return;
        case "group":
          state.groupSelected();
          return;
        case "ungroup":
          state.ungroupSelected();
          return;
        case "bring-front":
          state.bringToFront();
          return;
        case "send-back":
          state.sendToBack();
          return;
        case "bring-forward":
          state.bringForward();
          return;
        case "send-backward":
          state.sendBackward();
          return;
        case "flip":
          state.getSelectedElements().forEach((element) =>
            state.updateElement(element.id, { properties: { flipX: !element.properties.flipX } })
          );
          return;
        case "flip-vertical":
          state.getSelectedElements().forEach((element) =>
            state.updateElement(element.id, { properties: { flipY: !element.properties.flipY } })
          );
          return;
        case "toggle-text-sizing":
          state.getSelectedElements().forEach((element) => {
            if (element.type !== "text") return;
            const current = (element.properties.textSizing as "auto-width" | "fixed-width" | undefined) ?? "fixed-width";
            state.updateElement(element.id, {
              properties: { textSizing: current === "auto-width" ? "fixed-width" : "auto-width" }
            });
          });
          return;
        case "color":
          state.updateSelected({ properties: { fill: "#C7FF00" } });
          return;
        case "align-left":
          state.alignSelected("left");
          return;
        case "align-center-horizontal":
          state.alignSelected("center-horizontal");
          return;
        case "align-right":
          state.alignSelected("right");
          return;
        case "align-top":
          state.alignSelected("top");
          return;
        case "align-center-vertical":
          state.alignSelected("center-vertical");
          return;
        case "align-bottom":
          state.alignSelected("bottom");
          return;
        case "start-crop":
          startCrop();
          return;
        case "apply-crop":
          applyCrop();
          return;
        case "cancel-crop":
          cancelCrop();
          return;
        case "zoom-in":
          zoomAt(nextStepZoom(state.zoom, 1));
          return;
        case "zoom-out":
          zoomAt(nextStepZoom(state.zoom, -1));
          return;
        case "zoom-reset":
          zoomAt(1);
          return;
        case "zoom-fit":
          zoomToFit();
          return;
        case "apply-template": {
          const scene = deserializeEditorState(payload, canvas.width, canvas.height);
          state.loadScene({ ...scene, metadata: { ...scene.metadata, projectId } }, projectId);
          toast.success("Template applied");
          return;
        }
        case "document": {
          const next = payload as { width?: number; height?: number; background?: string };
          if (next.width !== undefined || next.height !== undefined) {
            state.setCanvasSize(Number(next.width ?? canvas.width), Number(next.height ?? canvas.height));
          }
          if (next.background) state.setBackground(next.background);
          return;
        }
        case "add-page":
          toast.info("Multi-page documents are not supported yet");
          return;
        case "add-text":
          state.addElements([createTextElement((payload ?? {}) as Record<string, never>)]);
          return;
        case "add-shape": {
          const shape = payload as {
            shape?: "rect" | "circle" | "line" | "frame" | "polygon" | "arrow";
            name?: string;
            svgPath?: string;
            viewBox?: string;
          };
          if (shape?.svgPath) {
            state.addElements([
              createPathElement({ data: shape.svgPath, viewBox: shape.viewBox, name: shape.name })
            ]);
            return;
          }
          const kind = shape?.shape ?? "rect";
          if (kind === "circle") {
            state.addElements([createCircleElement({ name: shape?.name })]);
          } else if (kind === "line") {
            state.addElements([createLineElement({ name: shape?.name })]);
          } else if (kind === "polygon") {
            state.addElements([
              createLineElement({
                name: shape?.name ?? "Polygon",
                points: [90, 0, 180, 70, 145, 180, 35, 180, 0, 70],
                closed: true,
                fill: "#C7FF00",
                stroke: "#F5F5F2",
                strokeWidth: 3
              })
            ]);
          } else if (kind === "arrow") {
            state.addElements([
              createLineElement({
                name: shape?.name ?? "Arrow",
                points: [0, 36, 260, 36, 260, 0, 360, 70, 260, 140, 260, 104, 0, 104],
                closed: true,
                fill: "#C7FF00",
                strokeWidth: 0
              })
            ]);
          } else if (kind === "frame") {
            state.addElements([
              createRectElement({
                name: shape?.name ?? "Image Frame",
                width: 360,
                height: 240,
                fill: "rgba(199,255,0,0.08)",
                stroke: "#C7FF00",
                strokeWidth: 4,
                cornerRadius: 8
              })
            ]);
          } else {
            state.addElements([createRectElement({ name: shape?.name, cornerRadius: 8 })]);
          }
          return;
        }
        case "add-image": {
          const image = payload as { src: string; name: string; cover?: boolean };
          // Newly inserted images cover the artboard by default: the element box
          // becomes the artboard and the overflow is stored as a centred crop.
          const cover = image.cover !== false;
          probeImageSize(image.src)
            .then((probed) => {
              const store = useEditorStore.getState();
              store.addElements([
                createImageElement({
                  src: image.src,
                  name: image.name,
                  naturalWidth: probed.naturalWidth,
                  naturalHeight: probed.naturalHeight,
                  canvas: cover ? { width: store.width, height: store.height } : undefined
                })
              ]);
            })
            .catch(() => {
              toast.error("Could not load " + image.name);
            });
          return;
        }
        case "replace-image": {
          const target =
            (payload as { elementId?: string } | undefined)?.elementId ??
            state.elements.find(
              (element) => state.selectedIds.includes(element.id) && element.type === "image"
            )?.id;
          if (!target) {
            toast.error("Select an image to replace");
            return;
          }
          const element = state.elements.find((item) => item.id === target);
          if (!element || element.type !== "image") {
            toast.error("Select an image to replace");
            return;
          }
          if (element.locked) {
            toast.error("Unlock the image before replacing it");
            return;
          }
          state.setSelectedIds([target]);
          state.setPendingReplaceId(target);
          state.setActivePanel("images");
          toast.info("Pick a replacement image");
          return;
        }
        case "replace-image-source": {
          const request = payload as { elementId?: string; src: string; name?: string };
          const target = request.elementId ?? state.pendingReplaceId;
          if (!target || !request.src) return;
          probeImageSize(request.src)
            .then((probed) => {
              // A single store action produces exactly one history entry and
              // preserves the element id, geometry and every other property.
              useEditorStore.getState().replaceImage(target, {
                src: request.src,
                name: request.name,
                naturalWidth: probed.naturalWidth,
                naturalHeight: probed.naturalHeight
              });
              toast.success("Image replaced");
            })
            .catch(() => {
              useEditorStore.getState().setPendingReplaceId(null);
              toast.error("Could not load the replacement image");
            });
          return;
        }
        case "cover-canvas": {
          const target =
            (payload as { elementId?: string } | undefined)?.elementId ??
            state.elements.find(
              (element) => state.selectedIds.includes(element.id) && element.type === "image"
            )?.id;
          if (!target) {
            toast.error("Select an image to cover the canvas");
            return;
          }
          state.coverCanvasWithImage(target);
          toast.success("Image covers the canvas");
          return;
        }
        case "add-asset": {
          const asset = payload as { kind: "player" | "atmosphere" | "light"; name: string };
          state.addElements(createAssetElements(asset.kind, asset.name, canvas), {
            toBack: asset.kind === "atmosphere"
          });
          return;
        }
        case "add-element": {
          const composite = payload as { kind: CompositeKind; name: string };
          state.addElements(createCompositeElements(composite.kind, composite.name, canvas), {
            toBack: composite.kind === "gradient" || composite.kind === "pattern"
          });
          return;
        }
        case "add-sticker": {
          const sticker = payload as { kind: "trophy" | "ball" | "whistle" | "boot" | "spark"; name: string };
          state.addElements(createStickerElements(sticker.kind, sticker.name));
          return;
        }
        case "update-active": {
          if (state.selectedIds.length === 0) return;
          state.updateSelected(toElementPatch(payload as ElementUpdatePayload));
          return;
        }
        case "apply-filter": {
          const filter = payload as { filterType: string; value: number };
          selectedImages().forEach((element) => {
            const filters = { ...((element.properties.filters as ImageFilterConfig | null) ?? {}) };
            (filters as Record<string, number>)[filter.filterType] = filter.value;
            state.updateElement(element.id, { properties: { filters } });
          });
          return;
        }
        case "apply-filter-preset": {
          const preset = (payload as { filters: Record<string, number> }).filters;
          selectedImages().forEach((element) =>
            state.updateElement(element.id, { properties: { filters: { ...preset } } })
          );
          return;
        }
        case "reset-filters":
          selectedImages().forEach((element) => state.updateElement(element.id, { properties: { filters: null } }));
          return;
        case "apply-gradient":
          state.updateSelected({ properties: { gradient: payload as GradientConfig } });
          return;
        case "remove-gradient":
          state.updateSelected({ properties: { gradient: null } });
          return;
        case "apply-text-shadow": {
          const shadow = payload as {
            enabled: boolean;
            color?: string;
            blur?: number;
            offsetX?: number;
            offsetY?: number;
          };
          state.updateSelected({
            properties: {
              shadow: shadow.enabled
                ? {
                    color: shadow.color ?? "#000000",
                    blur: shadow.blur ?? 10,
                    offsetX: shadow.offsetX ?? 5,
                    offsetY: shadow.offsetY ?? 5
                  }
                : null
            }
          });
          return;
        }
        case "apply-text-stroke": {
          const stroke = payload as { enabled: boolean; color?: string; width?: number };
          state.updateSelected({
            properties: stroke.enabled
              ? { stroke: stroke.color ?? "#000000", strokeWidth: stroke.width ?? 2 }
              : { stroke: undefined, strokeWidth: 0 }
          });
          return;
        }
        case "apply-text-glow": {
          const glow = payload as { enabled: boolean; color?: string; blur?: number };
          state.updateSelected({
            properties: {
              shadow: glow.enabled
                ? { color: glow.color ?? "#C7FF00", blur: glow.blur ?? 20, offsetX: 0, offsetY: 0 }
                : null
            }
          });
          return;
        }
        case "reset-text-effects":
          state.updateSelected({ properties: { shadow: null, stroke: undefined, strokeWidth: 0 } });
          return;
        case "set-crop-aspect-ratio":
          setCropAspectRatio((payload as { aspectRatio: number | null }).aspectRatio);
          return;
        case "export": {
          const options = payload as { format: "png" | "jpeg" | "jpg" | "svg" | "pdf"; multiplier?: number };
          const stage = stageRef.current;
          if (!stage) return;
          state.clearSelection();
          exportStage(stage, canvas, {
            format: options.format,
            pixelRatio: options.multiplier ?? 1,
            fileName: "pro-studio-export"
          });
          return;
        }
        default:
          return;
      }
    },
    [applyCrop, cancelCrop, projectId, setCropAspectRatio, startCrop, zoomAt, zoomToFit]
  );

  useEffect(() => {
    const onAction = (event: Event) => runAction((event as CustomEvent<StudioAction>).detail);
    const onLayerAction = (event: Event) => {
      const detail = (event as CustomEvent<LayerActionDetail>).detail;
      const state = useEditorStore.getState();
      switch (detail.action) {
        case "select":
          state.setSelectedIds([detail.objectId]);
          return;
        case "toggle-visibility":
          state.toggleVisibility(detail.objectId);
          return;
        case "toggle-lock":
          state.toggleLock(detail.objectId);
          return;
        case "delete":
          state.removeElement(detail.objectId);
          return;
        case "rename":
          if (detail.name) state.renameElement(detail.objectId, detail.name);
          return;
        case "reorder":
          if (detail.targetObjectId) state.reorder(detail.objectId, detail.targetObjectId);
          return;
      }
    };

    window.addEventListener(STUDIO_ACTION_EVENT, onAction);
    window.addEventListener(STUDIO_LAYER_ACTION_EVENT, onLayerAction);
    return () => {
      window.removeEventListener(STUDIO_ACTION_EVENT, onAction);
      window.removeEventListener(STUDIO_LAYER_ACTION_EVENT, onLayerAction);
    };
  }, [runAction]);

  /* ---------------------------------------------------------------- */
  /* Keyboard shortcuts                                               */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") setSpaceHeld(false);
    };

    const onKey = (event: KeyboardEvent) => {
      const state = useEditorStore.getState();
      if (isTypingTarget(event.target) || state.editingId) return;
      const cmd = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (event.code === "Space" && !cmd) {
        event.preventDefault();
        setSpaceHeld(true);
        return;
      }

      if (crop.active) {
        if (event.key === "Enter") {
          event.preventDefault();
          applyCrop();
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          cancelCrop();
          return;
        }
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        state.removeSelected();
        return;
      }
      if (event.key === "Escape") {
        // Cancel eyedropper mode if active
        if (state.eyedropperTarget) {
          event.preventDefault();
          state.closeEyedropper();
          return;
        }
        // Escape always restores the editor UI, so focus mode cannot trap the user.
        if (state.isCanvasFocusMode) state.exitCanvasFocusMode();
        state.clearSelection();
        return;
      }
      if (cmd && key === "d") {
        event.preventDefault();
        state.duplicateSelected();
        return;
      }
      if (cmd && key === "c") {
        state.copySelected();
        return;
      }
      if (cmd && key === "v") {
        event.preventDefault();
        state.paste();
        return;
      }
      if (cmd && key === "x") {
        state.copySelected();
        state.removeSelected();
        return;
      }
      if (cmd && key === "z" && !event.shiftKey) {
        event.preventDefault();
        state.undo();
        return;
      }
      if (cmd && ((key === "z" && event.shiftKey) || key === "y")) {
        event.preventDefault();
        state.redo();
        return;
      }
      if (cmd && key === "a") {
        event.preventDefault();
        state.selectAll();
        return;
      }
      if (cmd && key === "g") {
        event.preventDefault();
        if (event.shiftKey) state.ungroupSelected();
        else state.groupSelected();
        return;
      }
      if (cmd && key === "s") {
        event.preventDefault();
        state.commit();
        toast.success("Project saved");
        return;
      }
      if (cmd && (key === "=" || key === "+" || event.code === "Equal" || event.code === "NumpadAdd")) {
        event.preventDefault();
        zoomAt(nextStepZoom(state.zoom, 1));
        return;
      }
      if (cmd && (key === "-" || event.code === "Minus" || event.code === "NumpadSubtract")) {
        event.preventDefault();
        zoomAt(nextStepZoom(state.zoom, -1));
        return;
      }
      if (cmd && (key === "0" || event.code === "Digit0" || event.code === "Numpad0")) {
        event.preventDefault();
        zoomToFit();
        return;
      }
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        const step = event.shiftKey ? 10 : 1;
        const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
        const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
        state.moveSelected(dx, dy);
      }
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [applyCrop, cancelCrop, crop.active, zoomAt, zoomToFit]);

  /* ---------------------------------------------------------------- */
  /* Drag & drop from the asset panels                                */
  /* ---------------------------------------------------------------- */

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      const raw = event.dataTransfer.getData(STUDIO_DRAG_TYPE);
      if (!raw) return;
      event.preventDefault();
      const container = event.currentTarget.getBoundingClientRect();
      const point = pointerToCanvas(event.clientX, event.clientY, container, zoom);
      const detail = JSON.parse(raw) as StudioAction;
      const action = typeof detail === "string" ? detail : detail.action;
      runAction(detail);
      // Dropped images cover the artboard, so they must not be nudged to the
      // drop point. They are also added asynchronously once the source has
      // loaded, so there is nothing to move yet.
      if (action === "add-image" || action === "replace-image-source") return;
      // Newly added elements are selected, so nudge them to the drop point.
      const state = useEditorStore.getState();
      const first = state.getSelectedElements()[0];
      if (first) {
        state.moveSelected(
          Math.round(point.x - first.x - (first.width ?? 0) / 2),
          Math.round(point.y - first.y - (first.height ?? 0) / 2)
        );
      }
    },
    [runAction, zoom]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (event.dataTransfer.types.includes(STUDIO_DRAG_TYPE)) event.preventDefault();
  }, []);

  /* ---------------------------------------------------------------- */
  /* Render                                                           */
  /* ---------------------------------------------------------------- */

  const cursor = eyedropperTarget ? "crosshair" : panning ? "grabbing" : spaceHeld ? "grab" : undefined;
  const scaledWidth = width * zoom;
  const scaledHeight = height * zoom;

  return (
    <div
      ref={workspaceRef}
      data-workspace-background
      data-name={WORKSPACE_BACKGROUND_NAME}
      className="studio-canvas-workspace relative h-full w-full min-w-0 min-h-0 overflow-auto"
      style={{ cursor }}
      onPointerDown={onPanPointerDown}
      onPointerMove={onPanPointerMove}
      onPointerUp={onPanPointerUp}
      onPointerCancel={onPanPointerUp}
    >
      <CropTool
        cropMode={{ active: crop.active, imageId: crop.imageId, aspectRatio: crop.aspectRatio }}
        onCancel={cancelCrop}
      />
      {/* Zoom controls positioned inside workspace at bottom-right */}
      <ZoomControls />
      {/* Eyedropper magnifier overlay */}
      {eyedropperTarget && eyedropperPos && (
        <div
          className="absolute pointer-events-none z-50"
          style={{
            left: eyedropperPos.x - 40,
            top: eyedropperPos.y - 40,
            width: 80,
            height: 80
          }}
        >
          <canvas
            ref={magnifierCanvasRef}
            className="w-full h-full rounded-full border-2 border-gray-400 shadow-lg"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      )}
      {/*
        Spacer-sized content box: its dimensions (artboard × zoom + padding)
        define the scrollable area. Flex centring keeps a canvas smaller than
        the workspace centred; once the content overflows, the workspace
        scrollbars take over.
      */}
      <div
        data-workspace-background
        className="flex min-h-full min-w-full items-center justify-center"
        style={{ width: "max-content", height: "max-content", minWidth: "100%", minHeight: "100%" }}
      >
        <div
          className="relative shrink-0 rounded-sm shadow-[0_18px_70px_rgba(0,0,0,0.14)]"
          style={{
            width: scaledWidth,
            height: scaledHeight,
            margin: PAD
          }}
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
        <Stage
          ref={stageRef}
          width={scaledWidth}
          height={scaledHeight}
          scaleX={zoom}
          scaleY={zoom}
          onMouseDown={onStageMouseDown}
          onTouchStart={onStageMouseDown}
          onMouseMove={onStageMouseMove}
          onTouchMove={onStageMouseMove}
          onMouseUp={onStageMouseUp}
          onTouchEnd={onStageMouseUp}
          onClick={onEyedropperClick}
        >
          <Layer ref={layerRef}>
            <Rect name={ARTBOARD_NAME} x={0} y={0} width={width} height={height} fill={background} listening />
            {ordered.map((element) => (
              <ElementNode key={element.id} element={element} editingId={editingId} handlers={handlers} />
            ))}
            {marquee ? (
              <Rect
                x={marquee.x}
                y={marquee.y}
                width={marquee.width}
                height={marquee.height}
                fill="rgba(91,44,160,0.12)"
                stroke="#5B2CA0"
                strokeWidth={1 / zoom}
                listening={false}
              />
            ) : null}
            <Transformer
              ref={transformerRef}
              // All selectable elements use the same anchor look: purple border,
              // white circular corners, white pill side anchors, no rotation.
              rotateEnabled={false}
              rotationSnaps={[]}
              keepRatio={false}
              ignoreStroke
              flipEnabled
              {...SHARED_TRANSFORMER_STYLE}
              enabledAnchors={SHARED_TRANSFORMER_ANCHORS}
              padding={0}
              anchorSize={SHARED_TRANSFORMER_STYLE.anchorSize / zoom}
              borderStrokeWidth={SHARED_TRANSFORMER_STYLE.borderStrokeWidth / zoom}
              anchorStrokeWidth={SHARED_TRANSFORMER_STYLE.anchorStrokeWidth / zoom}
              anchorStyleFunc={(anchor) => {
                const name = anchor.name();
                const visualScale = 1 / zoom;

                if (name === "middle-left" || name === "middle-right") {
                  anchor.width(SHARED_TRANSFORMER_STYLE.sideAnchorWidth * visualScale);
                  anchor.height(SHARED_TRANSFORMER_STYLE.sideAnchorHeight * visualScale);
                  anchor.offsetX((SHARED_TRANSFORMER_STYLE.sideAnchorWidth / 2) * visualScale);
                  anchor.offsetY((SHARED_TRANSFORMER_STYLE.sideAnchorHeight / 2) * visualScale);
                  anchor.cornerRadius(SHARED_TRANSFORMER_STYLE.anchorCornerRadius);
                  anchor.fill(SHARED_TRANSFORMER_STYLE.anchorFill);
                  anchor.stroke(SHARED_TRANSFORMER_STYLE.anchorStroke);
                  anchor.strokeWidth(SHARED_TRANSFORMER_STYLE.anchorStrokeWidth * visualScale);
                  return;
                }

                const size = SHARED_TRANSFORMER_STYLE.anchorSize * visualScale;
                anchor.width(size);
                anchor.height(size);
                anchor.offsetX(size / 2);
                anchor.offsetY(size / 2);
                anchor.cornerRadius(SHARED_TRANSFORMER_STYLE.anchorCornerRadius);
                anchor.fill(SHARED_TRANSFORMER_STYLE.anchorFill);
                anchor.stroke(SHARED_TRANSFORMER_STYLE.anchorStroke);
                anchor.strokeWidth(SHARED_TRANSFORMER_STYLE.anchorStrokeWidth * visualScale);
              }}
              boundBoxFunc={(oldBox, newBox) => (newBox.width < 5 || newBox.height < 5 ? oldBox : newBox)}
            />
          </Layer>
          {crop.active && crop.rect ? (
            <Layer>
              <Rect
                ref={cropRectRef}
                x={crop.rect.x}
                y={crop.rect.y}
                width={crop.rect.width}
                height={crop.rect.height}
                stroke="#C7FF00"
                strokeWidth={3 / zoom}
                dash={[10, 5]}
                draggable
              />
              <Transformer
                ref={cropTransformerRef}
                rotateEnabled={false}
                keepRatio={Boolean(crop.aspectRatio)}
                anchorStroke="#C7FF00"
                borderStroke="#C7FF00"
                anchorFill="#0b0b0b"
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 10 || newBox.height < 10) return oldBox;
                  if (!crop.aspectRatio) return newBox;
                  return { ...newBox, height: newBox.width / crop.aspectRatio };
                }}
              />
            </Layer>
          ) : null}
        </Stage>
        <AlignmentGuides lines={alignmentLines} zoom={zoom} />
        {editingElement ? (
          <TextEditorOverlay
            element={editingElement}
            zoom={zoom}
            onChange={(text) =>
              useEditorStore.getState().updateElement(editingElement.id, { properties: { text } }, { commit: false })
            }
            onClose={() => {
              useEditorStore.getState().commit();
              useEditorStore.getState().setEditingId(null);
            }}
          />
        ) : null}
        </div>
      </div>
    </div>
  );
}
