"use client";

import { useMemo, useState } from "react";
import { Copy, Eye, EyeOff, GripVertical, Image, Lock, Square, Trash2, Type, Unlock } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { emitLayerAction, emitStudioAction } from "@/lib/editor/actions";
import { EDITOR_UI_ATTRIBUTE } from "@/lib/editor/focus-mode";

export function LayersPanel() {
  const elements = useEditorStore((s) => s.elements);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  // Layer panels list top-most first, the model stores bottom-most first.
  const layers = useMemo(
    () => elements.slice().sort((a, b) => b.zIndex - a.zIndex),
    [elements]
  );

  function reorder(sourceId: string | null, targetId: string) {
    if (!sourceId || sourceId === targetId) return;
    emitLayerAction({ action: "reorder", objectId: sourceId, targetObjectId: targetId });
  }

  return (
    <aside {...{ [EDITOR_UI_ATTRIBUTE]: "" }} className="mt-16 mb-3 ml-3 h-[calc(100%-5rem)] self-start overflow-y-auto rounded-[28px] border border-studio-border bg-studio-panel shadow-[0_4px_20px_rgba(0,0,0,0.08)] scrollbar-thin max-lg:hidden">
      <div className="flex h-14 items-center justify-center border-b border-studio-border font-semibold">Layers</div>
      <div className="border-t border-studio-border p-4">
        {layers.map((layer) => {
          const id = layer.id;
          const active = selectedIds.includes(id);
          const isDragging = draggedId === id;
          const isDropTarget = dropTargetId === id && draggedId !== id;
          const Icon = layer.type === "text" ? Type : layer.type === "image" ? Image : Square;
          return (
            <div
              key={id}
              data-layer-id={id}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData("application/x-pro-studio-layer", id);
                event.dataTransfer.effectAllowed = "move";
                setDraggedId(id);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setDropTargetId(id);
              }}
              onDragLeave={() => setDropTargetId((current) => (current === id ? null : current))}
              onDrop={(event) => {
                event.preventDefault();
                const sourceId = event.dataTransfer.getData("application/x-pro-studio-layer") || draggedId;
                reorder(sourceId, id);
                setDraggedId(null);
                setDropTargetId(null);
              }}
              onDragEnd={() => {
                setDraggedId(null);
                setDropTargetId(null);
              }}
              className={
                "mb-2 flex items-center gap-2 rounded-2xl border p-3 transition " +
                (active ? "border-studio-accent bg-studio-accent text-white " : "border-transparent bg-transparent hover:bg-studio-elevated ") +
                (isDropTarget ? "translate-y-1 border-studio-accent bg-studio-accentHover " : "") +
                (isDragging ? "opacity-45 " : "")
              }
            >
              <GripVertical size={16} className="cursor-grab text-studio-muted active:cursor-grabbing" aria-hidden="true" />
              <button aria-label="Toggle visibility" onClick={() => emitLayerAction({ action: "toggle-visibility", objectId: id })}>{layer.visible === false ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => emitLayerAction({ action: "select", objectId: id })}>
                <Icon size={16} />
                <input
                  className="min-w-0 flex-1 bg-transparent font-mono text-sm font-semibold outline-none"
                  defaultValue={layer.name}
                  onClick={(event) => event.stopPropagation()}
                  onBlur={(event) => emitLayerAction({ action: "rename", objectId: id, name: event.target.value })}
                />
              </button>
              <button aria-label="Toggle lock" onClick={() => emitLayerAction({ action: "toggle-lock", objectId: id })}>{layer.locked ? <Lock size={15} /> : <Unlock size={15} className="text-studio-muted" />}</button>
              <button aria-label="Duplicate layer" onClick={() => { emitLayerAction({ action: "select", objectId: id }); emitStudioAction("duplicate"); }}><Copy size={15} className="text-studio-muted" /></button>
              <button aria-label="Delete layer" onClick={() => emitLayerAction({ action: "delete", objectId: id })}><Trash2 size={15} className="text-studio-muted" /></button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
