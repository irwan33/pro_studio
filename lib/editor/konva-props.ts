import { degToRad } from "@/lib/editor/coordinates";
import { EDITOR_ELEMENT_NAME } from "@/lib/editor/focus-mode";
import type { EditorElement, GradientConfig, ImageFilterConfig, ShadowConfig } from "@/lib/editor/types";
import type { ShapeFill } from "@/lib/editor/fill";

/** Translates the editor gradient config into Konva gradient props. */
export function gradientProps(gradient: GradientConfig | null | undefined, width: number, height: number) {
  if (!gradient || gradient.stops.length < 2) return {};
  const stops = gradient.stops
    .slice()
    .sort((a, b) => a.offset - b.offset)
    .flatMap((stop) => [stop.offset, stop.color]);

  if (gradient.type === "radial") {
    return {
      fillRadialGradientStartPoint: { x: width / 2, y: height / 2 },
      fillRadialGradientEndPoint: { x: width / 2, y: height / 2 },
      fillRadialGradientStartRadius: 0,
      fillRadialGradientEndRadius: Math.max(width, height) / 2,
      fillRadialGradientColorStops: stops
    };
  }

  const angle = degToRad(gradient.angle ?? 90);
  const halfW = width / 2;
  const halfH = height / 2;
  return {
    fillLinearGradientStartPoint: { x: halfW - Math.cos(angle) * halfW, y: halfH - Math.sin(angle) * halfH },
    fillLinearGradientEndPoint: { x: halfW + Math.cos(angle) * halfW, y: halfH + Math.sin(angle) * halfH },
    fillLinearGradientColorStops: stops
  };
}

export function shadowProps(shadow: ShadowConfig | null | undefined) {
  if (!shadow) return { shadowEnabled: false };
  return {
    shadowEnabled: true,
    shadowColor: shadow.color,
    shadowBlur: shadow.blur,
    shadowOffsetX: shadow.offsetX,
    shadowOffsetY: shadow.offsetY,
    shadowOpacity: shadow.opacity ?? 1
  };
}

/**
 * Konva filter values use different ranges than Fabric did:
 * - Brighten expects -1..1 (same as Fabric brightness)
 * - Contrast expects roughly -100..100
 * - HSV saturation is -1..1, hue rotation is in degrees
 */
export function filterValues(filters: ImageFilterConfig | null | undefined) {
  return {
    brightness: filters?.brightness ?? 0,
    contrast: (filters?.contrast ?? 0) * 100,
    saturation: filters?.saturation ?? 0,
    hue: filters?.hue ?? 0,
    blurRadius: Math.max(0, (filters?.blur ?? 0) * 40)
  };
}

export function hasActiveFilters(filters: ImageFilterConfig | null | undefined) {
  if (!filters) return false;
  return Object.values(filters).some((value) => Number(value) !== 0);
}

export function applyTextTransform(text: string, transform: string | undefined) {
  switch (transform) {
    case "uppercase":
      return text.toUpperCase();
    case "lowercase":
      return text.toLowerCase();
    case "capitalize":
      return text.replace(/\b\p{L}/gu, (match) => match.toUpperCase());
    default:
      return text;
  }
}

export function applyListPrefix(text: string, listType: string | undefined) {
  if (!listType || listType === "none") return text;
  return text
    .split("\n")
    .map((line, index) => {
      if (line.trim().length === 0) return line;
      if (listType === "numbered") return index + 1 + ". " + line;
      if (listType === "checklist") return "☐ " + line;
      return "•  " + line;
    })
    .join("\n");
}

export function textDecoration(properties: { underline?: boolean; linethrough?: boolean }) {
  const parts: string[] = [];
  if (properties.underline) parts.push("underline");
  if (properties.linethrough) parts.push("line-through");
  return parts.join(" ");
}

/** Konva expects `fontStyle` to carry both weight and italic. */
export function konvaFontStyle(fontWeight: string | undefined, fontStyle: string | undefined) {
  const weight = fontWeight ?? "400";
  const isBold = weight === "bold" || Number(weight) >= 600;
  const parts: string[] = [];
  if (fontStyle === "italic") parts.push("italic");
  parts.push(isBold ? "bold" : "normal");
  return parts.join(" ");
}

export function commonNodeProps(element: EditorElement) {
  return {
    id: element.id,
    name: EDITOR_ELEMENT_NAME,
    x: element.x,
    y: element.y,
    rotation: element.rotation ?? 0,
    opacity: element.visible === false ? 0 : element.opacity ?? 1,
    visible: element.visible !== false,
    listening: element.visible !== false,
    draggable: !element.locked && element.visible !== false
  };
}

/**
 * Converts the ShapeFill model into Konva fill props.
 * Handles: none, solid, linear gradient, radial gradient.
 */
export function fillProps(fill: ShapeFill | null | undefined, width: number, height: number) {
  if (!fill || fill.type === "none") {
    return {
      fill: undefined,
      fillEnabled: false,
      fillLinearGradientColorStops: [],
      fillRadialGradientColorStops: [],
      fillLinearGradientStartPoint: { x: 0, y: 0 },
      fillLinearGradientEndPoint: { x: 0, y: 0 },
      fillRadialGradientStartPoint: { x: 0, y: 0 },
      fillRadialGradientEndPoint: { x: 0, y: 0 },
      fillRadialGradientStartRadius: 0,
      fillRadialGradientEndRadius: 0
    };
  }

  if (fill.type === "solid") {
    return {
      fill: fill.color,
      fillEnabled: true,
      fillLinearGradientColorStops: [],
      fillRadialGradientColorStops: [],
      fillLinearGradientStartPoint: { x: 0, y: 0 },
      fillLinearGradientEndPoint: { x: 0, y: 0 },
      fillRadialGradientStartPoint: { x: 0, y: 0 },
      fillRadialGradientEndPoint: { x: 0, y: 0 },
      fillRadialGradientStartRadius: 0,
      fillRadialGradientEndRadius: 0
    };
  }

  if (fill.type === "gradient") {
    const gradient = fill.config;
    if (!gradient || gradient.stops.length < 2) {
      return { fill: undefined, fillEnabled: false };
    }
    const stops = gradient.stops
      .slice()
      .sort((a, b) => a.offset - b.offset)
      .flatMap((stop) => [stop.offset, stop.color]);

    if (gradient.type === "radial") {
      return {
        fillEnabled: true,
        fill: undefined,
        fillRadialGradientStartPoint: { x: width / 2, y: height / 2 },
        fillRadialGradientEndPoint: { x: width / 2, y: height / 2 },
        fillRadialGradientStartRadius: 0,
        fillRadialGradientEndRadius: Math.max(width, height) / 2,
        fillRadialGradientColorStops: stops,
        fillLinearGradientColorStops: [],
        fillLinearGradientStartPoint: { x: 0, y: 0 },
        fillLinearGradientEndPoint: { x: 0, y: 0 }
      };
    }

    const angle = degToRad(gradient.angle ?? 90);
    const halfW = width / 2;
    const halfH = height / 2;
    return {
      fillEnabled: true,
      fill: undefined,
      fillLinearGradientStartPoint: { x: halfW - Math.cos(angle) * halfW, y: halfH - Math.sin(angle) * halfH },
      fillLinearGradientEndPoint: { x: halfW + Math.cos(angle) * halfW, y: halfH + Math.sin(angle) * halfH },
      fillLinearGradientColorStops: stops,
      fillRadialGradientColorStops: [],
      fillRadialGradientStartPoint: { x: 0, y: 0 },
      fillRadialGradientEndPoint: { x: 0, y: 0 },
      fillRadialGradientStartRadius: 0,
      fillRadialGradientEndRadius: 0
    };
  }

  return { fill: undefined, fillEnabled: false };
}
