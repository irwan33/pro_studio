"use client";

import { memo, useEffect, useRef } from "react";
import Konva from "konva";
import { Image as KonvaImage, Rect } from "react-konva";
import { commonNodeProps, filterValues, hasActiveFilters } from "@/lib/editor/konva-props";
import { useKonvaImage } from "@/components/editor/hooks/useKonvaImage";
import type { EditorElement, ImageProperties } from "@/lib/editor/types";

type Props = {
  element: EditorElement;
  onSelect: (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onDragStart: () => void;
  onDragMove: (event: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (event: Konva.KonvaEventObject<Event>) => void;
};

function ImageElementBase({ element, onSelect, onDragStart, onDragMove, onDragEnd, onTransformEnd }: Props) {
  const properties = element.properties as Partial<ImageProperties>;
  const { image, status } = useKonvaImage(properties.src);
  const nodeRef = useRef<Konva.Image | null>(null);

  const filters = properties.filters ?? null;
  const active = hasActiveFilters(filters);
  const values = filterValues(filters);

  // Konva needs an explicit cache() before pixel filters can run, and the cache
  // must be refreshed whenever the image, size or filter values change.
  useEffect(() => {
    const node = nodeRef.current;
    if (!node || !image) return;
    if (active) {
      node.cache();
    } else {
      node.clearCache();
    }
    node.getLayer()?.batchDraw();
  }, [image, active, element.width, element.height, values.brightness, values.contrast, values.saturation, values.hue, values.blurRadius]);

  useEffect(() => {
    const node = nodeRef.current;
    return () => {
      node?.clearCache();
    };
  }, []);

  if (status === "loading" || status === "error" || !image) {
    return (
      <Rect
        {...commonNodeProps(element)}
        width={element.width}
        height={element.height}
        fill={status === "error" ? "rgba(239,68,68,0.14)" : "rgba(148,163,184,0.16)"}
        stroke={status === "error" ? "#ef4444" : "#94a3b8"}
        strokeWidth={1}
        dash={[6, 6]}
        onMouseDown={onSelect}
        onTouchStart={onSelect}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onTransformEnd={onTransformEnd}
      />
    );
  }

  const konvaFilters = active
    ? [Konva.Filters.Brighten, Konva.Filters.Contrast, Konva.Filters.HSL, Konva.Filters.Blur]
    : undefined;

  return (
    <KonvaImage
      {...commonNodeProps(element)}
      ref={nodeRef}
      image={image}
      width={element.width}
      height={element.height}
      crop={properties.crop ?? undefined}
      scaleX={properties.flipX ? -1 : 1}
      scaleY={properties.flipY ? -1 : 1}
      offsetX={properties.flipX ? element.width ?? 0 : 0}
      offsetY={properties.flipY ? element.height ?? 0 : 0}
      filters={konvaFilters}
      brightness={values.brightness}
      contrast={values.contrast}
      saturation={values.saturation}
      hue={values.hue}
      blurRadius={values.blurRadius}
      onMouseDown={onSelect}
      onTouchStart={onSelect}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
    />
  );
}

export const ImageElement = memo(ImageElementBase);
