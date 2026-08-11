"use client";

import { memo, useCallback } from "react";
import type Konva from "konva";
import { TextElement } from "@/components/editor/elements/TextElement";
import { ImageElement } from "@/components/editor/elements/ImageElement";
import { ShapeElement } from "@/components/editor/elements/ShapeElement";
import { GroupElement } from "@/components/editor/elements/GroupElement";
import type { EditorElement } from "@/lib/editor/types";

export type ElementHandlers = {
  onSelect: (element: EditorElement, event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onEditText: (element: EditorElement) => void;
  onDragStart: (element: EditorElement) => void;
  onDragMove: (element: EditorElement, event: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd: (element: EditorElement, event: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (element: EditorElement, event: Konva.KonvaEventObject<Event>) => void;
};

type Props = {
  element: EditorElement;
  editingId: string | null;
  handlers: ElementHandlers;
};

/**
 * Single dispatch point from the serializable element model to Konva nodes.
 * Groups render their children with `locked: true` so only the group itself is
 * draggable; pointer events on a child bubble up to the group.
 */
function ElementNodeBase({ element, editingId, handlers }: Props) {
  const onSelect = useCallback(
    (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => handlers.onSelect(element, event),
    [element, handlers]
  );
  const onEdit = useCallback(() => handlers.onEditText(element), [element, handlers]);
  const onDragStart = useCallback(() => handlers.onDragStart(element), [element, handlers]);
  const onDragMove = useCallback(
    (event: Konva.KonvaEventObject<DragEvent>) => handlers.onDragMove(element, event),
    [element, handlers]
  );
  const onDragEnd = useCallback(
    (event: Konva.KonvaEventObject<DragEvent>) => handlers.onDragEnd(element, event),
    [element, handlers]
  );
  const onTransformEnd = useCallback(
    (event: Konva.KonvaEventObject<Event>) => handlers.onTransformEnd(element, event),
    [element, handlers]
  );

  const shared = { onSelect, onDragStart, onDragMove, onDragEnd, onTransformEnd };

  if (element.type === "group") {
    return (
      <GroupElement element={element} {...shared}>
        {(element.children ?? []).map((child) => (
          <ElementNode
            key={child.id}
            element={{ ...child, locked: true }}
            editingId={editingId}
            handlers={handlers}
          />
        ))}
      </GroupElement>
    );
  }

  if (element.type === "text") {
    return <TextElement element={element} isEditing={editingId === element.id} onEdit={onEdit} {...shared} />;
  }

  if (element.type === "image") {
    return <ImageElement element={element} {...shared} />;
  }

  return <ShapeElement element={element} {...shared} />;
}

export const ElementNode = memo(ElementNodeBase);
