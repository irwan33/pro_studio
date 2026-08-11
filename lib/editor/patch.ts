import { clampSize } from "@/lib/editor/coordinates";
import type { EditorElement } from "@/lib/editor/types";

export type ElementPatch = Partial<Omit<EditorElement, "properties">> & {
  properties?: Record<string, unknown>;
};

/** Top-level element fields a panel is allowed to set. */
const TOP_LEVEL = [
  "x",
  "y",
  "width",
  "height",
  "rotation",
  "scaleX",
  "scaleY",
  "opacity",
  "visible",
  "locked",
  "name"
] as const;

type TopLevelKey = (typeof TOP_LEVEL)[number];

const NUMERIC = new Set<TopLevelKey>([
  "x",
  "y",
  "width",
  "height",
  "rotation",
  "scaleX",
  "scaleY",
  "opacity"
]);

export type ElementUpdatePayload = Partial<Record<TopLevelKey, unknown>> & {
  properties?: Record<string, unknown>;
};

/**
 * Normalises a panel payload into a store patch.
 *
 * Panels speak the editor element model directly: geometry lives at the top
 * level and everything type-specific (`fill`, `fontSize`, `cornerRadius`, ...)
 * lives under `properties`. This only coerces numbers, clamps sizes and drops
 * unknown top-level keys so a stray field cannot corrupt an element.
 */
export function toElementPatch(payload: ElementUpdatePayload): ElementPatch {
  const patch: ElementPatch = {};

  for (const key of TOP_LEVEL) {
    const value = payload[key];
    if (value === undefined) continue;
    if (NUMERIC.has(key)) {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) continue;
      if (key === "width" || key === "height") {
        (patch as Record<string, unknown>)[key] = clampSize(parsed);
      } else if (key === "opacity") {
        patch.opacity = Math.min(1, Math.max(0, parsed));
      } else {
        (patch as Record<string, unknown>)[key] = parsed;
      }
      continue;
    }
    if (key === "visible" || key === "locked") {
      (patch as Record<string, unknown>)[key] = Boolean(value);
      continue;
    }
    if (key === "name" && typeof value === "string") patch.name = value;
  }

  if (payload.properties && Object.keys(payload.properties).length > 0) {
    patch.properties = { ...payload.properties };
  }

  return patch;
}
