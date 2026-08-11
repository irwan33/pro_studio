import type Konva from "konva";

/**
 * The Konva stage lives inside the canvas component, but the header and the
 * export modal need it too. Instead of storing the node in the Zustand store
 * (it is not serializable) we keep a tiny module-level registry.
 */
let stage: Konva.Stage | null = null;

export function registerStage(instance: Konva.Stage | null) {
  stage = instance;
}

export function getStage() {
  return stage;
}
