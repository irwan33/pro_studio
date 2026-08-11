# Canvas Editor - Feature Documentation

## Overview
The Pro Studio canvas editor is built on **Konva.js** with **react-konva**. The
artboard is rendered declaratively from a serializable element scene held in a
Zustand store, which keeps every feature below undoable, autosavable and
exportable.

Only features that exist in the repository are documented here.

---

## 1. 📦 Elements

### Text Elements
- Family, size, weight (400/700), italic, underline, strikethrough
- Fill colour
- Alignment: left, center, right, justify
- Case transform: none, UPPERCASE, lowercase, Capitalize
- List prefixes: none, bullet, numbered, checklist
- Letter spacing and line height
- Stroke (outline) and shadow
- Wraps to a fixed width; height grows with the content

### Image Elements
- Added from the local image library, the element library or an upload
- Uploads are read as data URLs in the browser
- Horizontal and vertical flip
- Filters and non-destructive crop (see below)
- Placeholder box while loading, red placeholder box on load failure

### Shapes
- Rectangle (with corner radius)
- Ellipse / circle
- Line, polygon and arrow (closed or open point lists)
- SVG path shapes from the shape library, grouped by category
- Frame (a stroked rectangle used as an image frame)
- Fill, stroke, stroke width, dash, shadow, gradient fill

### Composite elements
Multi-element lockups added as a set: score card, match info, fixture strip,
versus lockup, stat card, club badge, sponsor pill, lower third, divider, label
tag, gradient wash, diagonal pattern, corner accent, light effect, player cutout
and five sports stickers.

### Nested Groups
- `Cmd/Ctrl + G` groups the selection, `Cmd/Ctrl + Shift + G` ungroups it
- Groups are recursive: `element.children` can contain further groups
- Children are positioned relative to the group origin
- Pointer events resolve to the group, so a group moves and transforms as a unit
- Ungrouping restores children to absolute positions with fresh ids

---

## 2. 🖱️ Selection & Manipulation

### Selection
- Click to select
- `Shift` / `Cmd` / `Ctrl` + click to add or remove from the selection
- Marquee: drag on empty canvas to select every intersecting unlocked element
- `Cmd/Ctrl + A` selects all unlocked elements
- `Esc` or a click on empty canvas clears the selection
- Locked elements cannot be selected by clicking or by marquee

### Transformer resize and rotation
- Handles are provided by a Konva `Transformer`
- Rotation is enabled for every element type
- Text exposes only the left and right anchors, because text wraps to a width
- A minimum box of 5 px is enforced
- Transform scale is baked back into `width`/`height`, so elements keep a clean
  `scaleX`/`scaleY` of 1 (except SVG paths, which must scale)

### Dragging
- Drag to move; multi-selection drags move every selected element by the same
  delta
- Arrow keys nudge by 1 px, `Shift` + arrow keys by 10 px
- Locked elements do not move

### Contextual toolbars
The toolbar above the artboard follows the selection: a text toolbar, an image
toolbar, a shape toolbar, or a compact common toolbar for multi-selection.

---

## 3. 🗂️ Layers

- Layer list ordered top-most first, with inline rename
- Drag and drop to reorder
- Per-layer visibility toggle, lock toggle, duplicate and delete
- Bring to front, send to back, bring forward, send backward
- Inspector for the selected element: fill, stroke, opacity, X, Y, W, H,
  rotation, stroke width, flip, plus the crop entry point for images
- `zIndex` is renumbered contiguously after every ordering change

---

## 4. 📐 Alignment & Snapping

### Smart snapping
- Snaps to the artboard centre, horizontally and vertically
- Snaps to other visible elements' left, right, top and bottom edges
- Snaps to other elements' horizontal and vertical centres
- 8 px threshold, always active

### Visual guides
- Guides appear while dragging and disappear on drop
- Rendered as an overlay above the stage, so they never appear in an export

### Manual alignment
Align the selection to the artboard: left, centre horizontal, right, top, centre
vertical, bottom. Available from the Position popover in every element toolbar.

---

## 5. 🔍 Zoom & Pan

- Zoom controls in the bottom-right corner: `-`, `+`, reset
- `Cmd/Ctrl` + wheel, or trackpad pinch, zooms around the pointer
- `Cmd/Ctrl + =` / `Cmd/Ctrl + -` zoom in and out
- `Cmd/Ctrl + 0` zooms to fit the workspace
- Range is clamped to 5% – 400%
- Pan with the middle mouse button, or hold `Space` and drag
- Plain wheel scrolling keeps native scroll behaviour

---

## 6. ✍️ Text Editing

- Double-click a text element to edit it in place
- Editing uses an HTML `textarea` positioned over the Konva node, matched on
  font, size, weight, style, colour, alignment, line height, letter spacing and
  rotation. Konva has no editable text node.
- The Konva text is hidden while editing so the two never overlap
- A typing session produces a single undo entry
- `Escape` or clicking away commits and exits

### Font picker
- Searchable dropdown in the text toolbar, previewing each family in itself
- Waits for webfonts to be ready before rendering previews
- Applying a font patches the selected element once, producing one undo entry
- The sidebar text panel holds the full list with per-family variants
  (Regular, Bold, Italic, Bold Italic)

---

## 7. 🎨 Image Filters

### Presets (10)
Original, Vivid, B&W, Sepia, Cool, Warm, Vintage, Fade, High Contrast, Soft.

### Manual controls
- Brightness: -100 to +100
- Contrast: -100 to +100
- Saturation: -100 to +100
- Hue rotation: -180° to +180°
- Blur: 0 to 100

### How to Use
1. Select an image on the canvas
2. Click **Filters** in the image toolbar, or the **Filters** tab in the left
   sidebar
3. Choose a preset or adjust the sliders
4. Click **Reset All Filters** to clear them

The Filters toolbar button is disabled unless an unlocked image is selected, and
pressing it while the panel is open returns to the element library.

### Technical Details
- Filters are stored in the scene as `properties.filters`, so they persist and
  survive undo/redo
- Rendered with Konva's `Brighten`, `Contrast`, `HSL` and `Blur` filters
- The node is cached while filters are active, which Konva requires for pixel
  filters, and the cache is cleared when they are removed

---

## 8. 🌈 Gradient Fills

### Types
- Linear, with an angle control (0-360°)
- Radial

### Presets (10)
Sunset, Ocean, Purple Haze, Green Energy, Fire, Cool Blue, Peach, Emerald,
Bloody Mary, Lemon Twist.

### Custom builder
- Up to 5 colour stops
- Per-stop colour and position (0-100%)
- Remove stops down to a minimum of 2
- Live preview before applying

### How to Use
1. Select a shape
2. Open the **Gradients** tab in the left sidebar
3. Pick a preset, or choose linear/radial, set the angle and edit the stops, then
   click **Apply Gradient**
4. Click **Remove Gradient** to restore a solid fill

### Technical Details
Shapes only, not images or text. Stored as `properties.gradient` and translated
to Konva's `fillLinearGradient*` / `fillRadialGradient*` props at render time.

---

## 9. ✨ Text Effects

### Drop shadow
Colour, opacity (0-100%), blur, offset X and offset Y, with an on/off toggle.

### Stroke / outline
Colour and width, with an on/off toggle. The stroke paints behind the fill.

### Glow
Colour and blur radius, with an on/off toggle. Implemented as a zero-offset
shadow.

### How to Use
1. Select a text element
2. Scroll to the text effects section of the Layers panel (right sidebar)
3. Toggle each effect and adjust its parameters
4. Use **Reset All Effects** to clear them

### Technical Details
Stored as `properties.shadow`, `properties.stroke` and
`properties.strokeWidth`. All three render natively on the Konva text node.

---

## 10. ✂️ Crop Tool

### Features
- Draggable, resizable crop box on its own layer
- Aspect ratio presets: Free, 1:1, 16:9, 4:3, 3:2, 9:16, 4:5
- Lock/unlock aspect ratio
- Apply and Cancel controls

### How to Use
1. Select an image
2. Click **Crop** in the image toolbar, or **Crop Image** in the Layers panel
3. Adjust the box, optionally picking an aspect ratio
4. Press `Enter` or click **Apply Crop**
5. Press `Esc` or click **Cancel** to abort

### Keyboard Shortcuts
- `Enter` - apply crop
- `Esc` - cancel crop

### Technical Details
The crop box is converted from artboard coordinates into source-image pixels and
stored as `properties.crop`, which is passed straight to the Konva `Image` `crop`
prop. Cropping is non-destructive and repeatable: the original source image is
never modified, and re-cropping composes with the previous crop.

---

## 11. ↩️ Undo & Redo

- `Cmd/Ctrl + Z` undo, `Cmd/Ctrl + Shift + Z` or `Cmd/Ctrl + Y` redo
- Also available from the editor header
- History depth of 60 entries
- Snapshots cover elements, background and document size
- Continuous input (dragging, typing, slider scrubbing) commits once at the end,
  so an interaction is a single entry

---

## 12. 🧩 Templates

- Six seed sports templates, authored directly in the element model
- Applied from the Templates tab, by click or by drag onto the canvas
- Social format presets in the Document tab: Instagram Portrait/Square/Story,
  Twitter/X Post, YouTube Thumbnail, Facebook Post
- Document tab also sets custom canvas size and background colour

---

## 13. 💾 Save & Load

- Debounced autosave, ~1.8 s after the last change, to
  `PUT /api/projects/:id/scene`
- A recovery copy is written to `localStorage` and preferred on the next load
- Save status is shown in the header: saving, saved, or save failed
- `Cmd/Ctrl + S` commits immediately
- Scenes are stored as JSON: `version`, `width`, `height`, `background`,
  `elements`, `metadata`

---

## 14. 🔄 Legacy Project Migration

Projects saved before the Konva migration used a Fabric.js document with an
`objects` array. They still open: the loader detects the old shape and converts
it automatically, tagging the result with `metadata.migratedFrom = "fabric"`.

Fabric.js is not part of the runtime. It remains only as an accepted legacy input
format.

The conversion covers origin handling (`originX`/`originY` to top-left), letter
spacing units, parsed path commands to SVG path strings, point-object arrays to
flat arrays, filter instances to the filter config, gradient fill objects, and
group children from centre-relative to top-left-relative coordinates. Unknown
object types are dropped rather than breaking the load.

---

## 15. 📤 Export

- **PNG** - lossless raster
- **JPEG** - compressed raster
- **PDF** - single page wrapping a JPEG of the artboard
- **SVG** - see the limitation below
- Scale factors: 1x, 2x, 3x
- The export always matches the document size regardless of the current zoom
- Selection handles are cleared before rendering, so they never appear in output
- Alignment guides are DOM overlays and are likewise never included

### SVG limitation
SVG export is a **raster wrapper**: an `<svg>` document containing a single
embedded PNG image of the artboard. Konva has no vector serialiser, so this is
**not** true vector output. The export modal states this next to the size
readout.

### Image CORS limitation
Canvas export fails on a tainted canvas. Images are requested with
`crossOrigin = "anonymous"`, so a remote host that does not send permissive CORS
headers will block export in every format. The editor reports this as an error
toast.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl + D` | Duplicate |
| `Cmd/Ctrl + C` / `V` / `X` | Copy / paste / cut |
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Shift + Z`, `Cmd/Ctrl + Y` | Redo |
| `Cmd/Ctrl + A` | Select all |
| `Cmd/Ctrl + G` | Group |
| `Cmd/Ctrl + Shift + G` | Ungroup |
| `Cmd/Ctrl + S` | Save |
| `Cmd/Ctrl + =` / `-` | Zoom in / out |
| `Cmd/Ctrl + 0` | Zoom to fit |
| `Delete` / `Backspace` | Delete selection |
| `Esc` | Clear selection, or cancel crop / text editing |
| Arrow keys | Move 1 px (`Shift` for 10 px) |
| `Space` + drag | Pan |
| `Enter` | Apply crop (crop mode only) |

---

## 🎯 Implementation Map

### Canvas
- `components/editor/CanvasWorkspace.tsx` - stage, transformer, action bus,
  shortcuts, zoom/pan, crop, drag-and-drop
- `components/editor/elements/` - `ElementNode`, `TextElement`, `ImageElement`,
  `ShapeElement`, `GroupElement`
- `components/editor/hooks/useKonvaImage.ts` - cached image loading

### Panels and toolbars
- `PrimarySidebar.tsx`, `AssetPanel.tsx` - panel routing
- `FilterPanel.tsx`, `GradientPicker.tsx`, `TextEffectsPanel.tsx`, `CropTool.tsx`
- `ContextualToolbar.tsx`, `TextContextualToolbar.tsx`, `ImageToolbar.tsx`,
  `ShapeToolbar.tsx`
- `LayersPanel.tsx` - layer list and inspector
- `AlignmentGuides.tsx`, `TextEditorOverlay.tsx`, `ZoomControls.tsx`
- `ExportModal.tsx`, `ShareModal.tsx`, `EditorHeader.tsx`

### State and libraries
- `store/editorStore.ts`, `store/editorSelectors.ts`
- `lib/editor/actions.ts` - action bus
- `lib/editor/serialization.ts` - serialize, deserialize, Fabric migration
- `lib/editor/konva-props.ts` - model to Konva prop mapping
- `lib/editor/alignment.ts`, `coordinates.ts`, `patch.ts`, `layers.ts`
- `lib/editor/export.ts`, `stage-registry.ts`
- `lib/editor/factory.ts`, `shapes.ts`, `fonts.ts`, `templates.ts`

---

## 🚀 Performance Notes

- Element renderers are memoised, so a store update only re-renders what changed
- Images are cached per `src` in a module-level map
- Filtered nodes are cached only while a filter is active, and the cache is
  cleared on removal and on unmount
- Alignment guides render only during a drag
- Continuous input avoids writing a history entry per event
- The canvas is client-only (`dynamic(..., { ssr: false })`), and the native
  `canvas` binding is stubbed in the Next.js webpack config

---

## 🔧 Not Implemented

- Multi-page documents (`add-page` reports that it is unsupported)
- Element animation (the animate popover is a UI placeholder)
- Layer blend modes
- Curved text / text on a path
- Free-form or mask crop
- Video elements (the upload slot is a placeholder)
- True vector SVG export
