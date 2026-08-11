"use client";

import { memo } from "react";
import { Group } from "react-konva";
import type Konva from "konva";
import { commonNodeProps } from "@/lib/editor/konva-props";
import type { EditorElement } from "@/lib/editor/types";

type Props = {
  element: EditorElement;
  onSelect: (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onDragStart: () => void;
  onDragMove: (event: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (event: Konva.KonvaEventObject<Event>) => void;
  children: React.ReactNode;
};

/**
 * Container node for grouped elements.
 *
 * Children are positioned relative to the group origin and are rendered as
 * non-interactive by the caller, so pointer events and drags always resolve to
 * the group itself. `width`/`height` are set explicitly because a Konva `Group`
 * otherwise reports a zero-size bounding box to the transformer.
 */
function GroupElementBase({
  element,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTransformEnd,
  children
}: Props) {
  return (
    <Group
      {...commonNodeProps(element)}
      width={element.width ?? 0}
      height={element.height ?? 0}
      scaleX={element.scaleX ?? 1}
      scaleY={element.scaleY ?? 1}
      onMouseDown={onSelect}
      onTouchStart={onSelect}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
    >
      {children}
    </Group>
  );
}

export const GroupElement = memo(GroupElementBase);
