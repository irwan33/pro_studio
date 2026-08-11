"use client";

import { memo } from "react";
import type Konva from "konva";
import { Ellipse, Line, Path, Rect } from "react-konva";
import { commonNodeProps, shadowProps, fillProps } from "@/lib/editor/konva-props";
import type { EditorElement, ShapeProperties } from "@/lib/editor/types";
import { extractFillFromElement } from "@/lib/editor/fill";

type Props = {
  element: EditorElement;
  onSelect: (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onDragStart: () => void;
  onDragMove: (event: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (event: Konva.KonvaEventObject<Event>) => void;
};

/**
 * Renders rect / circle / line / path elements.
 *
 * All shapes keep `x`/`y` as the top-left of the bounding box. For the ellipse
 * that means a negative offset so Konva's centre origin lines up with the
 * top-left convention used everywhere else in the editor. `rect`, `circle` and
 * `line` bake transform scale into width/height, so only `path` keeps a live
 * `scaleX`/`scaleY`.
 */
function ShapeElementBase({ element, onSelect, onDragStart, onDragMove, onDragEnd, onTransformEnd }: Props) {
  const properties = element.properties as Partial<ShapeProperties>;
  const width = element.width ?? 100;
  const height = element.height ?? 100;

  const handlers = {
    onMouseDown: onSelect,
    onTouchStart: onSelect,
    onDragStart,
    onDragMove,
    onDragEnd,
    onTransformEnd
  };

  // Extract fill from element properties using the new fill system
  const fill = extractFillFromElement(properties);

  const paint = {
    stroke: properties.strokeWidth ? properties.stroke : undefined,
    strokeWidth: properties.strokeWidth ?? 0,
    dash: properties.dash,
    ...fillProps(fill, width, height),
    ...shadowProps(properties.shadow)
  };

  /**
   * Flipping is a negative scale, which would also mirror the node around its
   * origin and move it off position. Offsetting by the box size mirrors the
   * shape in place instead.
   */
  const flip = (baseX = 1, baseY = 1) => ({
    scaleX: properties.flipX ? -baseX : baseX,
    scaleY: properties.flipY ? -baseY : baseY,
    offsetX: properties.flipX ? width : 0,
    offsetY: properties.flipY ? height : 0
  });

  if (element.type === "circle") {
    return (
      <Ellipse
        {...commonNodeProps(element)}
        {...paint}
        {...handlers}
        radiusX={width / 2}
        radiusY={height / 2}
        offsetX={-width / 2}
        offsetY={-height / 2}
      />
    );
  }

  if (element.type === "line") {
    const strokeWidth = properties.strokeWidth ?? 4;
    return (
      <Line
        {...commonNodeProps(element)}
        {...paint}
        {...handlers}
        {...flip()}
        points={properties.points ?? [0, 0, width, 0]}
        closed={properties.closed ?? false}
        lineCap="round"
        lineJoin="round"
        stroke={strokeWidth ? properties.stroke : undefined}
        strokeWidth={strokeWidth}
        hitStrokeWidth={Math.max(12, strokeWidth)}
      />
    );
  }

  if (element.type === "path") {
    return (
      <Path
        {...commonNodeProps(element)}
        {...paint}
        {...handlers}
        {...flip(element.scaleX ?? 1, element.scaleY ?? 1)}
        data={properties.data ?? ""}
      />
    );
  }

  return (
    <Rect
      {...commonNodeProps(element)}
      {...paint}
      {...handlers}
      {...flip()}
      width={width}
      height={height}
      cornerRadius={properties.cornerRadius ?? 0}
    />
  );
}

export const ShapeElement = memo(ShapeElementBase);
