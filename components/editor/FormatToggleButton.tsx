"use client";

import { useEffect } from "react";
import { Bold, Italic, Strikethrough, Underline } from "lucide-react";
import { ToolbarButton } from "@/components/editor/ToolbarButton";

type FormatType = "bold" | "italic" | "underline" | "strikethrough";

type Props = {
  type: FormatType;
  active: boolean;
  onChange: (active: boolean) => void;
  disabled?: boolean;
};

export function FormatToggleButton({ type, active, onChange, disabled = false }: Props) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        if (type === "bold" && e.key.toLowerCase() === "b") {
          e.preventDefault();
          onChange(!active);
        } else if (type === "italic" && e.key.toLowerCase() === "i") {
          e.preventDefault();
          onChange(!active);
        } else if (type === "underline" && e.key.toLowerCase() === "u") {
          e.preventDefault();
          onChange(!active);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [type, active, onChange]);

  const config = {
    bold: { icon: <Bold size={16} />, label: "Bold", tooltip: "Bold (Ctrl+B)" },
    italic: { icon: <Italic size={16} />, label: "Italic", tooltip: "Italic (Ctrl+I)" },
    underline: { icon: <Underline size={16} />, label: "Underline", tooltip: "Underline (Ctrl+U)" },
    strikethrough: { icon: <Strikethrough size={16} />, label: "Strikethrough", tooltip: "Strikethrough" }
  }[type];

  return (
    <ToolbarButton
      icon={config.icon}
      active={active}
      onClick={() => onChange(!active)}
      tooltip={config.tooltip}
      disabled={disabled}
    />
  );
}
