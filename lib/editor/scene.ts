/**
 * Public entry point for scene helpers.
 *
 * The editor scene is renderer-agnostic. The legacy Fabric.js document format is
 * still accepted on read and converted through `deserializeEditorState`, so
 * existing projects keep opening.
 */
export type { EditorElement, EditorScene, EditorElementType } from "@/lib/editor/types";

export {
  DEFAULT_BACKGROUND,
  DEFAULT_CANVAS_HEIGHT,
  DEFAULT_CANVAS_WIDTH,
  createElementId,
  deserializeEditorState,
  emptyEditorScene,
  isLegacyFabricScene,
  migrateFabricProjectToKonva,
  serializeEditorState,
  validateEditorProject
} from "@/lib/editor/serialization";
