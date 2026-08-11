"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { ArrangeTab } from "@/components/editor/position/ArrangeTab";
import { LayersTab } from "@/components/editor/position/LayersTab";
import { EDITOR_UI_ATTRIBUTE } from "@/lib/editor/focus-mode";

const tabs = ["Arrange", "Layers"] as const;
type PositionTab = (typeof tabs)[number];

export function PositionPanel() {
  const [activeTab, setActiveTab] = useState<PositionTab>("Arrange");
  const setActivePanel = useEditorStore((s) => s.setActivePanel);

  return (
    // `min-h-0` lets the scrolling body shrink inside the flex parent instead of
    // pushing the panel taller, which is what previously forced the outer
    // sidebar to grow its own scrollbar.
    <div className="mt-6 flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-studio-border bg-studio-panel pb-3">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-sm tracking-[0.18em] text-studio-secondaryText">POSITION</h2>
          <button
            type="button"
            onClick={() => setActivePanel("elements")}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-studio-secondaryText transition hover:bg-studio-elevated hover:text-studio-text"
            aria-label="Close position panel"
            title="Close"
            {...{ [EDITOR_UI_ATTRIBUTE]: "" }}
          >
            <X size={18} />
          </button>
        </div>
      </div>
      <div className="flex shrink-0 border-b border-studio-border bg-studio-panel">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={
              "relative flex-1 py-3 text-sm font-semibold transition " +
              (activeTab === tab ? "text-studio-accent" : "text-studio-secondaryText hover:text-studio-text")
            }
            aria-pressed={activeTab === tab}
          >
            {tab}
            {activeTab === tab && <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-studio-accent" />}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto py-4 scrollbar-thin">
        {activeTab === "Arrange" && <ArrangeTab />}
        {activeTab === "Layers" && <LayersTab />}
      </div>
    </div>
  );
}
