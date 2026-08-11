# Developer Guide - Canvas Editor Architecture

## Architecture Overview

The editor renders with **Konva.js** through **react-konva**. Everything the user
sees on the artboard is produced declaratively from a serializable element model
held in a Zustand store. The editor never holds Konva nodes in state, so a scene
can be persisted to the database and restored later.

```
Zustand store (scene.elements)
  → CanvasWorkspace
    → <Stage> → <Layer>
      → <ElementNode> per element  (Text / Image / Shape / Group)
      → <Transformer>              (selection handles)
```

### Rendering layers

- **`Stage`** (`CanvasWorkspace.tsx`): one stage per editor. `scaleX`/`scaleY`
  carry the editor zoom, so element coordinates always stay in artboard space.
- **`Layer`**: a single main layer holds the artboard `Rect`, every element and
  the `Transformer`. Crop mode adds a second temporary layer.
- **Element renderer components** (`components/editor/elements/`): `TextElement`,
  `ImageElement`, `ShapeElement` and `GroupElement`. `ElementNode` is the only
  dispatch point from the model to a renderer; the renderers are `memo`ised.
- **`Transformer`**: resize and rotation handles. Nodes are attached by id with
  `stage.findOne("#" + id)` whenever the selection changes. Text elements expose
  only `middle-left`/`middle-right` anchors because text wraps to a fixed width.

### Scene model

The scene is `scene.elements`, a recursive array. There is no `scene.objects`.

```typescript
type EditorElement = {
  id: string;
  type: "text" | "image" | "rect" | "circle" | "line" | "path" | "group";
  name: string;
  x: number;              // top-left of the un-rotated bounding box
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  scaleX?: number;        // kept at 1 except for `path`
  scaleY?: number;
  opacity?: number;
  visible?: boolean;
  locked?: boolean;
  zIndex: number;
  properties: EditorElementProperties;   // everything type-specific
  children?: EditorElement[];            // recursive groups
};
```

Conventions worth knowing before touching geometry code
(`lib/editor/coordinates.ts`):

- `x`/`y` are always the top-left corner in artboard coordinates.
- Transform scale is baked back into `width`/`height` after a transform, so
  `scaleX`/`scaleY` stay at `1`. `path` is the exception: it cannot be resized in
  Konva without scaling, so `keepsScale(element)` returns `true` for it.
- **Recursive groups**: `GroupElement` renders `element.children` relative to the
  group origin. `ElementNode` renders each child with `locked: true`, so pointer
  events bubble to the group and only the group is draggable.

### State management

- **Zustand editor store** (`store/editorStore.ts`): the document (`width`,
  `height`, `background`, `elements`), UI state (`activePanel`, `selectedIds`,
  `editingId`, `zoom`, `viewport`), the undo/redo stacks and every mutation.
- **Derived selectors** (`store/editorSelectors.ts`): `useSelectedElement`,
  `useSelectedElements`, `useSelectedProperties`, `useOrderedLayers`. Selected
  element type is always derived from the element, never tracked separately.
- **React state**: local UI only (open popovers, slider positions, crop box).
- **Stage registry** (`lib/editor/stage-registry.ts`): a Konva `Stage` is not
  serializable, so it is not stored in Zustand. `CanvasWorkspace` calls
  `registerStage(stage)` on mount and `registerStage(null)` on unmount; the
  header and export modal read it back with `getStage()`. React Strict Mode
  mounts effects twice in development, which is why the cleanup is required.

### Actions bus

Panels and toolbars do not import canvas internals. They emit window custom
events through `lib/editor/actions.ts`:

```typescript
import { emitStudioAction } from "@/lib/editor/actions";

emitStudioAction("duplicate");
emitStudioAction({ action: "update-active", payload: { properties: { fill: "#fff" } } });
```

- `emitStudioAction(detail)` → `studio-action`, handled by `runAction` in
  `CanvasWorkspace`.
- `emitLayerAction(detail)` → `studio-layer-action`, handled by the layer
  listener in the same component (select, visibility, lock, delete, rename,
  reorder).
- `setActionDragPayload(event, detail)` puts the same payload on a drag event, so
  dragging an asset tile onto the canvas reuses the action handler.

Panel payloads speak the element model: geometry at the top level, everything
type-specific under `properties`. `toElementPatch` (`lib/editor/patch.ts`)
coerces numbers, clamps sizes and drops unknown top-level keys.

**UI state is not an action.** Opening a sidebar panel goes through the store,
not the bus:

```typescript
const setActivePanel = useEditorStore((state) => state.setActivePanel);
setActivePanel("filters");
```

Panel identifiers are typed as `EditorPanel` and listed once in
`EDITOR_PANELS` (`lib/editor/types.ts`), so a toolbar shortcut cannot open a
panel the asset panel router does not render.

### Serialization

`lib/editor/serialization.ts` (re-exported through `lib/editor/scene.ts`):

- `serializeEditorState(scene)` produces the JSON that gets persisted: rounded
  document size and contiguous `zIndex` values.
- `deserializeEditorState(input, width, height)` accepts the current scene
  format **or** a legacy Fabric.js document and always returns a valid scene.
  Unknown element types are dropped, missing fields get defaults, unknown
  payloads fall back to `emptyEditorScene()`.
- `validateEditorProject(input)` is a cheap shape guard used on API boundaries.

### Legacy Fabric-to-Konva migration

Fabric.js is not part of the runtime. It survives only as an **accepted legacy
input format** so projects saved before the migration still open.

- `isLegacyFabricScene(input)` detects the old shape: an `objects` array and no
  `elements` array.
- `migrateFabricProjectToKonva(input)` converts it and tags the result with
  `metadata.migratedFrom = "fabric"`.
- `deserializeEditorState` calls the migration automatically, so callers never
  branch on the format themselves.

The conversion handles the differences that actually break scenes:

| Fabric | Editor model |
|---|---|
| `left`/`top` with `originX`/`originY` | top-left `x`/`y` (`normalizeOrigin`) |
| `charSpacing` in 1/1000 em | `letterSpacing` in px |
| parsed path command arrays | SVG path string |
| `points: [{x, y}]` | flat `[x, y, ...]` array |
| filter instance list | `properties.filters` config object |
| gradient `fill` object | `properties.gradient` + first stop as `fill` |
| group children relative to centre | children relative to top-left |

Do not delete the legacy mapping, the `LegacyFabricScene` type or the migration
test fixtures. They contain Fabric-shaped data on purpose.

### Client-only rendering

react-konva resolves konva's node entry point when server rendered, which pulls
in the optional native `canvas` binding, and a stage needs a real DOM container.
Two things keep this working:

1. The canvas is loaded client-side only, in `EditorShell.tsx`:

```typescript
const CanvasWorkspace = dynamic(
  () => import("@/components/editor/CanvasWorkspace").then((m) => m.CanvasWorkspace),
  { ssr: false, loading: () => <div>Loading canvas...</div> }
);
```

2. The native binding is stubbed in `next.config.ts` so webpack never tries to
   parse `canvas.node` during the server build:

```typescript
config.resolve.alias = { ...config.resolve.alias, canvas: false };
```

Do not remove the alias and do not install the native `canvas` package. Keep new
Konva code inside components that are only reachable through the dynamic import,
and never touch `window`, `document` or `Konva` at module scope.

---

## Feature Implementation Details

### 1. Image Filters

**Flow:**
```
FilterPanel (UI)
  → emitStudioAction("apply-filter" | "apply-filter-preset" | "reset-filters")
  → runAction() in CanvasWorkspace
  → store.updateElement(id, { properties: { filters } })
  → ImageElement re-renders
```

Filters live in the model as `properties.filters`
(`{ brightness, contrast, saturation, hue, blur }`) and are translated to Konva
in `lib/editor/konva-props.ts`:

```typescript
filterValues(filters) // -> { brightness, contrast, saturation, hue, blurRadius }
hasActiveFilters(filters)
```

`ImageElement` attaches `[Brighten, Contrast, HSL, Blur]` and must `cache()` the
node before Konva can run pixel filters. The cache is refreshed whenever the
image, size or any filter value changes, cleared when no filter is active, and
cleared again on unmount.

The **Filters** toolbar button opens the panel through
`setActivePanel("filters")`, is disabled when the selection is not an unlocked
image, and toggles back to `"elements"` when pressed while already open.

### 2. Gradient Fills

**Flow:**
```
GradientPicker (UI)
  → emitStudioAction("apply-gradient" | "remove-gradient")
  → store.updateSelected({ properties: { gradient } })
  → ShapeElement spreads gradientProps(...)
```

`gradientProps(gradient, width, height)` maps the config to Konva props:
`fillLinearGradientStartPoint` / `EndPoint` / `ColorStops` for linear, and the
`fillRadialGradient*` equivalents for radial. Stops are sorted and flattened to
`[offset, color, ...]`. Fewer than two stops produces no gradient props.

### 3. Alignment & Snapping

**Flow:**
```
onDragMove (Konva)
  → snapToAlignment(elements, active, canvas, position) → node.position(snapped)
  → findAlignmentLines(...) → <AlignmentGuides>
```

`lib/editor/alignment.ts` is pure: it takes the element array and returns lines
or a snapped position, with `SNAP_THRESHOLD = 8`. Guides cover canvas centre
plus edge and centre alignment against every other visible element. They are
rendered as DOM overlay lines above the stage, not as Konva nodes, so they never
appear in an export.

Manual alignment buttons emit `align-*` actions, handled by
`store.alignSelected(...)`, which aligns against the artboard.

### 4. Text Effects

**Flow:**
```
TextEffectsPanel (UI)
  → emitStudioAction("apply-text-shadow" | "apply-text-stroke" | "apply-text-glow")
  → store.updateSelected({ properties: { shadow | stroke | strokeWidth } })
```

Shadow becomes `properties.shadow` and is spread onto the node by
`shadowProps(...)`. Glow is the same shadow with zero offsets. Stroke sets
`stroke` + `strokeWidth`; `TextElement` sets `fillAfterStrokeEnabled` so the
stroke paints behind the fill.

### 5. Text Editing

Konva has no editable text node. Double-clicking a text element sets
`editingId`, which renders `TextEditorOverlay`: an HTML `textarea` positioned
over the Konva node, matched on font family, size, weight, style, colour,
alignment, line height, letter spacing and rotation. The Konva text is hidden
(`opacity: 0`) while editing so the two never render on top of each other.

Keystrokes update the element with `{ commit: false }`, so a typing session is a
single history entry. Blur or `Escape` calls `commit()` and clears `editingId`.

### 6. Crop Tool

**Flow:**
```
emitStudioAction("start-crop")
  → crop state + crop Rect on its own Layer with its own Transformer
  → user adjusts the box (aspect ratio optional)
  → "apply-crop"
  → store.updateElement(id, { x, y, width, height, properties: { crop } })
```

The crop box is expressed in artboard coordinates and converted into source
image pixels before it is stored, using the previous crop and the natural image
size. `properties.crop` is passed straight to the Konva `Image` `crop` prop, so
cropping stays non-destructive and repeatable. `Enter` applies, `Escape`
cancels. The main transformer is detached while crop mode is active.

### 7. Export

`lib/editor/export.ts` renders from the registered stage:

```typescript
const stage = getStage();
exportStage(stage, { width, height }, { format, pixelRatio });
```

`stageToDataUrl` temporarily resets the stage to scale 1 and the document size,
so an export never depends on the current zoom, then restores the previous
transform in a `finally` block. Selection is cleared first so transformer
handles are not baked into the output.

- **PNG / JPEG**: `stage.toDataURL()` at the requested `pixelRatio`.
- **PDF**: a minimal single-page PDF wrapper around a JPEG, no dependency.
- **SVG**: an `<svg>` wrapper around the rasterised artboard. Konva has no vector
  serialiser, so this is **not** true vector output.

**Image CORS limitation:** `toDataURL()` throws on a tainted canvas. Images are
loaded with `crossOrigin = "anonymous"` (except `data:` and `blob:` sources), so
a remote host that does not send permissive CORS headers will block export
entirely. The export modal surfaces this as a toast.

---

## Adding New Features

### Template for a new panel feature

1. **Create the UI component** (e.g. `NewFeaturePanel.tsx`)
```typescript
"use client";

export function NewFeaturePanel() {
  const [value, setValue] = useState(0);

  function apply(next: number) {
    setValue(next);
    emitStudioAction({ action: "apply-new-feature", payload: { value: next } });
  }

  return <div>{/* UI here */}</div>;
}
```

2. **Add the panel id** to `EDITOR_PANELS` in `lib/editor/types.ts`
```typescript
export const EDITOR_PANELS = [/* ... */, "new-feature"] as const;
```

3. **Add to PrimarySidebar**
```typescript
const items: readonly SidebarItem[] = [
  // ...
  ["new-feature", "New Feature", IconName]
];
```

4. **Add to AssetPanel**
```typescript
{active === "new-feature" && <NewFeaturePanel />}
```

5. **Add the action type** in `lib/editor/actions.ts`
```typescript
export type StudioActionDetail =
  // ...
  | { action: "apply-new-feature"; payload: { value: number } };
```

6. **Handle it** in `runAction` in `CanvasWorkspace.tsx`
```typescript
case "apply-new-feature": {
  const next = payload as { value: number };
  state.updateSelected({ properties: { newFeature: next.value } });
  return;
}
```

If the feature adds a persisted property, also extend the property types in
`lib/editor/types.ts` and, when it must survive a reload, `sanitizeElement`.

---

## Common Patterns

### Reading the selection

```typescript
// In a component
const selected = useSelectedElement();          // EditorElement | null
const selectedIds = useEditorStore((s) => s.selectedIds);

// Outside React / inside a handler
const state = useEditorStore.getState();
const elements = state.getSelectedElements();
```

### Narrowing by type

```typescript
if (selected?.type === "text") {
  const properties = selected.properties as Partial<TextProperties>;
}
if (selected?.type === "image") {
  const properties = selected.properties as Partial<ImageProperties>;
}
```

Guard on `element.type`; there are also `isTextElement`, `isImageElement` and
`isShapeElement` helpers in `lib/editor/types.ts`.

### Updating an element

```typescript
// Committed: one history entry
store.updateElement(id, { x: 10, properties: { fill: "#fff" } });

// Uncommitted: for continuous input (dragging, typing, sliders)
store.updateElement(id, { properties: { text } }, { commit: false });
// ... then once, at the end:
store.commit();
```

Never mutate an element in place and never write to a Konva node as the source
of truth. Nodes are re-rendered from the model; local node changes made during a
drag or transform are read back and written to the store in `onDragEnd` /
`onTransformEnd`.

### Selector shape

Select primitives or stable references. Returning a fresh object or array from a
selector re-renders on every unrelated store update:

```typescript
// Fine
const zoom = useEditorStore((s) => s.zoom);
// Fine: memoised in a hook
const selected = useSelectedElements();
// Avoid
const box = useEditorStore((s) => ({ w: s.width, h: s.height }));
```

### Persisting

Autosave lives in `EditorShell`: it debounces on `dirty`, serialises with
`getScene()`, writes a `localStorage` recovery copy and `PUT`s
`/api/projects/:id/scene`.

---

## Debugging Tips

### Inspect the scene

```typescript
console.log(useEditorStore.getState().elements);
console.log(useEditorStore.getState().getScene());
```

### Inspect the stage

```typescript
import { getStage } from "@/lib/editor/stage-registry";
console.log(getStage()?.find(".editor-element"));
```

Read the stage from the registry. Do not query the DOM for a canvas element: the
stage owns its canvases and the number of them changes with crop mode.

### Check a single node

```typescript
const node = getStage()?.findOne("#" + elementId);
console.log(node?.getAttrs());
```

### Monitor actions

```typescript
window.addEventListener("studio-action", (e) => console.log("action", e.detail));
```

---

## Performance Optimization

### Uncommitted updates during continuous input

```typescript
store.updateElement(id, patch, { commit: false }); // no history entry
// commit once when the interaction ends
```

### Memoised renderers

Element renderers are wrapped in `memo` and the handler object in
`CanvasWorkspace` is built with `useMemo`, so a store update only re-renders the
elements that changed.

### Image cache

`useKonvaImage` caches `HTMLImageElement`s per `src` in a module-level `Map`, so
a Konva node is never handed a freshly constructed image on every render.

### Filter caching

`node.cache()` is required for pixel filters and is expensive. Only cache while
filters are active, and clear the cache when they are removed and on unmount.

### Effect cleanup under Strict Mode

`reactStrictMode: true` mounts effects twice in development. Every effect that
registers something globally must clean up: `registerStage(null)`, removed
window listeners, cleared caches, cancelled image loads.

---

## Testing Checklist

- [ ] Filters button is disabled unless an unlocked image is selected
- [ ] Filters button opens the filters panel and toggles closed
- [ ] Font family picker applies the font and creates one history entry
- [ ] Gradients apply to shapes only
- [ ] Alignment guides appear on drag and never appear in an export
- [ ] Text effects apply to text only
- [ ] Crop works on images and is repeatable
- [ ] Undo/redo works for all features
- [ ] Export matches the document size at any zoom
- [ ] Legacy Fabric projects still open
- [ ] Autosave preserves all changes
- [ ] Keyboard shortcuts work
- [ ] Server build succeeds (no `canvas.node` resolution)

---

## Known Limitations

1. **SVG export:** wraps a raster image. Konva has no vector serialiser, so this
   is not true vector output.
2. **Image CORS:** a remote image without permissive CORS headers taints the
   canvas and blocks every export format.
3. **Gradients:** shapes only, not images or text.
4. **Text:** wraps to a fixed width, so only horizontal resize anchors are shown.
5. **Text effects:** shadow performance degrades at high blur values.
6. **Filter caching:** every filtered image holds a cached bitmap, so many large
   filtered images increase memory use.
7. **Pages:** a project is a single artboard; `add-page` is not implemented.
8. **Animation:** the animate popover is a UI placeholder with no runtime effect.

---

## Useful Resources

- [Konva documentation](https://konvajs.org/docs/)
- [react-konva](https://konvajs.org/docs/react/)
- [Konva filters](https://konvajs.org/docs/filters/)
- [Konva gradients](https://konvajs.org/docs/styling/Fill.html)
- [Zustand guide](https://docs.pmnd.rs/zustand/getting-started/introduction)

---

## Support

For questions or issues:
1. Check this guide first
2. Review the Konva and react-konva docs
3. Check the browser console for errors
4. Test in different browsers

Happy coding! 🚀
