"use client";

import { useMemo, useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { LayerCard } from "@/components/editor/position/LayerCard";
import { getElementBox } from "@/lib/editor/coordinates";

const subTabs = ["All", "Overlapping"] as const;
type LayersSubTab = (typeof subTabs)[number];

function intersects(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function LayersTab() {
  const [subTab, setSubTab] = useState<LayersSubTab>("All");
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const elements = useEditorStore((s) => s.elements);
  const reorder = useEditorStore((s) => s.reorder);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const selectedId = selectedIds[0] ?? null;
  const selectedElement = useMemo(
    () => elements.find((element) => element.id === selectedId) ?? null,
    [elements, selectedId]
  );

  const visualLayers = useMemo(() => elements.slice().sort((a, b) => b.zIndex - a.zIndex), [elements]);

  const filteredLayers = useMemo(() => {
    if (subTab === "All") return visualLayers;
    if (!selectedElement) return visualLayers;
    const box = getElementBox(selectedElement);
    return visualLayers.filter(
      (element) => element.id !== selectedElement.id && intersects(box, getElementBox(element))
    );
  }, [visualLayers, subTab, selectedElement]);

  function handleDragStart(id: string) {
    setDraggedId(id);
  }

  function handleDragOver(event: React.DragEvent, id: string) {
    event.preventDefault();
    if (id === draggedId) return;
  }

  function handleDrop(event: React.DragEvent, targetId: string) {
    event.preventDefault();
    const sourceId = draggedId ?? event.dataTransfer.getData("application/x-pro-studio-layer");
    if (!sourceId || sourceId === targetId) return;
    reorder(sourceId, targetId);
    setDraggedId(null);
  }

  function selectLayer(id: string) {
    setSelectedIds([id]);
  }

  return (
    <div className="space-y-4">
      <div className="flex border-b border-studio-border">
        {subTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setSubTab(tab)}
            className={
              "relative flex-1 py-2 text-xs font-semibold transition " +
              (subTab === tab ? "text-studio-accent" : "text-studio-secondaryText hover:text-studio-text")
            }
            aria-pressed={subTab === tab}
          >
            {tab}
            {subTab === tab && <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-studio-accent" />}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filteredLayers.length === 0 && (
          <p className="text-sm text-studio-secondaryText">
            {subTab === "Overlapping" ? "No overlapping elements." : "No layers to display."}
          </p>
        )}
        {filteredLayers.map((layer) => (
          <LayerCard
            key={layer.id}
            layer={layer}
            selected={selectedId === layer.id}
            onSelect={() => selectLayer(layer.id)}
            onDragStart={() => handleDragStart(layer.id)}
            onDragOver={(event) => handleDragOver(event, layer.id)}
            onDrop={(event) => handleDrop(event, layer.id)}
          />
        ))}
      </div>
    </div>
  );
}
