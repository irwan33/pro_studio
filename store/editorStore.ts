"use client";

import { create } from "zustand";
import {
  DEFAULT_BACKGROUND,
  DEFAULT_CANVAS_HEIGHT,
  DEFAULT_CANVAS_WIDTH,
  createElementId,
  serializeEditorState
} from "@/lib/editor/serialization";
import { clampSize, keepsScale } from "@/lib/editor/coordinates";
import { coverCanvas, coverCrop } from "@/lib/editor/image-fit";
import type { EditorElement, EditorPanel, EditorScene } from "@/lib/editor/types";

export type SaveStatus = "idle" | "saving" | "saved" | "failed";

const HISTORY_LIMIT = 60;

/** Payload accepted by `replaceImage`. Only the source content is replaced. */
export type ReplacementImage = {
  src: string;
  name?: string;
  naturalWidth?: number;
  naturalHeight?: number;
};

type HistoryEntry = {
  elements: EditorElement[];
  background: string;
  width: number;
  height: number;
};

type ElementPatch = Partial<Omit<EditorElement, "properties">> & {
  properties?: Record<string, unknown>;
};

type EditorState = {
  /* document */
  projectId: string | null;
  width: number;
  height: number;
  background: string;
  elements: EditorElement[];
  metadata: Record<string, unknown>;
  version: string;

  /* ui state */
  activePanel: EditorPanel;
  selectedIds: string[];
  editingId: string | null;
  zoom: number;
  viewport: { x: number; y: number };
  loading: boolean;
  saveStatus: SaveStatus;
  dirty: boolean;
  clipboard: EditorElement[];
  /** Hides the content panel and contextual toolbar. */
  isCanvasFocusMode: boolean;
  /** Element awaiting a new image source, set by the Replace flow. */
  pendingReplaceId: string | null;
  /** Which property the Color panel edits for the current selection. */
  colorPanelTarget: "fill" | "stroke";
  /** Eyedropper state: active target property, or null when not active. */
  eyedropperTarget: "fill" | "stroke" | null;

  /* history */
  past: HistoryEntry[];
  future: HistoryEntry[];

  /* selectors-as-getters */
  getScene: () => EditorScene;
  getSelectedElements: () => EditorElement[];

  /* document actions */
  loadScene: (scene: EditorScene, projectId?: string) => void;
  setCanvasSize: (width: number, height: number) => void;
  setBackground: (background: string) => void;

  /* element actions */
  addElements: (elements: EditorElement[], options?: { select?: boolean; toBack?: boolean }) => void;
  updateElement: (id: string, patch: ElementPatch, options?: { commit?: boolean }) => void;
  updateSelected: (patch: ElementPatch, options?: { commit?: boolean }) => void;
  removeSelected: () => void;
  removeElement: (id: string) => void;
  duplicateSelected: () => void;
  copySelected: () => void;
  paste: () => void;
  moveSelected: (dx: number, dy: number, commit?: boolean) => void;
  reorder: (sourceId: string, targetId: string) => void;
  bringForward: () => void;
  sendBackward: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
  toggleLock: (id: string) => void;
  toggleVisibility: (id: string) => void;
  renameElement: (id: string, name: string) => void;
  alignSelected: (
    type: "left" | "center-horizontal" | "right" | "top" | "center-vertical" | "bottom"
  ) => void;
  groupSelected: () => void;
  ungroupSelected: () => void;

  /* images */
  /**
   * Swaps the image source of an element in place. Element identity, layer
   * order, geometry, rotation, opacity, visibility, lock state, radius, frame
   * and filters are all preserved; only the source and the cover crop change.
   */
  replaceImage: (id: string, image: ReplacementImage) => void;
  /** Sizes an image element to cover the artboard, cropping the overflow. */
  coverCanvasWithImage: (id: string) => void;
  setPendingReplaceId: (id: string | null) => void;

  /* selection */
  setSelectedIds: (ids: string[]) => void;
  toggleSelected: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  setEditingId: (id: string | null) => void;

  /* view */
  setActivePanel: (panel: EditorPanel) => void;
  /** Opens the Color panel in the left content panel for the given property. */
  openColorPanel: (target: "fill" | "stroke") => void;
  /** Activates the eyedropper for the given property. */
  openEyedropper: (target: "fill" | "stroke") => void;
  /** Deactivates the eyedropper. */
  closeEyedropper: () => void;
  setZoom: (zoom: number) => void;
  setViewport: (viewport: { x: number; y: number }) => void;

  /* focus mode */
  enterCanvasFocusMode: () => void;
  exitCanvasFocusMode: () => void;
  toggleCanvasFocusMode: () => void;

  /* history + persistence */
  commit: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  setLoading: (loading: boolean) => void;
  setSaveStatus: (status: SaveStatus) => void;
  markSaved: () => void;
};

function snapshot(state: Pick<EditorState, "elements" | "background" | "width" | "height">): HistoryEntry {
  return {
    elements: state.elements.map(cloneElement),
    background: state.background,
    width: state.width,
    height: state.height
  };
}

function cloneElement(element: EditorElement): EditorElement {
  return {
    ...element,
    properties: { ...element.properties },
    children: element.children?.map(cloneElement)
  };
}

function withZIndex(elements: EditorElement[]) {
  return elements
    .slice()
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((element, index) => (element.zIndex === index ? element : { ...element, zIndex: index }));
}

function pushHistory(past: HistoryEntry[], entry: HistoryEntry) {
  const next = [...past, entry];
  return next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next;
}

function elementBox(element: EditorElement) {
  const sx = keepsScale(element) ? element.scaleX ?? 1 : 1;
  const sy = keepsScale(element) ? element.scaleY ?? 1 : 1;
  return { width: (element.width ?? 0) * sx, height: (element.height ?? 0) * sy };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  projectId: null,
  width: DEFAULT_CANVAS_WIDTH,
  height: DEFAULT_CANVAS_HEIGHT,
  background: DEFAULT_BACKGROUND,
  elements: [],
  metadata: {},
  version: "2.0.0",

  activePanel: "elements",
  selectedIds: [],
  editingId: null,
  zoom: 0.45,
  viewport: { x: 0, y: 0 },
  loading: true,
  saveStatus: "idle",
  dirty: false,
  clipboard: [],
  isCanvasFocusMode: false,
  pendingReplaceId: null,
  colorPanelTarget: "fill",
  eyedropperTarget: null,

  past: [],
  future: [],

  getScene: () => {
    const { version, width, height, background, elements, metadata } = get();
    return serializeEditorState({ version, width, height, background, elements, metadata });
  },

  getSelectedElements: () => {
    const { elements, selectedIds } = get();
    return elements.filter((element) => selectedIds.includes(element.id));
  },

  loadScene: (scene, projectId) =>
    set({
      projectId: projectId ?? get().projectId,
      version: scene.version,
      width: scene.width,
      height: scene.height,
      background: scene.background,
      elements: withZIndex(scene.elements.map(cloneElement)),
      metadata: scene.metadata,
      selectedIds: [],
      editingId: null,
      past: [],
      future: [],
      dirty: false,
      loading: false,
      pendingReplaceId: null,
      isCanvasFocusMode: false
    }),

  setCanvasSize: (width, height) =>
    set((state) => ({
      past: pushHistory(state.past, snapshot(state)),
      future: [],
      width: Math.max(64, Math.round(width)),
      height: Math.max(64, Math.round(height)),
      dirty: true
    })),

  setBackground: (background) =>
    set((state) => ({
      past: pushHistory(state.past, snapshot(state)),
      future: [],
      background,
      dirty: true
    })),

  addElements: (incoming, options) =>
    set((state) => {
      if (incoming.length === 0) return state;
      const base = options?.toBack ? -incoming.length : state.elements.length;
      const prepared = incoming.map((element, index) => ({
        ...cloneElement(element),
        zIndex: base + index
      }));
      const elements = withZIndex([...state.elements, ...prepared]);
      return {
        past: pushHistory(state.past, snapshot(state)),
        future: [],
        elements,
        selectedIds: options?.select === false ? state.selectedIds : prepared.map((element) => element.id),
        editingId: null,
        // Adding something needs the panels back, otherwise the new element
        // cannot be edited.
        isCanvasFocusMode: false,
        dirty: true
      };
    }),

  updateElement: (id, patch, options) =>
    set((state) => {
      const index = state.elements.findIndex((element) => element.id === id);
      if (index < 0) return state;
      const current = state.elements[index];
      const next: EditorElement = {
        ...current,
        ...patch,
        properties: patch.properties ? { ...current.properties, ...patch.properties } : current.properties
      };
      if (next.width !== undefined) next.width = clampSize(next.width);
      if (next.height !== undefined && current.type !== "line") next.height = clampSize(next.height);
      const elements = state.elements.slice();
      elements[index] = next;
      return {
        elements,
        dirty: true,
        ...(options?.commit === false
          ? {}
          : { past: pushHistory(state.past, snapshot(state)), future: [] })
      };
    }),

  updateSelected: (patch, options) =>
    set((state) => {
      if (state.selectedIds.length === 0) return state;
      const elements = state.elements.map((element) => {
        if (!state.selectedIds.includes(element.id)) return element;
        const next: EditorElement = {
          ...element,
          ...patch,
          properties: patch.properties ? { ...element.properties, ...patch.properties } : element.properties
        };
        if (next.width !== undefined) next.width = clampSize(next.width);
        if (next.height !== undefined && element.type !== "line") next.height = clampSize(next.height);
        return next;
      });
      return {
        elements,
        dirty: true,
        ...(options?.commit === false
          ? {}
          : { past: pushHistory(state.past, snapshot(state)), future: [] })
      };
    }),

  removeSelected: () =>
    set((state) => {
      if (state.selectedIds.length === 0) return state;
      const elements = withZIndex(
        state.elements.filter((element) => !state.selectedIds.includes(element.id) || element.locked)
      );
      if (elements.length === state.elements.length) return state;
      return {
        past: pushHistory(state.past, snapshot(state)),
        future: [],
        elements,
        selectedIds: [],
        editingId: null,
        dirty: true
      };
    }),

  removeElement: (id) =>
    set((state) => {
      const elements = withZIndex(state.elements.filter((element) => element.id !== id));
      if (elements.length === state.elements.length) return state;
      return {
        past: pushHistory(state.past, snapshot(state)),
        future: [],
        elements,
        selectedIds: state.selectedIds.filter((selected) => selected !== id),
        editingId: state.editingId === id ? null : state.editingId,
        dirty: true
      };
    }),

  duplicateSelected: () =>
    set((state) => {
      const selected = state.elements.filter((element) => state.selectedIds.includes(element.id));
      if (selected.length === 0) return state;
      const copies = selected.map((element, index) => ({
        ...cloneElement(element),
        id: createElementId(),
        name: element.name + " Copy",
        x: element.x + 24,
        y: element.y + 24,
        zIndex: state.elements.length + index
      }));
      return {
        past: pushHistory(state.past, snapshot(state)),
        future: [],
        elements: withZIndex([...state.elements, ...copies]),
        selectedIds: copies.map((element) => element.id),
        dirty: true
      };
    }),

  copySelected: () =>
    set((state) => ({
      clipboard: state.elements
        .filter((element) => state.selectedIds.includes(element.id))
        .map(cloneElement)
    })),

  paste: () =>
    set((state) => {
      if (state.clipboard.length === 0) return state;
      const copies = state.clipboard.map((element, index) => ({
        ...cloneElement(element),
        id: createElementId(),
        x: element.x + 32,
        y: element.y + 32,
        zIndex: state.elements.length + index
      }));
      return {
        past: pushHistory(state.past, snapshot(state)),
        future: [],
        elements: withZIndex([...state.elements, ...copies]),
        selectedIds: copies.map((element) => element.id),
        dirty: true
      };
    }),

  moveSelected: (dx, dy, commit = true) =>
    set((state) => {
      if (state.selectedIds.length === 0) return state;
      const elements = state.elements.map((element) =>
        state.selectedIds.includes(element.id) && !element.locked
          ? { ...element, x: element.x + dx, y: element.y + dy }
          : element
      );
      return {
        elements,
        dirty: true,
        ...(commit ? { past: pushHistory(state.past, snapshot(state)), future: [] } : {})
      };
    }),

  reorder: (sourceId, targetId) =>
    set((state) => {
      if (sourceId === targetId) return state;
      const ordered = withZIndex(state.elements);
      const from = ordered.findIndex((element) => element.id === sourceId);
      const to = ordered.findIndex((element) => element.id === targetId);
      if (from < 0 || to < 0) return state;
      const next = ordered.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return {
        past: pushHistory(state.past, snapshot(state)),
        future: [],
        elements: next.map((element, index) => ({ ...element, zIndex: index })),
        dirty: true
      };
    }),

  bringForward: () =>
    set((state) => {
      const ordered = withZIndex(state.elements).slice();
      for (let index = ordered.length - 2; index >= 0; index -= 1) {
        if (state.selectedIds.includes(ordered[index].id) && !state.selectedIds.includes(ordered[index + 1].id)) {
          const temp = ordered[index];
          ordered[index] = ordered[index + 1];
          ordered[index + 1] = temp;
        }
      }
      return {
        past: pushHistory(state.past, snapshot(state)),
        future: [],
        elements: ordered.map((element, index) => ({ ...element, zIndex: index })),
        dirty: true
      };
    }),

  sendBackward: () =>
    set((state) => {
      const ordered = withZIndex(state.elements).slice();
      for (let index = 1; index < ordered.length; index += 1) {
        if (state.selectedIds.includes(ordered[index].id) && !state.selectedIds.includes(ordered[index - 1].id)) {
          const temp = ordered[index];
          ordered[index] = ordered[index - 1];
          ordered[index - 1] = temp;
        }
      }
      return {
        past: pushHistory(state.past, snapshot(state)),
        future: [],
        elements: ordered.map((element, index) => ({ ...element, zIndex: index })),
        dirty: true
      };
    }),

  bringToFront: () =>
    set((state) => {
      const ordered = withZIndex(state.elements);
      const stay = ordered.filter((element) => !state.selectedIds.includes(element.id));
      const move = ordered.filter((element) => state.selectedIds.includes(element.id));
      if (move.length === 0) return state;
      return {
        past: pushHistory(state.past, snapshot(state)),
        future: [],
        elements: [...stay, ...move].map((element, index) => ({ ...element, zIndex: index })),
        dirty: true
      };
    }),

  sendToBack: () =>
    set((state) => {
      const ordered = withZIndex(state.elements);
      const stay = ordered.filter((element) => !state.selectedIds.includes(element.id));
      const move = ordered.filter((element) => state.selectedIds.includes(element.id));
      if (move.length === 0) return state;
      return {
        past: pushHistory(state.past, snapshot(state)),
        future: [],
        elements: [...move, ...stay].map((element, index) => ({ ...element, zIndex: index })),
        dirty: true
      };
    }),

  toggleLock: (id) =>
    set((state) => ({
      past: pushHistory(state.past, snapshot(state)),
      future: [],
      elements: state.elements.map((element) =>
        element.id === id ? { ...element, locked: !element.locked } : element
      ),
      dirty: true
    })),

  toggleVisibility: (id) =>
    set((state) => ({
      past: pushHistory(state.past, snapshot(state)),
      future: [],
      elements: state.elements.map((element) =>
        element.id === id ? { ...element, visible: element.visible === false } : element
      ),
      dirty: true
    })),

  renameElement: (id, name) =>
    set((state) => ({
      past: pushHistory(state.past, snapshot(state)),
      future: [],
      elements: state.elements.map((element) => (element.id === id ? { ...element, name } : element)),
      dirty: true
    })),

  alignSelected: (type) =>
    set((state) => {
      if (state.selectedIds.length === 0) return state;
      const elements = state.elements.map((element) => {
        if (!state.selectedIds.includes(element.id) || element.locked) return element;
        const { width, height } = elementBox(element);
        switch (type) {
          case "left":
            return { ...element, x: 0 };
          case "center-horizontal":
            return { ...element, x: (state.width - width) / 2 };
          case "right":
            return { ...element, x: state.width - width };
          case "top":
            return { ...element, y: 0 };
          case "center-vertical":
            return { ...element, y: (state.height - height) / 2 };
          case "bottom":
            return { ...element, y: state.height - height };
          default:
            return element;
        }
      });
      return { past: pushHistory(state.past, snapshot(state)), future: [], elements, dirty: true };
    }),

  groupSelected: () =>
    set((state) => {
      const members = withZIndex(state.elements).filter((element) => state.selectedIds.includes(element.id));
      if (members.length < 2) return state;
      const minX = Math.min(...members.map((element) => element.x));
      const minY = Math.min(...members.map((element) => element.y));
      const maxX = Math.max(...members.map((element) => element.x + elementBox(element).width));
      const maxY = Math.max(...members.map((element) => element.y + elementBox(element).height));
      const group: EditorElement = {
        id: createElementId(),
        type: "group",
        name: "Group",
        x: minX,
        y: minY,
        width: Math.max(1, maxX - minX),
        height: Math.max(1, maxY - minY),
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        visible: true,
        locked: false,
        zIndex: state.elements.length,
        properties: {},
        children: members.map((element) => ({
          ...cloneElement(element),
          x: element.x - minX,
          y: element.y - minY
        }))
      };
      const rest = state.elements.filter((element) => !state.selectedIds.includes(element.id));
      return {
        past: pushHistory(state.past, snapshot(state)),
        future: [],
        elements: withZIndex([...rest, group]),
        selectedIds: [group.id],
        dirty: true
      };
    }),

  ungroupSelected: () =>
    set((state) => {
      const groups = state.elements.filter(
        (element) => state.selectedIds.includes(element.id) && element.type === "group"
      );
      if (groups.length === 0) return state;
      const released: EditorElement[] = [];
      const elements = state.elements.flatMap((element) => {
        if (!groups.includes(element)) return [element];
        const children = (element.children ?? []).map((child) => ({
          ...cloneElement(child),
          id: createElementId(),
          x: child.x + element.x,
          y: child.y + element.y
        }));
        released.push(...children);
        return children;
      });
      return {
        past: pushHistory(state.past, snapshot(state)),
        future: [],
        elements: withZIndex(elements),
        selectedIds: released.map((element) => element.id),
        dirty: true
      };
    }),

  replaceImage: (id, image) =>
    set((state) => {
      const index = state.elements.findIndex((element) => element.id === id);
      if (index < 0) return state;
      const current = state.elements[index];
      if (current.type !== "image") return state;
      if (!image.src) return state;

      // The element box is deliberately left untouched: a template frame keeps
      // its exact placement and only the source and its cover crop change.
      const box = {
        width: current.width ?? state.width,
        height: current.height ?? state.height
      };
      const naturalWidth = Number(image.naturalWidth) || box.width;
      const naturalHeight = Number(image.naturalHeight) || box.height;
      const crop = coverCrop({ width: naturalWidth, height: naturalHeight }, box);

      const next: EditorElement = {
        ...current,
        properties: {
          ...current.properties,
          src: image.src,
          naturalWidth,
          naturalHeight,
          crop
        }
      };

      const elements = state.elements.slice();
      elements[index] = next;
      return {
        past: pushHistory(state.past, snapshot(state)),
        future: [],
        elements,
        // The replaced element stays selected so the inspector keeps its target.
        selectedIds: state.selectedIds.includes(id) ? state.selectedIds : [id],
        pendingReplaceId: null,
        dirty: true
      };
    }),

  coverCanvasWithImage: (id) =>
    set((state) => {
      const index = state.elements.findIndex((element) => element.id === id);
      if (index < 0) return state;
      const current = state.elements[index];
      if (current.type !== "image") return state;

      const canvas = { width: state.width, height: state.height };
      const fit = coverCanvas(
        {
          width: Number(current.properties.naturalWidth) || undefined,
          height: Number(current.properties.naturalHeight) || undefined
        },
        canvas
      );

      const elements = state.elements.slice();
      elements[index] = {
        ...current,
        x: fit.x,
        y: fit.y,
        width: fit.width,
        height: fit.height,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        properties: { ...current.properties, crop: fit.crop }
      };
      return {
        past: pushHistory(state.past, snapshot(state)),
        future: [],
        elements,
        dirty: true
      };
    }),

  setPendingReplaceId: (pendingReplaceId) => set({ pendingReplaceId }),

  // Selecting an element always restores the editor UI: the panels are the only
  // way to edit it, so focus mode can never trap a selection.
  setSelectedIds: (selectedIds) =>
    set((state) => ({
      selectedIds,
      editingId: null,
      isCanvasFocusMode: selectedIds.length > 0 ? false : state.isCanvasFocusMode
    })),

  toggleSelected: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((selected) => selected !== id)
        : [...state.selectedIds, id],
      isCanvasFocusMode: false
    })),

  clearSelection: () => set({ selectedIds: [], editingId: null }),

  selectAll: () =>
    set((state) => ({
      selectedIds: state.elements.filter((element) => !element.locked).map((element) => element.id),
      isCanvasFocusMode: false
    })),

  setEditingId: (editingId) =>
    set((state) => ({ editingId, isCanvasFocusMode: editingId ? false : state.isCanvasFocusMode })),

  setActivePanel: (activePanel) => set({ activePanel, isCanvasFocusMode: false }),

  // The Color panel edits the selected element, so opening it must keep the
  // selection alive and — like any panel switch — restore the chrome.
  openColorPanel: (target) =>
    set({ colorPanelTarget: target, activePanel: "color", isCanvasFocusMode: false }),

  // Activates the eyedropper for the given property. The eyedropper samples
  // a color from the canvas and applies it to the selected element.
  openEyedropper: (target) => set({ eyedropperTarget: target, isCanvasFocusMode: false }),

  // Deactivates the eyedropper.
  closeEyedropper: () => set({ eyedropperTarget: null }),

  setZoom: (zoom) => set({ zoom: Math.min(4, Math.max(0.05, Number(zoom.toFixed(3)))) }),

  setViewport: (viewport) => set({ viewport }),

  enterCanvasFocusMode: () => set({ isCanvasFocusMode: true, selectedIds: [], editingId: null }),

  exitCanvasFocusMode: () => set({ isCanvasFocusMode: false }),

  toggleCanvasFocusMode: () =>
    set((state) =>
      state.isCanvasFocusMode
        ? { isCanvasFocusMode: false }
        : { isCanvasFocusMode: true, selectedIds: [], editingId: null }
    ),

  commit: () =>
    set((state) => ({ past: pushHistory(state.past, snapshot(state)), future: [], dirty: true })),

  undo: () =>
    set((state) => {
      const previous = state.past[state.past.length - 1];
      if (!previous) return state;
      return {
        past: state.past.slice(0, -1),
        future: [snapshot(state), ...state.future].slice(0, HISTORY_LIMIT),
        elements: previous.elements.map(cloneElement),
        background: previous.background,
        width: previous.width,
        height: previous.height,
        selectedIds: state.selectedIds.filter((id) => previous.elements.some((element) => element.id === id)),
        editingId: null,
        dirty: true
      };
    }),

  redo: () =>
    set((state) => {
      const next = state.future[0];
      if (!next) return state;
      return {
        past: pushHistory(state.past, snapshot(state)),
        future: state.future.slice(1),
        elements: next.elements.map(cloneElement),
        background: next.background,
        width: next.width,
        height: next.height,
        selectedIds: state.selectedIds.filter((id) => next.elements.some((element) => element.id === id)),
        editingId: null,
        dirty: true
      };
    }),

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  setLoading: (loading) => set({ loading }),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  markSaved: () => set({ saveStatus: "saved", dirty: false })
}));
