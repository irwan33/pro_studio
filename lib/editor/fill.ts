import type { GradientConfig } from "@/lib/editor/types";

/**
 * Serializable fill model for shapes.
 * Supports: none, solid, linear gradient, radial gradient.
 */
export type ShapeFill =
  | { type: "none" }
  | { type: "solid"; color: string }
  | { type: "gradient"; config: GradientConfig };

/**
 * Default gradient config for normalization.
 */
export const DEFAULT_GRADIENT_CONFIG: GradientConfig = {
  type: "linear",
  angle: 90,
  stops: [
    { color: "#000000", offset: 0 },
    { color: "#ffffff", offset: 1 }
  ]
};

/**
 * Normalizes a gradient config - ensures at least 2 stops, clamped offsets, sorted.
 */
export function normalizeGradientConfig(config: Partial<GradientConfig>): GradientConfig {
  const stops = (config.stops ?? DEFAULT_GRADIENT_CONFIG.stops)
    .slice()
    .map((stop) => ({
      color: stop.color,
      offset: Math.max(0, Math.min(1, stop.offset))
    }))
    .sort((a, b) => a.offset - b.offset);

  // Ensure at least 2 stops
  const normalizedStops = stops.length >= 2
    ? stops
    : [
        { color: "#000000", offset: 0 },
        { color: "#ffffff", offset: 1 }
      ];

  return {
    type: config.type ?? "linear",
    angle: config.type === "radial" ? 0 : (config.angle ?? 90),
    stops: normalizedStops
  };
}

/**
 * Validates and normalizes a HEX color string.
 * Returns normalized HEX (uppercase, with #) or fallback.
 */
export function normalizeHexColor(hex: string, fallback = "#000000"): string {
  if (!hex) return fallback;
  const trimmed = hex.trim();

  // #RGB or #RGBA
  if (/^#[0-9a-fA-F]{3,4}$/.test(trimmed)) {
    return "#" + [...trimmed.slice(1)].map((c) => c + c).join("").toUpperCase();
  }

  // #RRGGBB or #RRGGBBAA
  if (/^#[0-9a-fA-F]{6,8}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // bare hex (3, 4, 6, 8 chars)
  if (/^[0-9a-fA-F]{3,4}$/.test(trimmed)) {
    return "#" + [...trimmed].map((c) => c + c).join("").toUpperCase();
  }
  if (/^[0-9a-fA-F]{6,8}$/.test(trimmed)) {
    return "#" + trimmed.toUpperCase();
  }

  return fallback;
}

/**
 * Converts ShapeFill to Konva fill props.
 */
export function fillToKonvaProps(fill: ShapeFill | null | undefined, width: number, height: number) {
  if (!fill || fill.type === "none") {
    return { fill: undefined, fillEnabled: false };
  }

  if (fill.type === "solid") {
    return {
      fill: fill.color,
      fillEnabled: true,
      ...gradientPropsNull()
    };
  }

  if (fill.type === "gradient") {
    const normalized = normalizeGradientConfig(fill.config);
    return {
      fillEnabled: true,
      fill: undefined,
      ...gradientProps(normalized, width, height)
    };
  }

  return { fill: undefined, fillEnabled: false };
}

/**
 * Returns null gradient props to clear gradient when using solid fill.
 */
function gradientPropsNull() {
  return {
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

/**
 * Konva gradient props helper (re-export from konva-props for fill system).
 */
function gradientProps(config: GradientConfig, width: number, height: number) {
  const stops = config.stops
    .slice()
    .sort((a, b) => a.offset - b.offset)
    .flatMap((stop) => [stop.offset, stop.color]);

  if (config.type === "radial") {
    return {
      fillRadialGradientStartPoint: { x: width / 2, y: height / 2 },
      fillRadialGradientEndPoint: { x: width / 2, y: height / 2 },
      fillRadialGradientStartRadius: 0,
      fillRadialGradientEndRadius: Math.max(width, height) / 2,
      fillRadialGradientColorStops: stops
    };
  }

  const angle = (Math.PI / 180) * (config.angle ?? 90);
  const halfW = width / 2;
  const halfH = height / 2;
  return {
    fillLinearGradientStartPoint: {
      x: halfW - Math.cos(angle) * halfW,
      y: halfH - Math.sin(angle) * halfH
    },
    fillLinearGradientEndPoint: {
      x: halfW + Math.cos(angle) * halfW,
      y: halfH + Math.sin(angle) * halfH
    },
    fillLinearGradientColorStops: stops
  };
}

/**
 * Generates CSS gradient string for preview.
 */
export function gradientPreview(config: GradientConfig): string {
  const normalized = normalizeGradientConfig(config);
  const stops = normalized.stops
    .map((stop) => `${stop.color} ${stop.offset * 100}%`)
    .join(", ");

  if (normalized.type === "radial") {
    return `radial-gradient(circle, ${stops})`;
  }
  return `linear-gradient(${normalized.angle}deg, ${stops})`;
}

/**
 * Extracts fill from element properties, normalizing legacy formats.
 */
export function extractFillFromElement(properties: Record<string, unknown>): ShapeFill {
  const gradient = properties.gradient as GradientConfig | null | undefined;
  const fill = properties.fill as string | undefined;

  // If gradient exists and has valid stops, use gradient
  if (gradient && gradient.stops && gradient.stops.length >= 2) {
    return { type: "gradient", config: normalizeGradientConfig(gradient) };
  }

  // If solid fill exists
  if (fill && typeof fill === "string" && fill.startsWith("#")) {
    return { type: "solid", color: normalizeHexColor(fill) };
  }

  // Default to none
  return { type: "none" };
}

/**
 * Creates a fill update payload for the editor store.
 */
export function createFillPayload(fill: ShapeFill): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (fill.type === "none") {
    payload.fill = "none";
    payload.gradient = null;
  } else if (fill.type === "solid") {
    payload.fill = fill.color;
    payload.gradient = null;
  } else if (fill.type === "gradient") {
    payload.fill = fill.config.stops[0]?.color ?? "#000000";
    payload.gradient = fill.config;
  }

  return payload;
}

/**
 * Determines if an element type supports fill.
 */
export function supportsFill(elementType: string): boolean {
  return ["rect", "circle", "line", "path", "group", "text"].includes(elementType);
}