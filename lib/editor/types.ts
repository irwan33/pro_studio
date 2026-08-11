/**
 * Serializable editor model.
 *
 * The model is renderer agnostic on purpose: it never stores Konva nodes, DOM
 * nodes or class instances so it can be persisted straight to the database and
 * restored later, even if the rendering library changes again.
 */

export const EDITOR_SCENE_VERSION = "2.0.0";

export type EditorElementType = "text" | "image" | "rect" | "circle" | "line" | "path" | "group";

/**
 * Sidebar panel identifiers. The primary sidebar, the asset panel router and any
 * toolbar shortcut that opens a panel all share this list so a panel can never
 * be opened with a name the router does not know about.
 */
export const EDITOR_PANELS = [
  "document",
  "templates",
  "elements",
  "uploads",
  "images",
  "text",
  "shapes",
  "color",
  "position",
  "effects",
  "gradients",
  "filters"
] as const;

export type EditorPanel = (typeof EDITOR_PANELS)[number];

export type GradientStop = { color: string; offset: number };

export type GradientConfig = {
  type: "linear" | "radial";
  angle: number;
  stops: GradientStop[];
};

/**
 * Serializable fill model for shapes.
 * Supports: none, solid, linear gradient, radial gradient.
 */
export type ShapeFill =
  | { type: "none" }
  | { type: "solid"; color: string }
  | { type: "gradient"; config: GradientConfig };

export type ShadowConfig = {
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
  opacity?: number;
};

export type ImageFilterConfig = {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  blur?: number;
};

export type CropConfig = { x: number; y: number; width: number; height: number };

export type TextProperties = {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: "normal" | "italic";
  fill: string;
  align: "left" | "center" | "right" | "justify";
  verticalAlign?: "top" | "middle" | "bottom";
  lineHeight: number;
  letterSpacing: number;
  underline: boolean;
  linethrough: boolean;
  textTransform: "none" | "uppercase" | "lowercase" | "capitalize";
  listType: "none" | "bullet" | "numbered" | "checklist";
  /**
   * "auto-width" — measure the rendered glyphs and set width/height from them.
   * "fixed-width" — keep the configured width, wrap content, measure height.
   * Undefined falls back to fixed-width so existing projects keep their boxes.
   */
  textSizing?: "auto-width" | "fixed-width";
  stroke?: string;
  strokeWidth?: number;
  shadow?: ShadowConfig | null;
  padding?: number;
};

export type ImageProperties = {
  src: string;
  crop?: CropConfig | null;
  filters?: ImageFilterConfig | null;
  flipX?: boolean;
  flipY?: boolean;
  naturalWidth?: number;
  naturalHeight?: number;
};

export type ShapeProperties = {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  radius?: number;
  points?: number[];
  closed?: boolean;
  data?: string;
  dash?: number[];
  /** @deprecated Use fill property with ShapeFill type. Kept for serialization compatibility. */
  gradient?: GradientConfig | null;
  shadow?: ShadowConfig | null;
  flipX?: boolean;
  flipY?: boolean;
};

export type EditorElementProperties = Partial<TextProperties & ImageProperties & ShapeProperties> &
  Record<string, unknown>;

export type EditorElement = {
  id: string;
  type: EditorElementType;
  name: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  opacity?: number;
  visible?: boolean;
  locked?: boolean;
  zIndex: number;
  properties: EditorElementProperties;
  children?: EditorElement[];
};

export type EditorScene = {
  version: string;
  width: number;
  height: number;
  background: string;
  elements: EditorElement[];
  metadata: Record<string, unknown>;
};

/** Legacy Fabric.js document shape kept only for reading old projects. */
export type LegacyFabricScene = {
  version?: string;
  width?: number;
  height?: number;
  background?: string;
  objects?: Record<string, unknown>[];
  metadata?: Record<string, unknown>;
};

export const isTextElement = (element: EditorElement) => element.type === "text";
export const isImageElement = (element: EditorElement) => element.type === "image";
export const isShapeElement = (element: EditorElement) =>
  element.type === "rect" || element.type === "circle" || element.type === "line" || element.type === "path";
