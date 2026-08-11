"use client";

import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";
import { ToolbarButton } from "@/components/editor/ToolbarButton";

type Alignment = "left" | "center" | "right" | "justify";

type Props = {
  value: Alignment;
  onChange: (align: Alignment) => void;
};

const alignments: Alignment[] = ["left", "center", "right", "justify"];

export function TextAlignmentButton({ value, onChange }: Props) {
  const current = value && alignments.includes(value) ? value : "left";

  function handleClick() {
    const currentIndex = alignments.indexOf(current);
    const nextIndex = (currentIndex + 1) % alignments.length;
    onChange(alignments[nextIndex]);
  }

  const Icon = current === "center" ? AlignCenter : current === "right" ? AlignRight : current === "justify" ? AlignJustify : AlignLeft;

  return (
    <ToolbarButton
      icon={<Icon size={16} />}
      onClick={handleClick}
      tooltip={`Alignment: ${current}`}
    />
  );
}
