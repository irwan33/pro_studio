import { createElementId, defaultElementName } from "@/lib/editor/serialization";
import { coverCanvas } from "@/lib/editor/image-fit";
import type { EditorElement, EditorElementType } from "@/lib/editor/types";

/**
 * Factories that build serializable editor elements. The canvas never
 * constructs renderer nodes directly; it only adds elements to the store.
 */

type Base = {
  name?: string;
  x?: number;
  y?: number;
  zIndex?: number;
};

function base(type: EditorElementType, options: Base, index = 0): Omit<EditorElement, "properties"> {
  return {
    id: createElementId(),
    type,
    name: options.name ?? defaultElementName(type, index),
    x: options.x ?? 0,
    y: options.y ?? 0,
    width: 100,
    height: 100,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: options.zIndex ?? 0
  };
}

export type TextInit = Base & {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  fill?: string;
  width?: number;
  align?: "left" | "center" | "right" | "justify";
  lineHeight?: number;
};

export function createTextElement(init: TextInit = {}): EditorElement {
  const fontSize = init.fontSize ?? 72;
  const width = init.width ?? Math.max(160, Math.round(fontSize * 7));
  return {
    ...base("text", { name: init.name ?? "Text Layer", x: init.x ?? 120, y: init.y ?? 140 }),
    width,
    height: Math.round(fontSize * (init.lineHeight ?? 1.16)),
    properties: {
      text: init.text ?? "NEW TEXT",
      fontFamily: init.fontFamily ?? "Archivo Black",
      fontSize,
      fontWeight: init.fontWeight ?? "400",
      fontStyle: init.fontStyle === "italic" ? "italic" : "normal",
      fill: init.fill ?? "#F5F5F2",
      align: init.align ?? "left",
      lineHeight: init.lineHeight ?? 1.16,
      letterSpacing: 0,
      underline: false,
      linethrough: false,
      textTransform: "none",
      listType: "none"
    }
  };
}

export type RectInit = Base & {
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  opacity?: number;
  rotation?: number;
};

export function createRectElement(init: RectInit = {}): EditorElement {
  return {
    ...base("rect", { name: init.name ?? "Rectangle", x: init.x ?? 160, y: init.y ?? 220 }),
    width: init.width ?? 240,
    height: init.height ?? 140,
    opacity: init.opacity ?? 1,
    rotation: init.rotation ?? 0,
    properties: {
      fill: init.fill ?? "#C7FF00",
      stroke: init.stroke,
      strokeWidth: init.strokeWidth ?? 0,
      cornerRadius: init.cornerRadius ?? 0
    }
  };
}

export type CircleInit = Base & {
  radius?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
};

export function createCircleElement(init: CircleInit = {}): EditorElement {
  const radius = init.radius ?? 90;
  return {
    ...base("circle", { name: init.name ?? "Ellipse", x: init.x ?? 210, y: init.y ?? 250 }),
    width: radius * 2,
    height: radius * 2,
    opacity: init.opacity ?? 1,
    properties: {
      fill: init.fill ?? "#C7FF00",
      stroke: init.stroke,
      strokeWidth: init.strokeWidth ?? 0
    }
  };
}

export type LineInit = Base & {
  points?: number[];
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  closed?: boolean;
  opacity?: number;
};

export function createLineElement(init: LineInit = {}): EditorElement {
  const points = init.points ?? [0, 0, 310, 0];
  const xs = points.filter((_, index) => index % 2 === 0);
  const ys = points.filter((_, index) => index % 2 === 1);
  return {
    ...base("line", { name: init.name ?? "Line", x: init.x ?? 160, y: init.y ?? 260 }),
    width: Math.max(1, Math.max(...xs) - Math.min(...xs)),
    height: Math.max(init.closed ? 1 : 0, Math.max(...ys) - Math.min(...ys)),
    opacity: init.opacity ?? 1,
    properties: {
      points,
      closed: init.closed ?? false,
      stroke: init.stroke ?? "#C7FF00",
      strokeWidth: init.strokeWidth ?? 8,
      fill: init.fill
    }
  };
}

export type PathInit = Base & {
  data: string;
  viewBox?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  size?: number;
};

export function createPathElement(init: PathInit): EditorElement {
  const [, , viewWidth = 100, viewHeight = 100] = (init.viewBox ?? "0 0 100 100")
    .split(/\s+/)
    .map((value) => Number(value));
  const size = init.size ?? 220;
  return {
    ...base("path", { name: init.name ?? "Shape", x: init.x ?? 200, y: init.y ?? 200 }),
    width: viewWidth || 100,
    height: viewHeight || 100,
    scaleX: size / (viewWidth || 100),
    scaleY: size / (viewHeight || 100),
    properties: {
      data: init.data,
      fill: init.fill ?? "#C7FF00",
      stroke: init.stroke,
      strokeWidth: init.strokeWidth ?? 0
    }
  };
}

export type ImageInit = Base & {
  src: string;
  naturalWidth?: number;
  naturalHeight?: number;
  maxSize?: number;
  /**
   * Artboard size. When provided, the image is placed with `object-fit: cover`
   * semantics: it fills the whole artboard, keeps its aspect ratio and the
   * overflow is cropped evenly. This is the default for newly inserted images.
   */
  canvas?: { width: number; height: number };
};

export function createImageElement(init: ImageInit): EditorElement {
  const maxSize = init.maxSize ?? 420;
  const naturalWidth = init.naturalWidth ?? maxSize;
  const naturalHeight = init.naturalHeight ?? maxSize;

  if (init.canvas) {
    const fit = coverCanvas({ width: naturalWidth, height: naturalHeight }, init.canvas);
    return {
      ...base("image", { name: init.name ?? "Image", x: fit.x, y: fit.y }),
      width: fit.width,
      height: fit.height,
      properties: {
        src: init.src,
        naturalWidth,
        naturalHeight,
        crop: fit.crop,
        filters: null,
        flipX: false,
        flipY: false
      }
    };
  }

  const ratio = Math.min(maxSize / Math.max(1, naturalWidth), maxSize / Math.max(1, naturalHeight), 1);
  return {
    ...base("image", { name: init.name ?? "Image", x: init.x ?? 235, y: init.y ?? 300 }),
    width: Math.max(5, Math.round(naturalWidth * ratio)),
    height: Math.max(5, Math.round(naturalHeight * ratio)),
    properties: {
      src: init.src,
      naturalWidth,
      naturalHeight,
      crop: null,
      filters: null,
      flipX: false,
      flipY: false
    }
  };
}

/* ------------------------------------------------------------------ */
/* Composite sports elements                                           */
/* ------------------------------------------------------------------ */

export type CompositeKind =
  | "badge"
  | "score-card"
  | "match-info"
  | "stat-card"
  | "lower-third"
  | "fixture"
  | "versus"
  | "sponsor"
  | "gradient"
  | "pattern"
  | "corner"
  | "divider"
  | "label";

export function createCompositeElements(kind: CompositeKind, name: string, canvas: { width: number; height: number }): EditorElement[] {
  const displayFont = "Archivo Black";
  const monoFont = "IBM Plex Mono";

  switch (kind) {
    case "badge":
      return [
        createCircleElement({ name, x: 140, y: 160, radius: 86, fill: "#111827", stroke: "#C7FF00", strokeWidth: 8 }),
        createTextElement({
          name: name + " Text",
          text: "FC",
          x: 176,
          y: 216,
          width: 100,
          fontSize: 46,
          fill: "#F5F5F2",
          fontFamily: displayFont,
          align: "center"
        })
      ];
    case "score-card":
      return [
        createRectElement({ name, x: 150, y: 820, width: 760, height: 150, fill: "#111827", stroke: "#C7FF00", strokeWidth: 4, cornerRadius: 12 }),
        createTextElement({ name: name + " Text", text: "MAD 2 - 1 BAR", x: 205, y: 858, width: 650, fontSize: 72, fill: "#F5F5F2", fontFamily: displayFont, align: "center" })
      ];
    case "match-info":
      return [
        createRectElement({ name, x: 150, y: 990, width: 760, height: 86, fill: "rgba(199,255,0,0.12)", stroke: "#C7FF00", strokeWidth: 3, cornerRadius: 8 }),
        createTextElement({ name: name + " Label", text: "OCT 24 / 20:00 / HOME STADIUM", x: 190, y: 1018, width: 680, fontSize: 28, fill: "#F5F5F2", fontFamily: monoFont, align: "center" })
      ];
    case "stat-card":
      return [
        createRectElement({ name, x: 690, y: 240, width: 260, height: 310, fill: "#101312", stroke: "#F5F5F2", strokeWidth: 3, cornerRadius: 12 }),
        createTextElement({ name: name + " Value", text: "87", x: 720, y: 270, width: 200, fontSize: 118, fill: "#C7FF00", fontFamily: displayFont, align: "center" }),
        createTextElement({ name: name + " Label", text: "PACE", x: 720, y: 400, width: 200, fontSize: 30, fill: "#F5F5F2", fontFamily: monoFont, align: "center" })
      ];
    case "lower-third":
      return [
        createRectElement({ name, x: 110, y: 1040, width: 760, height: 132, fill: "rgba(5,8,12,0.86)", cornerRadius: 10 }),
        createRectElement({ name: name + " Accent", x: 110, y: 1040, width: 16, height: 132, fill: "#C7FF00" }),
        createTextElement({ name: name + " Title", text: "PLAYER NAME", x: 150, y: 1060, width: 650, fontSize: 58, fill: "#F5F5F2", fontFamily: displayFont }),
        createTextElement({ name: name + " Subtitle", text: "FORWARD / HOME TEAM", x: 152, y: 1122, width: 620, fontSize: 22, fill: "#C7FF00", fontFamily: monoFont })
      ];
    case "fixture":
      return [
        createRectElement({ name, x: 140, y: 930, width: 800, height: 96, fill: "#C7FF00", cornerRadius: 14 }),
        createTextElement({ name: name + " Text", text: "MADRID   VS   BARCA", x: 185, y: 953, width: 710, fontSize: 48, fill: "#050505", fontFamily: displayFont, align: "center" })
      ];
    case "versus":
      return [
        createTextElement({ name: name + " 1", text: "MAD", x: 260, y: 590, width: 220, fontSize: 88, fill: "#F5F5F2", fontFamily: displayFont, align: "center" }),
        createTextElement({ name: name + " 2", text: "VS", x: 475, y: 590, width: 130, fontSize: 88, fill: "#C7FF00", fontFamily: displayFont, align: "center" }),
        createTextElement({ name: name + " 3", text: "BAR", x: 605, y: 590, width: 220, fontSize: 88, fill: "#F5F5F2", fontFamily: displayFont, align: "center" })
      ];
    case "sponsor":
      return [
        createRectElement({ name, x: 360, y: 1140, width: 360, height: 58, fill: "rgba(255,255,255,0.08)", stroke: "#F5F5F2", strokeWidth: 2, cornerRadius: 29 }),
        createTextElement({ name: name + " Text", text: "LIVE MATCH ON PRO STUDIO", x: 390, y: 1158, width: 300, fontSize: 18, fill: "#F5F5F2", fontFamily: monoFont, align: "center" })
      ];
    case "gradient":
      return [createCircleElement({ name, x: 625, y: 80, radius: 260, fill: "#C7FF00", opacity: 0.18 })];
    case "pattern":
      return Array.from({ length: 12 }, (_, index) =>
        createRectElement({
          name: name + " " + (index + 1),
          x: index * 110 - 60,
          y: -60,
          width: 34,
          height: Math.round(canvas.height * 1.4),
          fill: index % 2 ? "rgba(255,255,255,0.12)" : "rgba(199,255,0,0.12)",
          rotation: 42
        })
      );
    case "corner":
      return [
        createRectElement({ name: name + " 1", x: 80, y: 80, width: 220, height: 8, fill: "#C7FF00" }),
        createRectElement({ name: name + " 2", x: 80, y: 80, width: 8, height: 220, fill: "#C7FF00" }),
        createRectElement({ name: name + " 3", x: canvas.width - 300, y: canvas.height - 310, width: 220, height: 8, fill: "#C7FF00" }),
        createRectElement({ name: name + " 4", x: canvas.width - 88, y: canvas.height - 522, width: 8, height: 220, fill: "#C7FF00" })
      ];
    case "divider":
      return [createLineElement({ name, x: 160, y: 760, points: [0, 0, 760, 0], stroke: "#C7FF00", strokeWidth: 6 })];
    case "label":
      return [
        createRectElement({ name, x: 110, y: 160, width: 190, height: 54, fill: "#C7FF00", cornerRadius: 8 }),
        createTextElement({ name: name + " Text", text: "LIVE", x: 125, y: 173, width: 160, fontSize: 30, fill: "#050505", fontFamily: displayFont, align: "center" })
      ];
    default:
      return [];
  }
}

export function createAssetElements(
  kind: "player" | "atmosphere" | "light",
  name: string,
  canvas: { width: number; height: number }
): EditorElement[] {
  if (kind === "player") {
    return [
      createRectElement({ name, x: 410, y: 420, width: 190, height: 390, fill: "#1f2937", stroke: "#C7FF00", strokeWidth: 3, cornerRadius: 80 }),
      createCircleElement({ name: name + " Head", x: 455, y: 335, radius: 55, fill: "#B6B9B1" })
    ];
  }
  if (kind === "atmosphere") {
    return [
      createRectElement({ name, x: 0, y: 0, width: canvas.width, height: canvas.height, fill: "rgba(255,255,255,0.06)" })
    ];
  }
  return [createCircleElement({ name, x: 720, y: 85, radius: 185, fill: "#C7FF00", opacity: 0.2 })];
}

const STICKER_POINTS: Record<string, number[]> = {
  spark: [70, 0, 95, 50, 150, 70, 95, 95, 70, 150, 45, 95, 0, 70, 45, 50],
  trophy: [20, 0, 150, 0, 170, 80, 115, 145, 115, 185, 150, 210, 20, 210, 55, 185, 55, 145, 0, 80],
  whistle: [0, 20, 120, 0, 150, 40, 120, 90, 0, 70],
  boot: [0, 60, 40, 0, 150, 10, 190, 60, 190, 110, 0, 110]
};

export function createStickerElements(
  kind: "trophy" | "ball" | "whistle" | "boot" | "spark",
  name: string
): EditorElement[] {
  if (kind === "ball") {
    return [createCircleElement({ name, x: 180, y: 180, radius: 70, fill: "#F5F5F2", stroke: "#111827", strokeWidth: 8 })];
  }
  return [
    createLineElement({
      name,
      x: 200,
      y: 200,
      points: STICKER_POINTS[kind] ?? STICKER_POINTS.spark,
      closed: true,
      fill: kind === "boot" ? "#111827" : "#C7FF00",
      stroke: "#F5F5F2",
      strokeWidth: kind === "spark" ? 0 : 4
    })
  ];
}
