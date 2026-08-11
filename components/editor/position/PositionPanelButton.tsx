"use client";

import { BringToFront } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { ToolbarButton } from "@/components/editor/ToolbarButton";

export function PositionPanelButton() {
  const activePanel = useEditorStore((s) => s.activePanel);
  const setActivePanel = useEditorStore((s) => s.setActivePanel);
  const active = activePanel === "position";

  return (
    <ToolbarButton
      icon={<BringToFront size={15} />}
      label="Position"
      active={active}
      onClick={() => setActivePanel(active ? "elements" : "position")}
      tooltip="Position & layers"
    />
  );
}
