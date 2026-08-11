"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus } from "lucide-react";
import type { GradientConfig, ColorStop } from "@/components/editor/GradientPicker";
import { normalizeGradientConfig } from "@/lib/editor/fill";
import { SolidColorPopover } from "@/components/editor/fill/SolidColorPopover";

type Props = {
  initialConfig?: GradientConfig;
  onChange: (config: GradientConfig) => void;
  onClose: () => void;
};

const MAX_STOPS = 10;

const stylePresets: Array<{ name: string; label: string; config: GradientConfig }> = [
  {
    name: "linear-horizontal",
    label: "Linear Horizontal",
    config: {
      type: "linear",
      angle: 0,
      stops: [
        { color: "#FFFFFF", offset: 0 },
        { color: "#000000", offset: 1 }
      ]
    }
  },
  {
    name: "linear-vertical",
    label: "Linear Vertical",
    config: {
      type: "linear",
      angle: 180,
      stops: [
        { color: "#FFFFFF", offset: 0 },
        { color: "#000000", offset: 1 }
      ]
    }
  },
  {
    name: "linear-center",
    label: "Linear Center",
    config: {
      type: "linear",
      angle: 90,
      stops: [
        { color: "#000000", offset: 0 },
        { color: "#FFFFFF", offset: 0.5 },
        { color: "#000000", offset: 1 }
      ]
    }
  },
  {
    name: "radial-center",
    label: "Radial Glow",
    config: {
      type: "radial",
      angle: 0,
      stops: [
        { color: "#FFFFFF", offset: 0 },
        { color: "#000000", offset: 1 }
      ]
    }
  },
  {
    name: "linear-diagonal",
    label: "Linear Diagonal",
    config: {
      type: "linear",
      angle: 45,
      stops: [
        { color: "#FFFFFF", offset: 0 },
        { color: "#000000", offset: 1 }
      ]
    }
  }
];

export function GradientPopover({ initialConfig, onChange, onClose: _onClose }: Props) {
  const [gradientType, setGradientType] = useState<"linear" | "radial">("linear");
  const [angle, setAngle] = useState(90);
  const [colorStops, setColorStops] = useState<ColorStop[]>([
    { color: "#C7FF00", offset: 0 },
    { color: "#151515", offset: 1 }
  ]);
  const [selectedStopIndex, setSelectedStopIndex] = useState(0);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [editingStop, setEditingStop] = useState(false);

  const sortedStops = [...colorStops].sort((a, b) => a.offset - b.offset);

  const emitChange = useCallback((config: GradientConfig) => {
    onChange({ ...config, type: config.type });
  }, [onChange]);

  // Initialize from initialConfig
  useEffect(() => {
    if (initialConfig) {
      setGradientType(initialConfig.type);
      setAngle(initialConfig.angle);
      setColorStops(normalizeGradientConfig(initialConfig).stops);
      setSelectedStopIndex(0);
    }
  }, [initialConfig]);

  const buildConfig = useCallback((): GradientConfig => {
    return {
      type: gradientType,
      angle: gradientType === "linear" ? angle : 0,
      stops: [...colorStops].sort((a, b) => a.offset - b.offset)
    };
  }, [gradientType, angle, colorStops]);

  const applyPreset = useCallback((preset: typeof stylePresets[number]) => {
    setGradientType(preset.config.type);
    setAngle(preset.config.angle);
    setColorStops(preset.config.stops);
    setSelectedStopIndex(0);
    setActivePreset(preset.name);
    emitChange(preset.config);
  }, [emitChange]);

  const addColorStop = useCallback(() => {
    if (colorStops.length >= MAX_STOPS) return;
    const lastColor = colorStops[selectedStopIndex]?.color ?? "#FFFFFF";
    const newStop: ColorStop = { color: lastColor, offset: 0.5 };
    const updated = [...colorStops, newStop].sort((a, b) => a.offset - b.offset);
    setColorStops(updated);
    setSelectedStopIndex(updated.findIndex((s) => s === newStop));
    setActivePreset(null);
    const cfg = { ...buildConfig(), stops: updated };
    emitChange(cfg);
  }, [colorStops, selectedStopIndex, buildConfig, emitChange]);

  const handleStopColorChange = useCallback((color: string) => {
    const updated = [...colorStops];
    updated[selectedStopIndex] = { ...updated[selectedStopIndex], color };
    setColorStops(updated);
    setEditingStop(false);
    setActivePreset(null);
    const cfg = { ...buildConfig(), stops: updated };
    emitChange(cfg);
  }, [colorStops, selectedStopIndex, buildConfig, emitChange]);

  const handleSelectStop = useCallback((index: number) => {
    setSelectedStopIndex(index);
    setEditingStop(true);
  }, []);

  // Preview for presets
  const presetPreview = useCallback((config: GradientConfig): string => {
    const stops = config.stops
      .map((s) => `${s.color} ${Math.round(s.offset * 100)}%`)
      .join(", ");
    return config.type === "linear"
      ? `linear-gradient(${config.angle}deg, ${stops})`
      : `radial-gradient(circle, ${stops})`;
  }, []);

  const isTransparent = (color: string) =>
    color === "rgba(0,0,0,0)" || color === "transparent";

  // Stop editing view
  if (editingStop) {
    const currentStop = colorStops[selectedStopIndex];
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setEditingStop(false)}
          className="text-sm font-semibold text-studio-accent hover:underline"
        >
          ← Back to Gradient
        </button>
        <SolidColorPopover
          initialColor={currentStop?.color ?? "#FFFFFF"}
          onApply={(color) => handleStopColorChange(color)}
          onClose={() => setEditingStop(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gradient colors */}
      <section className="space-y-4">
        <h3 className="font-semibold text-base text-studio-text">Gradient colors</h3>
        <div className="flex items-center gap-3 flex-wrap">
          {/* All gradient stops as individual circles */}
          {sortedStops.map((stop, index) => {
            const selected = index === selectedStopIndex;
            const transparent = isTransparent(stop.color);
            return (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectStop(index)}
                title={`Stop ${index + 1}: ${stop.color} at ${Math.round(stop.offset * 100)}%`}
                aria-label={`Gradient stop ${index + 1}`}
                className={`relative h-10 w-10 rounded-full overflow-hidden border-2 transition ${
                  selected
                    ? "ring-[3px] ring-[#7C3AED] ring-offset-1 border-transparent"
                    : "border-gray-300 hover:border-studio-accent"
                }`}
              >
                {transparent ? (
                  <div className="absolute inset-0" style={{
                    background: "repeating-conic-gradient(#d1d5db 0% 25%, #9ca3af 25% 50%)"
                  }} />
                ) : (
                  <div className="absolute inset-0" style={{ backgroundColor: stop.color }} />
                )}
              </button>
            );
          })}

          {/* Add Color — rainbow ring with + */}
          <button
            type="button"
            onClick={addColorStop}
            disabled={colorStops.length >= MAX_STOPS}
            title="Add color stop"
            aria-label="Add color stop"
            className="relative h-10 w-10 rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 transition"
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: "conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
                padding: "2px"
              }}
            />
            <div className="relative z-10 flex h-full w-full items-center justify-center rounded-full bg-white">
              <Plus size={16} className="text-gray-700" />
            </div>
          </button>
        </div>
      </section>

      {/* Style */}
      <section className="space-y-4">
        <h3 className="font-semibold text-base text-studio-text">Style</h3>
        <div className="grid grid-cols-5 gap-3">
          {stylePresets.map((preset) => {
            const selected = activePreset === preset.name;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                title={preset.label}
                aria-label={preset.label}
                aria-pressed={selected}
                className={`relative w-16 h-16 rounded-2xl overflow-hidden transition hover:shadow-md ${
                  selected ? "ring-[3px] ring-[#7C3AED] ring-offset-0" : ""
                }`}
                style={{ background: presetPreview(preset.config) }}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
