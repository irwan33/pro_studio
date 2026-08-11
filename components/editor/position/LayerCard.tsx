"use client";

import { GripVertical, Lock, EyeOff } from "lucide-react";
import type { EditorElement } from "@/lib/editor/types";
import { LayerPreview } from "@/components/editor/position/LayerPreview";

export type LayerCardProps = {
  layer: EditorElement;
  selected: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
};

export function LayerCard({ layer, selected, onSelect, onDragStart, onDragOver, onDrop }: LayerCardProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onSelect}
      className={
        "group flex items-center gap-2 rounded-2xl border p-2.5 transition cursor-pointer " +
        (selected
          ? "border-studio-accent bg-studio-accent/10"
          : "border-studio-border bg-studio-elevated hover:border-studio-accentHover")
      }
      role="button"
      aria-pressed={selected}
      aria-label={"Select " + layer.name}
    >
      <GripVertical size={16} className="cursor-grab text-studio-muted active:cursor-grabbing" aria-hidden="true" />
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-studio-border bg-white">
        <LayerPreview element={layer} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-semibold text-studio-text">{layer.name}</div>
        <div className="flex items-center gap-1.5 text-[10px] text-studio-muted">
          <span className="uppercase">{layer.type}</span>
          {layer.locked && <Lock size={10} className="text-studio-accent" />}
          {layer.visible === false && <EyeOff size={10} className="text-studio-accent" />}
        </div>
      </div>
    </div>
  );
}
