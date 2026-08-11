import { nanoid } from "nanoid";
import {
  EDITOR_SCENE_VERSION,
  type EditorElement,
  type EditorElementType,
  type EditorScene,
  type ImageFilterConfig,
  type LegacyFabricScene,
  type ShadowConfig
} from "@/lib/editor/types";

export const DEFAULT_CANVAS_WIDTH = 1080;
export const DEFAULT_CANVAS_HEIGHT = 1350;
export const DEFAULT_BACKGROUND = "#090a09";

export function createElementId() {
  return "el_" + nanoid(10);
}

function num(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function str(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function bool(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/* ------------------------------------------------------------------ */
/* Fabric.js -> Konva mapping                                          */
/* ------------------------------------------------------------------ */

const FABRIC_TYPE_MAP: Record<string, EditorElementType> = {
  textbox: "text",
  text: "text",
  "i-text": "text",
  itext: "text",
  image: "image",
  rect: "rect",
  circle: "circle",
  ellipse: "circle",
  line: "line",
  polygon: "line",
  polyline: "line",
  triangle: "line",
  path: "path",
  group: "group",
  activeselection: "group"
};

/**
 * Fabric serialises `charSpacing` in 1/1000 em. Konva uses absolute pixels.
 */
function fabricCharSpacingToPx(charSpacing: unknown, fontSize: number) {
  return (num(charSpacing, 0) / 1000) * fontSize;
}

function fabricShadow(value: unknown): ShadowConfig | null {
  if (!isRecord(value)) return null;
  return {
    color: str(value.color, "#000000"),
    blur: num(value.blur, 0),
    offsetX: num(value.offsetX, 0),
    offsetY: num(value.offsetY, 0)
  };
}

/**
 * Fabric stores parsed path commands (`[["M", 0, 0], ...]`). Konva expects the
 * original SVG path string, so we re-serialise the command list.
 */
function fabricPathToSvg(value: unknown): string {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value
    .map((command) => (Array.isArray(command) ? command.join(" ") : String(command)))
    .join(" ")
    .trim();
}

function fabricPointsToFlat(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  if (value.every((point) => typeof point === "number")) return value as number[];
  return value.flatMap((point) => (isRecord(point) ? [num(point.x), num(point.y)] : []));
}

function fabricFilters(value: unknown): ImageFilterConfig | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const filters: ImageFilterConfig = {};
  for (const filter of value) {
    if (!isRecord(filter)) continue;
    const type = str(filter.type).toLowerCase();
    if (type === "brightness") filters.brightness = num(filter.brightness);
    if (type === "contrast") filters.contrast = num(filter.contrast);
    if (type === "saturation") filters.saturation = num(filter.saturation);
    if (type === "huerotation") filters.hue = num(filter.rotation) * 180;
    if (type === "blur") filters.blur = num(filter.blur);
  }
  return Object.keys(filters).length > 0 ? filters : null;
}

/**
 * Fabric `fill` may be a gradient object. Konva shapes in this editor use a
 * simplified gradient config, everything else falls back to the first colour
 * stop so no element silently disappears.
 */
function fabricFill(value: unknown, fallback: string) {
  if (typeof value === "string") return { fill: value, gradient: null };
  if (isRecord(value) && Array.isArray(value.colorStops)) {
    const stops = value.colorStops
      .filter(isRecord)
      .map((stop) => ({ color: str(stop.color, "#ffffff"), offset: num(stop.offset) }));
    return {
      fill: stops[0]?.color ?? fallback,
      gradient: {
        type: str(value.type, "linear") === "radial" ? ("radial" as const) : ("linear" as const),
        angle: 90,
        stops: stops.length >= 2 ? stops : [...stops, { color: fallback, offset: 1 }]
      }
    };
  }
  return { fill: fallback, gradient: null };
}

/**
 * Fabric positions objects by `originX`/`originY` (defaults to top-left, but
 * `center` is also common). The editor model always stores the top-left corner.
 */
function normalizeOrigin(object: Record<string, unknown>, width: number, height: number) {
  const left = num(object.left);
  const top = num(object.top);
  const originX = str(object.originX, "left");
  const originY = str(object.originY, "top");
  const x = originX === "center" ? left - width / 2 : originX === "right" ? left - width : left;
  const y = originY === "center" ? top - height / 2 : originY === "bottom" ? top - height : top;
  return { x, y };
}

function fabricObjectToElement(object: Record<string, unknown>, index: number): EditorElement | null {
  const rawType = str(object.type, "rect").toLowerCase();
  const type = FABRIC_TYPE_MAP[rawType];
  if (!type) return null;

  const scaleX = num(object.scaleX, 1) || 1;
  const scaleY = num(object.scaleY, 1) || 1;
  const locked = bool(object.lockMovementX) || bool(object.selectable) === false;
  const id = str(object.objectId) || str(object.id) || createElementId();
  const name = str(object.name) || defaultElementName(type, index);

  const base = {
    id,
    type,
    name,
    rotation: num(object.angle, 0),
    opacity: num(object.opacity, 1),
    visible: bool(object.visible, true),
    locked,
    zIndex: index
  };

  if (type === "text") {
    const fontSize = num(object.fontSize, 48);
    const width = num(object.width, 320) * scaleX;
    const height = num(object.height, fontSize * 1.2) * scaleY;
    const { x, y } = normalizeOrigin(object, width, height);
    const align = str(object.textAlign, "left");
    return {
      ...base,
      x,
      y,
      width,
      height,
      scaleX: 1,
      scaleY: 1,
      properties: {
        text: str(object.text, "Text"),
        fontFamily: str(object.fontFamily, "Inter"),
        fontSize,
        fontWeight: String(object.fontWeight ?? "400"),
        fontStyle: str(object.fontStyle, "normal") === "italic" ? "italic" : "normal",
        fill: fabricFill(object.fill, "#ffffff").fill,
        align: (["left", "center", "right", "justify"].includes(align) ? align : "left") as
          | "left"
          | "center"
          | "right"
          | "justify",
        lineHeight: num(object.lineHeight, 1.16),
        letterSpacing: fabricCharSpacingToPx(object.charSpacing, fontSize),
        underline: bool(object.underline),
        linethrough: bool(object.linethrough),
        textTransform: (str(object.textTransform, "none") || "none") as
          | "none"
          | "uppercase"
          | "lowercase"
          | "capitalize",
        listType: (str(object.listType, "none") || "none") as "none" | "bullet" | "numbered" | "checklist",
        stroke: typeof object.stroke === "string" ? object.stroke : undefined,
        strokeWidth: num(object.strokeWidth, 0),
        shadow: fabricShadow(object.shadow)
      }
    };
  }

  if (type === "image") {
    const width = num(object.width, 320) * scaleX;
    const height = num(object.height, 320) * scaleY;
    const { x, y } = normalizeOrigin(object, width, height);
    return {
      ...base,
      x,
      y,
      width,
      height,
      scaleX: 1,
      scaleY: 1,
      properties: {
        src: str(object.src) || str((object as { source?: string }).source),
        filters: fabricFilters(object.filters),
        flipX: bool(object.flipX),
        flipY: bool(object.flipY),
        naturalWidth: num(object.width, 0),
        naturalHeight: num(object.height, 0)
      }
    };
  }

  if (type === "circle") {
    const radius = num(object.radius, num(object.rx, 60));
    const width = radius * 2 * scaleX;
    const height = num(object.ry, radius) * 2 * scaleY;
    const { x, y } = normalizeOrigin(object, width, height);
    const { fill, gradient } = fabricFill(object.fill, "#C7FF00");
    return {
      ...base,
      x,
      y,
      width,
      height,
      scaleX: 1,
      scaleY: 1,
      properties: {
        fill,
        gradient,
        stroke: typeof object.stroke === "string" ? object.stroke : undefined,
        strokeWidth: num(object.strokeWidth, 0),
        shadow: fabricShadow(object.shadow)
      }
    };
  }

  if (type === "line") {
    const { fill, gradient } = fabricFill(object.fill, "#C7FF00");
    const isPolygon = rawType === "polygon" || rawType === "polyline" || rawType === "triangle";
    const points = isPolygon
      ? fabricPointsToFlat(object.points)
      : [0, 0, num(object.x2) - num(object.x1), num(object.y2) - num(object.y1)];
    const xs = points.filter((_, i) => i % 2 === 0);
    const ys = points.filter((_, i) => i % 2 === 1);
    const width = (xs.length ? Math.max(...xs) - Math.min(...xs) : num(object.width, 100)) * scaleX;
    const height = (ys.length ? Math.max(...ys) - Math.min(...ys) : num(object.height, 0)) * scaleY;
    const { x, y } = normalizeOrigin(object, width, height);
    const minX = xs.length ? Math.min(...xs) : 0;
    const minY = ys.length ? Math.min(...ys) : 0;
    return {
      ...base,
      x,
      y,
      width: Math.max(1, width),
      height: Math.max(isPolygon ? 1 : 0, height),
      scaleX: 1,
      scaleY: 1,
      properties: {
        points: points.map((value, i) => (i % 2 === 0 ? value - minX : value - minY)),
        closed: isPolygon,
        fill: isPolygon ? fill : undefined,
        gradient: isPolygon ? gradient : null,
        stroke: typeof object.stroke === "string" ? object.stroke : isPolygon ? undefined : "#C7FF00",
        strokeWidth: num(object.strokeWidth, isPolygon ? 0 : 4),
        shadow: fabricShadow(object.shadow)
      }
    };
  }

  if (type === "path") {
    const width = num(object.width, 100) * scaleX;
    const height = num(object.height, 100) * scaleY;
    const { x, y } = normalizeOrigin(object, width, height);
    const { fill, gradient } = fabricFill(object.fill, "#C7FF00");
    return {
      ...base,
      x,
      y,
      width: num(object.width, 100),
      height: num(object.height, 100),
      scaleX,
      scaleY,
      properties: {
        data: fabricPathToSvg(object.path ?? object.d),
        fill,
        gradient,
        stroke: typeof object.stroke === "string" ? object.stroke : undefined,
        strokeWidth: num(object.strokeWidth, 0),
        shadow: fabricShadow(object.shadow)
      }
    };
  }

  // Groups: Fabric stores children relative to the group centre. We flatten the
  // group into a Konva group with top-left relative children.
  const width = num(object.width, 100) * scaleX;
  const height = num(object.height, 100) * scaleY;
  const { x, y } = normalizeOrigin(object, width, height);
  const children = Array.isArray(object.objects)
    ? object.objects
        .filter(isRecord)
        .map((child, childIndex) => fabricObjectToElement(child, childIndex))
        .filter((child): child is EditorElement => child !== null)
        .map((child) => ({ ...child, x: child.x + width / 2, y: child.y + height / 2 }))
    : [];
  return {
    ...base,
    x,
    y,
    width,
    height,
    scaleX: 1,
    scaleY: 1,
    properties: {},
    children
  };
}

export function defaultElementName(type: EditorElementType, index: number) {
  const labels: Record<EditorElementType, string> = {
    text: "Text",
    image: "Image",
    rect: "Rectangle",
    circle: "Ellipse",
    line: "Line",
    path: "Shape",
    group: "Group"
  };
  return labels[type] + " " + (index + 1);
}

/** True when the payload looks like the pre-migration Fabric.js format. */
export function isLegacyFabricScene(input: unknown): input is LegacyFabricScene {
  return isRecord(input) && Array.isArray(input.objects) && !Array.isArray(input.elements);
}

export function migrateFabricProjectToKonva(
  input: unknown,
  width = DEFAULT_CANVAS_WIDTH,
  height = DEFAULT_CANVAS_HEIGHT
): EditorScene {
  const legacy = isRecord(input) ? (input as LegacyFabricScene) : {};
  const objects = Array.isArray(legacy.objects) ? legacy.objects.filter(isRecord) : [];
  const elements = objects
    .map((object, index) => fabricObjectToElement(object, index))
    .filter((element): element is EditorElement => element !== null)
    .map((element, index) => ({ ...element, zIndex: index }));

  return {
    version: EDITOR_SCENE_VERSION,
    width: num(legacy.width, width),
    height: num(legacy.height, height),
    background: str(legacy.background, DEFAULT_BACKGROUND),
    elements,
    metadata: { ...(isRecord(legacy.metadata) ? legacy.metadata : {}), migratedFrom: "fabric" }
  };
}

/* ------------------------------------------------------------------ */
/* Validation / (de)serialization                                      */
/* ------------------------------------------------------------------ */

export function validateEditorProject(input: unknown): input is EditorScene {
  if (!isRecord(input)) return false;
  if (!Array.isArray(input.elements)) return false;
  if (!Number.isFinite(Number(input.width)) || !Number.isFinite(Number(input.height))) return false;
  return input.elements.every(
    (element) => isRecord(element) && typeof element.id === "string" && typeof element.type === "string"
  );
}

function sanitizeElement(input: unknown, index: number): EditorElement | null {
  if (!isRecord(input)) return null;
  const type = str(input.type) as EditorElementType;
  if (!["text", "image", "rect", "circle", "line", "path", "group"].includes(type)) return null;
  const children = Array.isArray(input.children)
    ? input.children.map((child, childIndex) => sanitizeElement(child, childIndex)).filter(Boolean)
    : undefined;
  return {
    id: str(input.id) || createElementId(),
    type,
    name: str(input.name) || defaultElementName(type, index),
    x: num(input.x),
    y: num(input.y),
    width: input.width === undefined ? undefined : num(input.width),
    height: input.height === undefined ? undefined : num(input.height),
    rotation: num(input.rotation, 0),
    scaleX: num(input.scaleX, 1),
    scaleY: num(input.scaleY, 1),
    opacity: num(input.opacity, 1),
    visible: bool(input.visible, true),
    locked: bool(input.locked, false),
    zIndex: num(input.zIndex, index),
    properties: isRecord(input.properties) ? input.properties : {},
    children: children as EditorElement[] | undefined
  };
}

/** Produces the JSON payload that gets persisted for a project. */
export function serializeEditorState(scene: EditorScene): EditorScene {
  return {
    version: EDITOR_SCENE_VERSION,
    width: Math.round(scene.width),
    height: Math.round(scene.height),
    background: scene.background,
    elements: scene.elements
      .slice()
      .sort((a, b) => a.zIndex - b.zIndex)
      .map((element, index) => ({ ...element, zIndex: index })),
    metadata: scene.metadata ?? {}
  };
}

/**
 * Accepts either the current Konva scene format or a legacy Fabric.js document
 * and always returns a valid scene. Unknown payloads fall back to a template.
 */
export function deserializeEditorState(
  input: unknown,
  width = DEFAULT_CANVAS_WIDTH,
  height = DEFAULT_CANVAS_HEIGHT
): EditorScene {
  if (!isRecord(input)) return emptyEditorScene(width, height);

  if (isLegacyFabricScene(input)) return migrateFabricProjectToKonva(input, width, height);

  if (!Array.isArray(input.elements)) return emptyEditorScene(width, height);

  const elements = input.elements
    .map((element, index) => sanitizeElement(element, index))
    .filter((element): element is EditorElement => element !== null)
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((element, index) => ({ ...element, zIndex: index }));

  return {
    version: EDITOR_SCENE_VERSION,
    width: num(input.width, width),
    height: num(input.height, height),
    background: str(input.background, DEFAULT_BACKGROUND),
    elements,
    metadata: isRecord(input.metadata) ? input.metadata : {}
  };
}

/* ------------------------------------------------------------------ */
/* Default scene                                                       */
/* ------------------------------------------------------------------ */

function textElement(
  id: string,
  name: string,
  text: string,
  x: number,
  y: number,
  width: number,
  fontSize: number,
  fill: string,
  zIndex: number,
  extra: Partial<EditorElement["properties"]> = {}
): EditorElement {
  return {
    id,
    type: "text",
    name,
    x,
    y,
    width,
    height: Math.round(fontSize * 1.24),
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex,
    properties: {
      text,
      fontFamily: "Archivo Black",
      fontSize,
      fontWeight: "700",
      fontStyle: "normal",
      fill,
      align: "left",
      lineHeight: 1.16,
      letterSpacing: 0,
      underline: false,
      linethrough: false,
      textTransform: "none",
      listType: "none",
      ...extra
    }
  };
}

export function emptyEditorScene(width = DEFAULT_CANVAS_WIDTH, height = DEFAULT_CANVAS_HEIGHT): EditorScene {
  return {
    version: EDITOR_SCENE_VERSION,
    width,
    height,
    background: DEFAULT_BACKGROUND,
    elements: [
      textElement("title-matchday", "BG Text (MATCHDAY)", "MATCHDAY", 78, 110, 920, 132, "#737373", 0),
      textElement("team-home", "Team Name", "MADRID", 95, 915, 540, 78, "#ffffff", 1),
      textElement("team-away", "Match Info", "VS BARCA", 95, 1000, 700, 74, "#ffffff", 2),
      {
        id: "date-box",
        type: "rect",
        name: "Match Date",
        x: 690,
        y: 1018,
        width: 280,
        height: 48,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        visible: true,
        locked: false,
        zIndex: 3,
        properties: {
          fill: "rgba(199,255,0,0.14)",
          stroke: "#C7FF00",
          strokeWidth: 2,
          cornerRadius: 4
        }
      },
      textElement("date-text", "Match Date Label", "OCT 24 / 20:00", 714, 1028, 230, 24, "#F5F5F2", 4, {
        fontFamily: "IBM Plex Mono",
        fontWeight: "400"
      })
    ],
    metadata: { grid: true, safeArea: true }
  };
}
