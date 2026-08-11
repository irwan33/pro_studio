"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { Text } from "react-konva";
import type Konva from "konva";
import {
  applyListPrefix,
  applyTextTransform,
  commonNodeProps,
  konvaFontStyle,
  shadowProps,
  textDecoration
} from "@/lib/editor/konva-props";
import { useEditorStore } from "@/store/editorStore";
import type { EditorElement, TextProperties } from "@/lib/editor/types";

type Props = {
  element: EditorElement;
  isEditing: boolean;
  onSelect: (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onEdit: () => void;
  onDragStart: () => void;
  onDragMove: (event: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (event: Konva.KonvaEventObject<Event>) => void;
};

function TextElementBase({
  element,
  isEditing,
  onSelect,
  onEdit,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTransformEnd
}: Props) {
  const nodeRef = useRef<Konva.Text | null>(null);
  const properties = element.properties as Partial<TextProperties>;
  const textSizing = properties.textSizing ?? "fixed-width";
  const isAutoWidth = textSizing === "auto-width";

  const text = useMemo(
    () => applyListPrefix(applyTextTransform(properties.text ?? "", properties.textTransform), properties.listType),
    [properties.text, properties.textTransform, properties.listType]
  );

  const fontFamily = properties.fontFamily ?? "Inter";
  const fontSize = properties.fontSize ?? 48;
  const fontStyle = konvaFontStyle(properties.fontWeight, properties.fontStyle);
  const lineHeight = properties.lineHeight ?? 1.16;
  const letterSpacing = properties.letterSpacing ?? 0;

  /**
   * Auto-width text measures the rendered glyph box and persists it to the
   * element model so the transformer uses the real visual size rather than a
   * stale template placeholder. Only auto-width text is remeasured — wrapped
   * text keeps its configured width. The effect never moves the element.
   */
  useEffect(() => {
    if (!isAutoWidth || isEditing) return;
    const node = nodeRef.current;
    if (!node) return;

    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      // `skipStroke: true` keeps stroke rendering from inflating the measure,
      // while `skipShadow: true` excludes shadows from the bounds.
      const rect = node.getClientRect({ skipTransform: true, skipShadow: true, skipStroke: true });
      const measuredWidth = Math.ceil(rect.width);
      const measuredHeight = Math.ceil(rect.height);
      if (measuredWidth <= 0 || measuredHeight <= 0) return;

      const state = useEditorStore.getState();
      const live = state.elements.find((item) => item.id === element.id);
      if (!live) return;

      const currentWidth = Math.round(live.width ?? 0);
      const currentHeight = Math.round(live.height ?? 0);
      if (currentWidth === measuredWidth && currentHeight === measuredHeight) return;

      // Avoid a history entry when only font loading triggered a remeasure —
      // font metric recalibration is not a user-facing change.
      state.updateElement(element.id, {
        width: measuredWidth,
        height: measuredHeight
      }, { commit: false });
    };

    // Measure immediately, then again once webfonts are ready so the box
    // reflects the loaded typeface instead of the browser fallback.
    measure();
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => undefined);
    }
    return () => {
      cancelled = true;
    };
  }, [element.id, isAutoWidth, isEditing, text, fontFamily, fontSize, fontStyle, lineHeight, letterSpacing]);

  return (
    <Text
      ref={nodeRef}
      {...commonNodeProps(element)}
      text={text}
      width={isAutoWidth ? undefined : element.width}
      // Height is left undefined so Konva can auto-grow with the content.
      fontFamily={fontFamily}
      fontSize={fontSize}
      fontStyle={fontStyle}
      fill={properties.fill ?? "#ffffff"}
      align={properties.align ?? "left"}
      verticalAlign={properties.verticalAlign ?? "top"}
      lineHeight={lineHeight}
      letterSpacing={letterSpacing}
      textDecoration={textDecoration(properties)}
      stroke={properties.strokeWidth ? properties.stroke : undefined}
      strokeWidth={properties.strokeWidth ?? 0}
      fillAfterStrokeEnabled
      padding={properties.padding ?? 0}
      wrap={isAutoWidth ? "none" : "word"}
      opacity={isEditing ? 0 : element.opacity ?? 1}
      {...shadowProps(properties.shadow)}
      onMouseDown={onSelect}
      onTouchStart={onSelect}
      onDblClick={onEdit}
      onDblTap={onEdit}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
    />
  );
}

export const TextElement = memo(TextElementBase);
