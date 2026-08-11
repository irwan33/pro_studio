"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { emitStudioAction } from "@/lib/editor/actions";

export type GradientType = "linear" | "radial";

export type ColorStop = {
  color: string;
  offset: number;
};

export type GradientConfig = {
  type: GradientType;
  angle: number;
  stops: ColorStop[];
};

/** Shared with the Color panel, which links into this picker. */
export const gradientPresets: Array<{ name: string; config: GradientConfig }> = [
  {
    name: "Sunset",
    config: {
      type: "linear",
      angle: 135,
      stops: [
        { color: "#ff6b6b", offset: 0 },
        { color: "#feca57", offset: 0.5 },
        { color: "#ff9ff3", offset: 1 },
      ],
    },
  },
  {
    name: "Ocean",
    config: {
      type: "linear",
      angle: 180,
      stops: [
        { color: "#00d2ff", offset: 0 },
        { color: "#3a7bd5", offset: 1 },
      ],
    },
  },
  {
    name: "Purple Haze",
    config: {
      type: "linear",
      angle: 45,
      stops: [
        { color: "#667eea", offset: 0 },
        { color: "#764ba2", offset: 1 },
      ],
    },
  },
  {
    name: "Green Energy",
    config: {
      type: "linear",
      angle: 90,
      stops: [
        { color: "#56ab2f", offset: 0 },
        { color: "#a8e063", offset: 1 },
      ],
    },
  },
  {
    name: "Fire",
    config: {
      type: "radial",
      angle: 0,
      stops: [
        { color: "#ff0000", offset: 0 },
        { color: "#ff7700", offset: 0.5 },
        { color: "#ffaa00", offset: 1 },
      ],
    },
  },
  {
    name: "Cool Blue",
    config: {
      type: "linear",
      angle: 270,
      stops: [
        { color: "#2193b0", offset: 0 },
        { color: "#6dd5ed", offset: 1 },
      ],
    },
  },
  {
    name: "Peach",
    config: {
      type: "linear",
      angle: 135,
      stops: [
        { color: "#ed4264", offset: 0 },
        { color: "#ffedbc", offset: 1 },
      ],
    },
  },
  {
    name: "Emerald",
    config: {
      type: "radial",
      angle: 0,
      stops: [
        { color: "#348f50", offset: 0 },
        { color: "#56b4d3", offset: 1 },
      ],
    },
  },
  {
    name: "Bloody Mary",
    config: {
      type: "linear",
      angle: 45,
      stops: [
        { color: "#ff512f", offset: 0 },
        { color: "#dd2476", offset: 1 },
      ],
    },
  },
  {
    name: "Lemon Twist",
    config: {
      type: "linear",
      angle: 90,
      stops: [
        { color: "#fdbb2d", offset: 0 },
        { color: "#22c1c3", offset: 1 },
      ],
    },
  },
];

export function GradientPicker() {
  const [gradientType, setGradientType] = useState<GradientType>("linear");
  const [angle, setAngle] = useState(90);
  const [colorStops, setColorStops] = useState<ColorStop[]>([
    { color: "#C7FF00", offset: 0 },
    { color: "#151515", offset: 1 },
  ]);

  function addColorStop() {
    if (colorStops.length >= 5) return; // Max 5 stops
    const newStop: ColorStop = {
      color: "#ffffff",
      offset: 0.5,
    };
    setColorStops([...colorStops, newStop].sort((a, b) => a.offset - b.offset));
  }

  function removeColorStop(index: number) {
    if (colorStops.length <= 2) return; // Min 2 stops
    setColorStops(colorStops.filter((_, i) => i !== index));
  }

  function updateColorStop(index: number, updates: Partial<ColorStop>) {
    const updated = [...colorStops];
    updated[index] = { ...updated[index], ...updates };
    setColorStops(updated.sort((a, b) => a.offset - b.offset));
  }

  function applyGradient() {
    emitStudioAction({
      action: "apply-gradient",
      payload: {
        type: gradientType,
        angle,
        stops: colorStops,
      },
    });
  }

  function applyPreset(preset: { name: string; config: GradientConfig }) {
    setGradientType(preset.config.type);
    setAngle(preset.config.angle);
    setColorStops(preset.config.stops);
    emitStudioAction({
      action: "apply-gradient",
      payload: preset.config,
    });
  }

  function removeSolidFill() {
    emitStudioAction({
      action: "remove-gradient",
      payload: {},
    });
  }

  // Generate gradient preview
  const gradientPreview =
    gradientType === "linear"
      ? `linear-gradient(${angle}deg, ${colorStops.map((stop) => `${stop.color} ${stop.offset * 100}%`).join(", ")})`
      : `radial-gradient(circle, ${colorStops.map((stop) => `${stop.color} ${stop.offset * 100}%`).join(", ")})`;

  return (
    <div className="mt-6 space-y-6">
      {/* Gradient Presets */}
      <section className="space-y-3">
        <h3 className="font-mono text-sm tracking-[0.18em] text-studio-secondaryText">GRADIENT PRESETS</h3>
        <div className="grid grid-cols-2 gap-2">
          {gradientPresets.map((preset) => {
            const previewGradient =
              preset.config.type === "linear"
                ? `linear-gradient(${preset.config.angle}deg, ${preset.config.stops.map((s) => `${s.color} ${s.offset * 100}%`).join(", ")})`
                : `radial-gradient(circle, ${preset.config.stops.map((s) => `${s.color} ${s.offset * 100}%`).join(", ")})`;
            
            return (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className="group relative overflow-hidden rounded-2xl border border-studio-border bg-studio-elevated text-left transition hover:border-studio-accent"
              >
                <div
                  className="h-20 w-full"
                  style={{ background: previewGradient }}
                />
                <div className="border-t border-studio-border px-3 py-2">
                  <span className="block text-xs font-semibold">{preset.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Gradient Type */}
      <section className="space-y-3">
        <h3 className="font-mono text-sm tracking-[0.18em] text-studio-secondaryText">GRADIENT TYPE</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setGradientType("linear")}
            className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
              gradientType === "linear"
                ? "border-studio-accent bg-studio-accent text-white"
                : "border-studio-border bg-studio-elevated hover:bg-studio-accentHover"
            }`}
          >
            Linear
          </button>
          <button
            onClick={() => setGradientType("radial")}
            className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
              gradientType === "radial"
                ? "border-studio-accent bg-studio-accent text-white"
                : "border-studio-border bg-studio-elevated hover:bg-studio-accentHover"
            }`}
          >
            Radial
          </button>
        </div>
      </section>

      {/* Angle (for linear gradient) */}
      {gradientType === "linear" && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-sm tracking-[0.18em] text-studio-secondaryText">ANGLE</h3>
            <span className="font-mono text-sm text-studio-text">{angle}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            step="1"
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            className="w-full accent-studio-accent"
          />
        </section>
      )}

      {/* Color Stops */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-sm tracking-[0.18em] text-studio-secondaryText">COLOR STOPS</h3>
          <button
            onClick={addColorStop}
            disabled={colorStops.length >= 5}
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-studio-accent text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={14} />
          </button>
        </div>
        
        <div className="space-y-2">
          {colorStops.map((stop, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="color"
                value={stop.color}
                onChange={(e) => updateColorStop(index, { color: e.target.value })}
                className="h-10 w-14 rounded-xl border border-studio-border bg-transparent cursor-pointer"
              />
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={stop.offset * 100}
                onChange={(e) => updateColorStop(index, { offset: Number(e.target.value) / 100 })}
                className="flex-1 accent-studio-accent"
              />
              <span className="w-10 text-right font-mono text-xs text-studio-muted">
                {Math.round(stop.offset * 100)}%
              </span>
              <button
                onClick={() => removeColorStop(index)}
                disabled={colorStops.length <= 2}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-studio-border bg-studio-elevated disabled:opacity-40 disabled:cursor-not-allowed hover:bg-studio-accentHover"
              >
                <Minus size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Preview */}
      <section className="space-y-3">
        <h3 className="font-mono text-sm tracking-[0.18em] text-studio-secondaryText">PREVIEW</h3>
        <div
          className="h-24 w-full rounded-2xl border border-studio-border"
          style={{ background: gradientPreview }}
        />
      </section>

      {/* Apply Button */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={applyGradient}
          className="rounded-2xl bg-studio-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-studio-accent/90"
        >
          Apply Gradient
        </button>
        <button
          onClick={removeSolidFill}
          className="rounded-2xl border border-studio-border bg-studio-elevated px-4 py-2 text-sm font-semibold transition hover:bg-studio-accentHover"
        >
          Remove Gradient
        </button>
      </div>
    </div>
  );
}
