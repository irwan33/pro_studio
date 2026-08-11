import type Konva from "konva";

/**
 * Focus mode click detection.
 *
 * Focus mode hides the content panel and the contextual toolbar, so it must only
 * trigger on a genuine click on the empty workspace *around* the artboard.
 * Everything else — the artboard, an element, a transformer handle, the
 * navigation rail, the header, a toolbar, a panel, a modal, a dropdown, the font
 * library, the replace flow, a context menu — must leave the UI alone.
 *
 * The helpers below are pure so the rules can be tested without a DOM or a
 * Konva stage.
 */

/** Konva node names used to tell the artboard apart from the elements on it. */
export const WORKSPACE_BACKGROUND_NAME = "workspace-background";
export const ARTBOARD_BACKGROUND_NAME = "artboard-background";
export const EDITOR_ELEMENT_NAME = "editor-element";

/**
 * Marks a DOM subtree as editor UI. Any click inside an element carrying this
 * attribute is chrome, never workspace background.
 */
export const EDITOR_UI_ATTRIBUTE = "data-editor-ui";

/**
 * The pieces of editor chrome whose visibility focus mode controls.
 *
 * Focus mode clears the space around the artboard, not the whole application
 * frame: the content panel and the contextual toolbar collapse, while the
 * navigation rail, the main header and the zoom controls stay so the editor keeps
 * its shape and the user never loses their bearings.
 */
export type EditorChrome =
  | "header"
  | "navigation-rail"
  | "contextual-toolbar"
  | "content-panel"
  | "zoom-controls";

/** Chrome that focus mode hides. */
export const FOCUS_MODE_HIDDEN_CHROME = [
  "contextual-toolbar",
  "content-panel"
] as const satisfies readonly EditorChrome[];

/** Chrome that stays visible in focus mode. */
export const FOCUS_MODE_PERSISTENT_CHROME = [
  "header",
  "navigation-rail",
  "zoom-controls"
] as const satisfies readonly EditorChrome[];

/**
 * Whether a piece of chrome should render. `EditorShell` drives every panel
 * through this, so the rule lives in one testable place instead of being spread
 * across conditional JSX.
 */
export function isChromeVisible(chrome: EditorChrome, focusMode: boolean): boolean {
  if (!focusMode) return true;
  return !(FOCUS_MODE_HIDDEN_CHROME as readonly EditorChrome[]).includes(chrome);
}

/** Selector covering interactive chrome that must not trigger focus mode. */
const UI_SELECTOR = [
  "[" + EDITOR_UI_ATTRIBUTE + "]",
  "button",
  "a",
  "input",
  "textarea",
  "select",
  "label",
  "[role=dialog]",
  "[role=menu]",
  "[role=listbox]",
  "[role=toolbar]",
  "[role=tooltip]",
  "aside",
  "header",
  "canvas"
].join(", ");

/**
 * True when a DOM event target is the empty workspace background.
 *
 * `container` is the scrolling workspace element. The target has to be the
 * container itself, or a plain wrapper inside it, and must not sit inside any
 * editor chrome — the Konva stage renders into a `canvas`, so element and
 * artboard clicks are excluded by the selector above.
 */
export function isWorkspaceBackgroundTarget(
  target: EventTarget | null,
  container: HTMLElement | null
): boolean {
  if (!container) return false;
  if (!(target instanceof HTMLElement)) return false;
  if (target === container) return true;
  if (!container.contains(target)) return false;
  if (target.closest(UI_SELECTOR)) return false;
  return target.hasAttribute("data-workspace-background");
}

/**
 * True when a Konva event landed on the artboard background rather than on an
 * element or a transformer handle. Used to restore the UI from focus mode.
 */
export function isArtboardBackgroundNode(node: Konva.Node | null | undefined): boolean {
  if (!node) return false;
  return node.name() === ARTBOARD_BACKGROUND_NAME;
}

/** True when a Konva event landed on a rendered element or a transformer. */
export function isEditorContentNode(node: Konva.Node | null | undefined): boolean {
  if (!node) return false;
  const name = node.name();
  if (name === EDITOR_ELEMENT_NAME) return true;
  // Transformer anchors are named `top-left`, `rotater`, ... and live inside a
  // Transformer, so walk up rather than matching every anchor name.
  return Boolean(node.findAncestor?.("Transformer", true));
}
