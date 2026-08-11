"use client";

import type { AlignmentLine } from "@/lib/editor/alignment";

export function AlignmentGuides({
  lines,
  zoom,
}: {
  lines: AlignmentLine[];
  zoom: number;
}) {
  if (lines.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute left-0 top-0"
      style={{
        width: "100%",
        height: "100%",
        zIndex: 1000,
      }}
    >
      {lines.map((line, index) => (
        <line
          key={index}
          x1={line.x1 * zoom}
          y1={line.y1 * zoom}
          x2={line.x2 * zoom}
          y2={line.y2 * zoom}
          stroke="#ff00ff"
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.8}
        />
      ))}
    </svg>
  );
}
