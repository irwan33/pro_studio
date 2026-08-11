"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useEditorStore } from "@/store/editorStore";
import { getStage } from "@/lib/editor/stage-registry";
import { exportStage, type ExportFormat } from "@/lib/editor/export";

const formats: Array<{ label: string; value: ExportFormat }> = [
  { label: "PNG", value: "png" },
  { label: "JPG", value: "jpg" },
  { label: "PDF", value: "pdf" },
  { label: "SVG", value: "svg" }
];

export function ExportModal({ open, onClose }: { projectId: string; open: boolean; onClose: () => void }) {
  const [format, setFormat] = useState<ExportFormat>("png");
  const [scale, setScale] = useState(1);
  const width = useEditorStore((s) => s.width);
  const height = useEditorStore((s) => s.height);
  const clearSelection = useEditorStore((s) => s.clearSelection);

  function download() {
    const stage = getStage();
    if (!stage) {
      toast.error("Canvas is not ready yet");
      return;
    }
    // Selection handles are part of the stage, so drop them before rendering.
    clearSelection();
    try {
      exportStage(stage, { width, height }, { format, pixelRatio: scale });
      onClose();
    } catch {
      toast.error("Export failed. Images from other domains can block canvas export.");
    }
  }

  const activeLabel = formats.find((item) => item.value === format)?.label ?? "PNG";

  return (
    <Modal title="Download design" open={open} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {formats.map((item) => (
            <button
              key={item.value}
              onClick={() => setFormat(item.value)}
              className={
                "border p-3 font-mono " +
                (format === item.value
                  ? "border-studio-accent bg-studio-accent/10"
                  : "border-studio-border bg-studio-elevated")
              }
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((item) => (
            <button
              key={item}
              onClick={() => setScale(item)}
              className={
                "border p-3 " +
                (scale === item ? "border-studio-accent bg-studio-accent/10" : "border-studio-border bg-studio-elevated")
              }
            >
              {item}x
            </button>
          ))}
        </div>
        <p className="font-mono text-[11px] text-studio-muted">
          {width * scale} x {height * scale} px
          {format === "svg" ? " . SVG wraps a raster image, it is not true vector output." : ""}
        </p>
        <Button variant="primary" onClick={download}>
          <Download size={16} />
          Download {activeLabel}
        </Button>
      </div>
    </Modal>
  );
}
