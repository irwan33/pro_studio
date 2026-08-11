"use client";

import { useState } from "react";
import { useSelectedElement } from "@/store/editorSelectors";
import { emitStudioAction } from "@/lib/editor/actions";

type FilterPreset = {
  name: string;
  filters: Record<string, number>;
};

const filterPresets: FilterPreset[] = [
  { name: "Original", filters: {} },
  { name: "Vivid", filters: { brightness: 0.1, contrast: 0.15, saturation: 0.3 } },
  { name: "B&W", filters: { saturation: -1 } },
  { name: "Sepia", filters: { brightness: 0.1, saturation: -0.3, hue: 20 } },
  { name: "Cool", filters: { brightness: 0.05, saturation: 0.1, hue: -15 } },
  { name: "Warm", filters: { brightness: 0.05, saturation: 0.1, hue: 15 } },
  { name: "Vintage", filters: { brightness: -0.05, contrast: 0.1, saturation: -0.2, hue: 10 } },
  { name: "Fade", filters: { brightness: 0.15, contrast: -0.2, saturation: -0.15 } },
  { name: "High Contrast", filters: { contrast: 0.4, saturation: 0.2 } },
  { name: "Soft", filters: { brightness: 0.1, contrast: -0.15, blur: 0.05 } },
];

export function FilterPanel() {
  const selected = useSelectedElement();
  const isImage = selected?.type === "image";
  
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [blur, setBlur] = useState(0);
  const [hue, setHue] = useState(0);

  if (!isImage) {
    return (
      <div className="mt-6 text-center text-sm text-studio-muted">
        Select an image to apply filters
      </div>
    );
  }

  function applyFilter(type: string, value: number) {
    emitStudioAction({ 
      action: "apply-filter", 
      payload: { filterType: type, value } 
    });
  }

  function applyPreset(preset: FilterPreset) {
    emitStudioAction({ 
      action: "apply-filter-preset", 
      payload: { filters: preset.filters } 
    });
    // Update local state
    setBrightness(preset.filters.brightness ?? 0);
    setContrast(preset.filters.contrast ?? 0);
    setSaturation(preset.filters.saturation ?? 0);
    setBlur(preset.filters.blur ?? 0);
    setHue(preset.filters.hue ?? 0);
  }

  function resetFilters() {
    emitStudioAction({ 
      action: "reset-filters", 
      payload: {} 
    });
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setBlur(0);
    setHue(0);
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Filter Presets */}
      <section className="space-y-3">
        <h3 className="font-mono text-sm tracking-[0.18em] text-studio-secondaryText">FILTER PRESETS</h3>
        <div className="grid grid-cols-2 gap-2">
          {filterPresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="rounded-2xl border border-studio-border bg-studio-elevated px-3 py-2 text-left text-sm font-semibold transition hover:bg-studio-accentHover hover:border-studio-accent"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </section>

      {/* Manual Controls */}
      <section className="space-y-4">
        <h3 className="font-mono text-sm tracking-[0.18em] text-studio-secondaryText">ADJUST FILTERS</h3>
        
        {/* Brightness */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="text-studio-muted">Brightness</label>
            <span className="font-mono text-studio-text">{Math.round(brightness * 100)}</span>
          </div>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={brightness}
            onChange={(e) => {
              const val = Number(e.target.value);
              setBrightness(val);
              applyFilter("brightness", val);
            }}
            className="w-full accent-studio-accent"
          />
        </div>

        {/* Contrast */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="text-studio-muted">Contrast</label>
            <span className="font-mono text-studio-text">{Math.round(contrast * 100)}</span>
          </div>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={contrast}
            onChange={(e) => {
              const val = Number(e.target.value);
              setContrast(val);
              applyFilter("contrast", val);
            }}
            className="w-full accent-studio-accent"
          />
        </div>

        {/* Saturation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="text-studio-muted">Saturation</label>
            <span className="font-mono text-studio-text">{Math.round(saturation * 100)}</span>
          </div>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={saturation}
            onChange={(e) => {
              const val = Number(e.target.value);
              setSaturation(val);
              applyFilter("saturation", val);
            }}
            className="w-full accent-studio-accent"
          />
        </div>

        {/* Hue Rotation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="text-studio-muted">Hue</label>
            <span className="font-mono text-studio-text">{Math.round(hue)}°</span>
          </div>
          <input
            type="range"
            min="-180"
            max="180"
            step="1"
            value={hue}
            onChange={(e) => {
              const val = Number(e.target.value);
              setHue(val);
              applyFilter("hue", val);
            }}
            className="w-full accent-studio-accent"
          />
        </div>

        {/* Blur */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="text-studio-muted">Blur</label>
            <span className="font-mono text-studio-text">{Math.round(blur * 100)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={blur}
            onChange={(e) => {
              const val = Number(e.target.value);
              setBlur(val);
              applyFilter("blur", val);
            }}
            className="w-full accent-studio-accent"
          />
        </div>

        {/* Reset Button */}
        <button
          onClick={resetFilters}
          className="w-full rounded-2xl border border-studio-border bg-studio-elevated px-4 py-2 text-sm font-semibold transition hover:bg-studio-accentHover"
        >
          Reset All Filters
        </button>
      </section>
    </div>
  );
}
