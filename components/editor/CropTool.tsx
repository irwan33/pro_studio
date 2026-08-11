"use client";

import { useState } from "react";
import { Check, X, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EDITOR_UI_ATTRIBUTE } from "@/lib/editor/focus-mode";
import { emitStudioAction } from "@/lib/editor/actions";

type CropMode = {
  active: boolean;
  imageId: string | null;
  aspectRatio: number | null;
};

export function CropTool({
  cropMode,
  onCancel,
}: {
  cropMode: CropMode;
  onCancel: () => void;
}) {
  const [aspectRatioLocked, setAspectRatioLocked] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState<string>("free");

  const aspectRatios = [
    { label: "Free", value: "free", ratio: null },
    { label: "1:1", value: "1:1", ratio: 1 },
    { label: "16:9", value: "16:9", ratio: 16 / 9 },
    { label: "4:3", value: "4:3", ratio: 4 / 3 },
    { label: "3:2", value: "3:2", ratio: 3 / 2 },
    { label: "9:16", value: "9:16", ratio: 9 / 16 },
    { label: "4:5", value: "4:5", ratio: 4 / 5 },
  ];

  function applyCrop() {
    emitStudioAction("apply-crop");
  }

  function cancelCrop() {
    emitStudioAction("cancel-crop");
    onCancel();
  }

  function setAspectRatio(ratio: number | null) {
    emitStudioAction({
      action: "set-crop-aspect-ratio",
      payload: { aspectRatio: ratio },
    });
  }

  if (!cropMode.active) return null;

  return (
    <div {...{ [EDITOR_UI_ATTRIBUTE]: "" }} className="absolute left-1/2 top-5 z-20 flex -translate-x-1/2 flex-col items-center gap-3">
      {/* Crop Controls */}
      <div className="flex items-center gap-2 rounded-[22px] border border-studio-border bg-studio-secondary px-4 py-3 shadow-lime">
        <div className="flex items-center gap-1">
          {aspectRatios.map((item) => (
            <button
              key={item.value}
              onClick={() => {
                setSelectedRatio(item.value);
                setAspectRatio(item.ratio);
                setAspectRatioLocked(item.ratio !== null);
              }}
              className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
                selectedRatio === item.value
                  ? "bg-studio-accent text-white"
                  : "text-studio-text hover:bg-studio-elevated"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mx-2 h-6 w-px bg-studio-border" />

        <button
          onClick={() => {
            const newLocked = !aspectRatioLocked;
            setAspectRatioLocked(newLocked);
            if (!newLocked) {
              setSelectedRatio("free");
              setAspectRatio(null);
            }
          }}
          className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold transition hover:bg-studio-elevated"
          title={aspectRatioLocked ? "Unlock aspect ratio" : "Lock aspect ratio"}
        >
          {aspectRatioLocked ? <Lock size={16} /> : <Unlock size={16} />}
          <span className="text-studio-muted">Ratio</span>
        </button>

        <div className="mx-2 h-6 w-px bg-studio-border" />

        <Button
          size="sm"
          variant="ghost"
          onClick={cancelCrop}
          className="text-studio-muted hover:text-studio-text"
        >
          <X size={16} />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={applyCrop}
          className="bg-studio-accent text-white hover:bg-studio-accent/90"
        >
          <Check size={16} />
          Apply Crop
        </Button>
      </div>

      {/* Instructions */}
      <div className="rounded-2xl border border-studio-border bg-studio-secondary/95 px-4 py-2 text-xs text-studio-muted backdrop-blur-sm">
        Drag the corners to adjust crop area • Press Enter to apply • Press Esc to cancel
      </div>
    </div>
  );
}
