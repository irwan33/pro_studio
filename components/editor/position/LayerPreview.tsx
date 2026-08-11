"use client";

import { Image as ImageIcon, Square, Shapes, Circle } from "lucide-react";
import type { EditorElement } from "@/lib/editor/types";

export function LayerPreview({ element }: { element: EditorElement }) {
  if (element.type === "text") {
    const text = typeof element.properties.text === "string" ? element.properties.text : "T";
    const fontFamily = String(element.properties.fontFamily ?? "Inter");
    return (
      <span
        className="line-clamp-2 max-w-full text-center text-[10px] leading-none text-studio-text"
        style={{ fontFamily }}
      >
        {text.slice(0, 20)}
      </span>
    );
  }

  if (element.type === "image") {
    const src = typeof element.properties.src === "string" ? element.properties.src : "";
    if (!src) return <ImageIcon size={16} className="text-studio-muted" />;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={element.name} className="h-full w-full object-cover" />
    );
  }

  if (element.type === "group") {
    return <Shapes size={16} className="text-studio-muted" />;
  }

  if (element.type === "circle") {
    return <Circle size={16} className="text-studio-accent" />;
  }

  return <Square size={16} className="text-studio-accent" />;
}
