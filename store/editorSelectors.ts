"use client";

import { useMemo } from "react";
import { useEditorStore } from "@/store/editorStore";
import type { EditorElement, EditorElementProperties } from "@/lib/editor/types";

/**
 * Derived selection helpers.
 *
 * Selectors return primitives or memoised values so components do not re-render
 * on every unrelated store update. The selected element type is always derived
 * from the selected element instead of being tracked as separate state.
 */

export function useSelectedElements(): EditorElement[] {
  const elements = useEditorStore((s) => s.elements);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  return useMemo(
    () => elements.filter((element) => selectedIds.includes(element.id)),
    [elements, selectedIds]
  );
}

export function useSelectedElement(): EditorElement | null {
  const selected = useSelectedElements();
  return selected[0] ?? null;
}

/** Properties of the first selected element, or an empty object when none. */
export function useSelectedProperties(): EditorElementProperties {
  const selected = useSelectedElement();
  return selected?.properties ?? {};
}

export function useOrderedLayers(): EditorElement[] {
  const elements = useEditorStore((s) => s.elements);
  return useMemo(() => elements.slice().sort((a, b) => a.zIndex - b.zIndex), [elements]);
}
