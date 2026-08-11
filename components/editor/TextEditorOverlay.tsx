"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { applyListPrefix, applyTextTransform, konvaFontStyle, textDecoration } from "@/lib/editor/konva-props";
import type { EditorElement, TextProperties } from "@/lib/editor/types";

/**
 * Konva has no editable text node, so double-clicking a text element shows a
 * DOM textarea positioned exactly over the Konva node. The Konva text is hidden
 * while editing (opacity 0) so the two never render on top of each other.
 */
export function TextEditorOverlay({
  element,
  zoom,
  onChange,
  onClose
}: {
  element: EditorElement;
  zoom: number;
  onChange: (text: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const properties = element.properties as Partial<TextProperties>;

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.focus();
    node.setSelectionRange(node.value.length, node.value.length);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const fontSize = properties.fontSize ?? 48;
  const displayText = applyListPrefix(
    applyTextTransform(properties.text ?? "", properties.textTransform),
    properties.listType
  );

  return (
    <textarea
      ref={ref}
      aria-label={"Edit " + element.name}
      value={properties.text ?? ""}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onClose}
      spellCheck={false}
      className="absolute resize-none overflow-hidden border-0 bg-transparent p-0 outline-none"
      style={{
        left: element.x * zoom,
        top: element.y * zoom,
        width: (element.width ?? 200) * zoom,
        minHeight: fontSize * (properties.lineHeight ?? 1.16) * zoom,
        transform: "rotate(" + (element.rotation ?? 0) + "deg)",
        transformOrigin: "top left",
        fontFamily: properties.fontFamily ?? "Inter",
        fontSize: fontSize * zoom,
        fontWeight: konvaFontStyle(properties.fontWeight, properties.fontStyle).includes("bold") ? 700 : 400,
        fontStyle: properties.fontStyle === "italic" ? "italic" : "normal",
        color: properties.fill ?? "#ffffff",
        textAlign: (properties.align ?? "left") as "left" | "center" | "right" | "justify",
        lineHeight: String(properties.lineHeight ?? 1.16),
        letterSpacing: (properties.letterSpacing ?? 0) * zoom + "px",
        textDecoration: textDecoration(properties),
        caretColor: properties.fill ?? "#ffffff"
      }}
      data-display-text={displayText}
    />
  );
}
