"use client";

import { List } from "lucide-react";
import { ToolbarButton } from "@/components/editor/ToolbarButton";

type ListType = "none" | "bullet" | "numbered" | "checklist";

type Props = {
  value: ListType;
  onChange: (listType: ListType) => void;
};

export function ListToggleButton({ value, onChange }: Props) {
  const isBullet = value === "bullet";

  function handleClick() {
    onChange(isBullet ? "none" : "bullet");
  }

  return (
    <ToolbarButton
      icon={<List size={16} />}
      active={isBullet}
      onClick={handleClick}
      tooltip="Toggle bullet list"
    />
  );
}
