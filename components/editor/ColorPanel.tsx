"use client";

import { useMemo } from "react";
import { Palette, Grip } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { useSelectedElement } from "@/store/editorSelectors";
import { emitStudioAction } from "@/lib/editor/actions";
import { isShapeElement, type GradientConfig } from "@/lib/editor/types";
import { ShapeColors } from "@/components/editor/fill/ShapeColors";

const defaultSolidColors = [
  "#000000", "#1C1C1E", "#3A3A3C", "#636366", "#AEAEB2",
  "#D1D1D6", "#F2F2F7", "#FFFFFF",
  "#FF3B30", "#FF2D55", "#AF52DE", "#5856D6",
  "#007AFF", "#5AC8FA", "#34C759", "#30D158",
  "#A8E63C", "#CCED00", "#FFCC00", "#FF9500"
];

const defaultGradients: Array<{ name: string; config: GradientConfig }> = [
  { name: "Black to Gray", config: { type: "linear", angle: 90, stops: [{ color: "#000000", offset: 0 }, { color: "#8E8E93", offset: 1 }] } },
  { name: "Black to White", config: { type: "linear", angle: 90, stops: [{ color: "#000000", offset: 0 }, { color: "#FFFFFF", offset: 1 }] } },
  { name: "White to Gray", config: { type: "linear", angle: 90, stops: [{ color: "#FFFFFF", offset: 0 }, { color: "#8E8E93", offset: 1 }] } },
  { name: "Green", config: { type: "linear", angle: 135, stops: [{ color: "#34C759", offset: 0 }, { color: "#30D158", offset: 1 }] } },
  { name: "Gold", config: { type: "linear", angle: 135, stops: [{ color: "#FFCC00", offset: 0 }, { color: "#FF9500", offset: 1 }] } },
  { name: "Purple to Yellow", config: { type: "linear", angle: 135, stops: [{ color: "#AF52DE", offset: 0 }, { color: "#FFCC00", offset: 1 }] } },
  { name: "Navy", config: { type: "linear", angle: 135, stops: [{ color: "#001F3F", offset: 0 }, { color: "#007AFF", offset: 1 }] } },
  { name: "Cyan", config: { type: "linear", angle: 135, stops: [{ color: "#5AC8FA", offset: 0 }, { color: "#30D158", offset: 1 }] } },
  { name: "Red to Orange", config: { type: "linear", angle: 135, stops: [{ color: "#FF3B30", offset: 0 }, { color: "#FF9500", offset: 1 }] } },
  { name: "Purple to Pink", config: { type: "linear", angle: 135, stops: [{ color: "#AF52DE", offset: 0 }, { color: "#FF2D55", offset: 1 }] } },
  { name: "Blue to Purple", config: { type: "linear", angle: 135, stops: [{ color: "#007AFF", offset: 0 }, { color: "#5856D6", offset: 1 }] } },
  { name: "Blue to Cyan", config: { type: "linear", angle: 135, stops: [{ color: "#007AFF", offset: 0 }, { color: "#5AC8FA", offset: 1 }] } },
  { name: "Green to Blue", config: { type: "linear", angle: 135, stops: [{ color: "#34C759", offset: 0 }, { color: "#007AFF", offset: 1 }] } },
  { name: "Green to Yellow", config: { type: "linear", angle: 135, stops: [{ color: "#34C759", offset: 0 }, { color: "#FFCC00", offset: 1 }] } },
  { name: "Cyan to Yellow", config: { type: "linear", angle: 135, stops: [{ color: "#5AC8FA", offset: 0 }, { color: "#FFCC00", offset: 1 }] } },
  { name: "Orange", config: { type: "linear", angle: 135, stops: [{ color: "#FF9500", offset: 0 }, { color: "#FF3B30", offset: 1 }] } },
  { name: "Pink to Orange", config: { type: "linear", angle: 135, stops: [{ color: "#FF2D55", offset: 0 }, { color: "#FF9500", offset: 1 }] } },
  { name: "Cream to Pink", config: { type: "linear", angle: 135, stops: [{ color: "#F5E6D3", offset: 0 }, { color: "#FF2D55", offset: 1 }] } },
  { name: "Purple to Orange", config: { type: "linear", angle: 135, stops: [{ color: "#AF52DE", offset: 0 }, { color: "#FF9500", offset: 1 }] } }
];

function PanelTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-studio-text">{children}</h3>;
}

function gradientPreview(config: GradientConfig) {
  const stops = config.stops.map((stop) => stop.color + " " + stop.offset * 100 + "%").join(", ");
  return config.type === "linear"
    ? "linear-gradient(" + config.angle + "deg, " + stops + ")"
    : "radial-gradient(circle, " + stops + ")";
}

function ColorSwatch({ color, current, onApply }: { color: string; current: string; onApply: (color: string) => void }) {
  const active = current.toLowerCase() === color.toLowerCase();
  return (
    <button
      type="button"
      onClick={() => onApply(color)}
      title={color}
      aria-label={"Apply " + color}
      aria-pressed={active}
      className={`h-8 w-8 rounded-full border transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] ${
        active
          ? "ring-2 ring-[#7C3AED] ring-offset-1 border-transparent"
          : "border-[#E5E7EB]"
      }`}
      style={{ backgroundColor: color }}
    />
  );
}

export function ColorPanel() {
  const target = useEditorStore((s) => s.colorPanelTarget);
  const setActivePanel = useEditorStore((s) => s.setActivePanel);
  const elements = useEditorStore((s) => s.elements);
  const selected = useSelectedElement();

  const isText = selected?.type === "text";
  const title = target === "stroke" ? "BORDER" : isText ? "TEXT COLORS" : "FILL COLOR";
  const fallback = target === "stroke" ? "#F5F5F2" : isText ? "#F5F5F2" : "#C7FF00";
  const raw = selected?.properties[target];
  const current = typeof raw === "string" && raw.startsWith("#") ? raw : fallback;

  const documentColors = useMemo(() => {
    const colors: string[] = [];
    const seen = new Set<string>();
    for (const element of elements) {
      for (const key of ["fill", "stroke"] as const) {
        const value = element.properties[key];
        if (typeof value !== "string" || !value.startsWith("#")) continue;
        const hex = value.toLowerCase();
        if (seen.has(hex)) continue;
        seen.add(hex);
        colors.push(value);
      }
    }
    return colors.slice(0, 18);
  }, [elements]);

  function apply(color: string) {
    if (!selected) return;
    const properties: Record<string, unknown> = { [target]: color };
    if (target === "stroke" && !Number(selected.properties.strokeWidth ?? 0)) {
      properties.strokeWidth = 2;
    }
    if (target === "fill") properties.gradient = null;
    emitStudioAction({ action: "update-active", payload: { properties } });
  }

  function applyGradient(config: GradientConfig) {
    if (!selected) return;
    emitStudioAction({ action: "update-active", payload: { properties: { gradient: config } } });
  }

  if (!selected) {
    return (
      <div className="mt-6 space-y-3">
        <PanelTitle>COLOUR</PanelTitle>
        <p className="text-sm text-studio-secondaryText">
          Select a shape or text element on the canvas to edit its colour here.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {selected && target === "fill" && <ShapeColors />}

      <section className="space-y-3">
        <PanelTitle>{title}</PanelTitle>
        <div className="flex items-center gap-2">
          <input
            type="color"
            aria-label="Custom colour"
            value={current}
            onChange={(event) => apply(event.target.value)}
            className="h-10 w-10 shrink-0 cursor-pointer rounded-xl border border-studio-border bg-transparent p-0.5"
          />
          <input
            type="text"
            aria-label="Hex colour"
            value={current}
            onChange={(event) => apply(event.target.value)}
            className="h-10 flex-1 rounded-xl border border-studio-border bg-studio-input px-3 font-mono text-xs uppercase text-studio-text outline-none focus:border-studio-accent"
          />
        </div>
      </section>

      {documentColors.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette size={18} className="text-studio-secondaryText" />
              <PanelTitle>Document colours</PanelTitle>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {documentColors.map((color) => (
              <ColorSwatch key={color} color={color} current={current} onApply={apply} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette size={18} className="text-studio-secondaryText" />
            <PanelTitle>Default solid colors</PanelTitle>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {defaultSolidColors.map((color) => (
            <ColorSwatch key={color} color={color} current={current} onApply={apply} />
          ))}
        </div>
      </section>

      {selected && isShapeElement(selected) && target === "fill" && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Grip size={18} className="text-studio-secondaryText" />
              <PanelTitle>Default gradient colors</PanelTitle>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {defaultGradients.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyGradient(preset.config)}
                title={preset.name}
                aria-label={"Apply " + preset.name}
                className="h-10 w-10 rounded-full border border-[#E5E7EB] transition hover:scale-105 focus-visible:ring-2 focus-visible:ring-[#7C3AED]"
                style={{ background: gradientPreview(preset.config) }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setActivePanel("gradients")}
            className="w-full rounded-2xl border border-studio-border bg-studio-elevated px-4 py-2 text-sm font-semibold text-studio-text transition hover:bg-studio-accentHover"
          >
            See all
          </button>
        </section>
      )}
    </div>
  );
}
