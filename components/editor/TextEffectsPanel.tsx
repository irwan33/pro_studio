"use client";

import { useState } from "react";
import { useSelectedElement } from "@/store/editorSelectors";
import { emitStudioAction } from "@/lib/editor/actions";

export function TextEffectsPanel() {
  const selected = useSelectedElement();
  const isText = selected?.type === "text";
  
  // Shadow state
  const [shadowEnabled, setShadowEnabled] = useState(false);
  const [shadowColor, setShadowColor] = useState("#000000");
  const [shadowBlur, setShadowBlur] = useState(10);
  const [shadowOffsetX, setShadowOffsetX] = useState(5);
  const [shadowOffsetY, setShadowOffsetY] = useState(5);
  const [shadowOpacity, setShadowOpacity] = useState(0.5);
  
  // Stroke state
  const [strokeEnabled, setStrokeEnabled] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  
  // Glow state
  const [glowEnabled, setGlowEnabled] = useState(false);
  const [glowColor, setGlowColor] = useState("#C7FF00");
  const [glowBlur, setGlowBlur] = useState(20);

  if (!isText) {
    return (
      <div className="mt-6 text-center text-sm text-studio-muted">
        Select a text object to apply effects
      </div>
    );
  }

  function applyShadow() {
    if (!shadowEnabled) {
      emitStudioAction({ 
        action: "apply-text-shadow", 
        payload: { 
          enabled: false
        } 
      });
      return;
    }
    
    // Convert opacity to rgba
    const rgb = hexToRgb(shadowColor);
    const shadowColorWithAlpha = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${shadowOpacity})`;
    
    emitStudioAction({ 
      action: "apply-text-shadow", 
      payload: { 
        enabled: true,
        color: shadowColorWithAlpha,
        blur: shadowBlur,
        offsetX: shadowOffsetX,
        offsetY: shadowOffsetY
      } 
    });
  }

  function applyStroke() {
    emitStudioAction({ 
      action: "apply-text-stroke", 
      payload: { 
        enabled: strokeEnabled,
        color: strokeColor,
        width: strokeWidth
      } 
    });
  }

  function applyGlow() {
    if (!glowEnabled) {
      emitStudioAction({ 
        action: "apply-text-glow", 
        payload: { 
          enabled: false
        } 
      });
      return;
    }
    
    emitStudioAction({ 
      action: "apply-text-glow", 
      payload: { 
        enabled: true,
        color: glowColor,
        blur: glowBlur
      } 
    });
  }

  function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Drop Shadow */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-sm tracking-[0.18em] text-studio-secondaryText">DROP SHADOW</h3>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={shadowEnabled}
              onChange={(e) => {
                setShadowEnabled(e.target.checked);
                if (!e.target.checked) {
                  emitStudioAction({ 
                    action: "apply-text-shadow", 
                    payload: { enabled: false } 
                  });
                } else {
                  applyShadow();
                }
              }}
              className="h-4 w-4 accent-studio-accent"
            />
            <span className="text-xs text-studio-muted">Enable</span>
          </label>
        </div>
        
        {shadowEnabled && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-studio-muted">Color</label>
              <input
                type="color"
                value={shadowColor}
                onChange={(e) => {
                  setShadowColor(e.target.value);
                  applyShadow();
                }}
                className="h-8 w-16 rounded-lg border border-studio-border bg-transparent cursor-pointer"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="text-studio-muted">Opacity</label>
                <span className="font-mono text-studio-text">{Math.round(shadowOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={shadowOpacity}
                onChange={(e) => {
                  setShadowOpacity(Number(e.target.value));
                  applyShadow();
                }}
                className="w-full accent-studio-accent"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="text-studio-muted">Blur</label>
                <span className="font-mono text-studio-text">{shadowBlur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={shadowBlur}
                onChange={(e) => {
                  setShadowBlur(Number(e.target.value));
                  applyShadow();
                }}
                className="w-full accent-studio-accent"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="text-studio-muted">Offset X</label>
                  <span className="font-mono text-studio-text">{shadowOffsetX}px</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  value={shadowOffsetX}
                  onChange={(e) => {
                    setShadowOffsetX(Number(e.target.value));
                    applyShadow();
                  }}
                  className="w-full accent-studio-accent"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="text-studio-muted">Offset Y</label>
                  <span className="font-mono text-studio-text">{shadowOffsetY}px</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  value={shadowOffsetY}
                  onChange={(e) => {
                    setShadowOffsetY(Number(e.target.value));
                    applyShadow();
                  }}
                  className="w-full accent-studio-accent"
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Stroke/Outline */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-sm tracking-[0.18em] text-studio-secondaryText">STROKE / OUTLINE</h3>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={strokeEnabled}
              onChange={(e) => {
                setStrokeEnabled(e.target.checked);
                applyStroke();
              }}
              className="h-4 w-4 accent-studio-accent"
            />
            <span className="text-xs text-studio-muted">Enable</span>
          </label>
        </div>
        
        {strokeEnabled && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-studio-muted">Color</label>
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => {
                  setStrokeColor(e.target.value);
                  applyStroke();
                }}
                className="h-8 w-16 rounded-lg border border-studio-border bg-transparent cursor-pointer"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="text-studio-muted">Width</label>
                <span className="font-mono text-studio-text">{strokeWidth}px</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={strokeWidth}
                onChange={(e) => {
                  setStrokeWidth(Number(e.target.value));
                  applyStroke();
                }}
                className="w-full accent-studio-accent"
              />
            </div>
          </div>
        )}
      </section>

      {/* Glow Effect */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-sm tracking-[0.18em] text-studio-secondaryText">GLOW EFFECT</h3>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={glowEnabled}
              onChange={(e) => {
                setGlowEnabled(e.target.checked);
                if (!e.target.checked) {
                  emitStudioAction({ 
                    action: "apply-text-glow", 
                    payload: { enabled: false } 
                  });
                } else {
                  applyGlow();
                }
              }}
              className="h-4 w-4 accent-studio-accent"
            />
            <span className="text-xs text-studio-muted">Enable</span>
          </label>
        </div>
        
        {glowEnabled && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-studio-muted">Color</label>
              <input
                type="color"
                value={glowColor}
                onChange={(e) => {
                  setGlowColor(e.target.value);
                  applyGlow();
                }}
                className="h-8 w-16 rounded-lg border border-studio-border bg-transparent cursor-pointer"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="text-studio-muted">Blur Radius</label>
                <span className="font-mono text-studio-text">{glowBlur}px</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={glowBlur}
                onChange={(e) => {
                  setGlowBlur(Number(e.target.value));
                  applyGlow();
                }}
                className="w-full accent-studio-accent"
              />
            </div>
          </div>
        )}
      </section>

      {/* Reset Button */}
      <button
        onClick={() => {
          setShadowEnabled(false);
          setStrokeEnabled(false);
          setGlowEnabled(false);
          emitStudioAction({ action: "reset-text-effects", payload: {} });
        }}
        className="w-full rounded-2xl border border-studio-border bg-studio-elevated px-4 py-2 text-sm font-semibold transition hover:bg-studio-accentHover"
      >
        Reset All Effects
      </button>
    </div>
  );
}
