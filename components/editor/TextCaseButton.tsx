"use client";

import { ToolbarButton } from "@/components/editor/ToolbarButton";

type Props = {
  value: string;
  onChange: (transform: string) => void;
};

const transforms = ["none", "uppercase", "lowercase", "capitalize"];

export function TextCaseButton({ value, onChange }: Props) {
  const current = value && transforms.includes(value) ? value : "none";

  function handleClick() {
    const currentIndex = transforms.indexOf(current);
    const nextIndex = (currentIndex + 1) % transforms.length;
    onChange(transforms[nextIndex]);
  }

  const isActive = current !== "none";

  return (
    <ToolbarButton
      icon={<span className="font-bold tracking-tight text-sm">aA</span>}
      active={isActive}
      onClick={handleClick}
      tooltip={`Text case: ${current}`}
    />
  );
}
