"use client";

import { useState } from "react";
import { ArrowUp, ArrowDown, ArrowUpToLine, ArrowDownToLine, Lock, Unlock } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { useSelectedElement } from "@/store/editorSelectors";
import { emitStudioAction } from "@/lib/editor/actions";
import { getElementBox } from "@/lib/editor/coordinates";
import type { ElementUpdatePayload } from "@/lib/editor/patch";

function useSelectedCount() {
  return useEditorStore((s) => s.selectedIds.length);
}

function isAtTop() {
  const state = useEditorStore.getState();
  const selected = state.getSelectedElements()[0];
  if (!selected) return false;
  const ordered = state.elements.slice().sort((a, b) => a.zIndex - b.zIndex);
  return ordered[ordered.length - 1]?.id === selected.id;
}

function isAtBottom() {
  const state = useEditorStore.getState();
  const selected = state.getSelectedElements()[0];
  if (!selected) return false;
  const ordered = state.elements.slice().sort((a, b) => a.zIndex - b.zIndex);
  return ordered[0]?.id === selected.id;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-mono text-xs tracking-[0.18em] text-studio-secondaryText">{children}</h3>;
}

function ActionButton({
  label,
  icon,
  disabled,
  onClick
}: {
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-full items-center gap-1.5 rounded-lg border border-studio-border bg-studio-elevated px-2 text-left text-xs font-medium text-studio-text transition hover:bg-studio-accentHover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-accent active:scale-[0.98] disabled:opacity-40 disabled:hover:bg-studio-elevated disabled:active:scale-100"
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center text-studio-accent">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function NumberField({
  label,
  value,
  disabled,
  onChange,
  suffix
}: {
  label: string;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
  suffix?: string;
}) {
  return (
    <label className="space-y-1 text-[11px] text-studio-muted">
      {label}
      <div className="relative">
        <input
          disabled={disabled}
          type="number"
          value={value}
          onChange={(event) => onChange(Math.max(0, Number(event.target.value)))}
          onBlur={(event) => {
            const value = Math.max(0, Number(event.target.value));
            if (!isNaN(value)) onChange(value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              const value = Math.max(0, Number((event.target as HTMLInputElement).value));
              if (!isNaN(value)) onChange(value);
              (event.target as HTMLInputElement).blur();
            }
          }}
          className="h-8 w-full rounded-lg border border-studio-border bg-studio-elevated px-2 font-mono text-xs text-studio-text outline-none focus:border-studio-accent disabled:opacity-40"
        />
        {suffix && <span className="pointer-events-none absolute right-2 top-1.5 text-xs text-studio-muted">{suffix}</span>}
      </div>
    </label>
  );
}

export function ArrangeTab() {
  const selected = useSelectedElement();
  const selectedCount = useSelectedCount();
  const disabled = selectedCount === 0;
  const [ratioLocked, setRatioLocked] = useState(false);
  const [lastRatio, setLastRatio] = useState<number | null>(null);

  if (!selected) {
    return (
      <div className="space-y-3">
        <SectionTitle>ARRANGE</SectionTitle>
        <p className="text-sm text-studio-secondaryText">Select an element on the canvas to arrange and align it.</p>
      </div>
    );
  }

  const box = getElementBox(selected);
  const ratio = lastRatio ?? (box.height > 0 ? box.width / box.height : 1);

  function update(payload: ElementUpdatePayload) {
    emitStudioAction({ action: "update-active", payload });
  }

  function updateWidth(width: number) {
    if (ratioLocked && box.height > 0) {
      const nextHeight = Math.max(5, Math.round(width / ratio));
      update({ width, height: nextHeight });
    } else {
      update({ width });
    }
    if (box.height > 0) setLastRatio(width / box.height);
  }

  function updateHeight(height: number) {
    if (ratioLocked && box.width > 0) {
      const nextWidth = Math.max(5, Math.round(height * ratio));
      update({ width: nextWidth, height });
    } else {
      update({ height });
    }
    if (box.width > 0) setLastRatio(box.width / height);
  }

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <SectionTitle>ARRANGE</SectionTitle>
        <div className="grid grid-cols-2 gap-1.5">
          <ActionButton
            label="Forward"
            icon={<ArrowUp size={14} />}
            disabled={disabled || isAtTop()}
            onClick={() => emitStudioAction("bring-forward")}
          />
          <ActionButton
            label="Backward"
            icon={<ArrowDown size={14} />}
            disabled={disabled || isAtBottom()}
            onClick={() => emitStudioAction("send-backward")}
          />
          <ActionButton
            label="To front"
            icon={<ArrowUpToLine size={14} />}
            disabled={disabled || isAtTop()}
            onClick={() => emitStudioAction("bring-front")}
          />
          <ActionButton
            label="To back"
            icon={<ArrowDownToLine size={14} />}
            disabled={disabled || isAtBottom()}
            onClick={() => emitStudioAction("send-back")}
          />
        </div>
      </section>

      <section className="space-y-2">
        <SectionTitle>ALIGN TO PAGE</SectionTitle>
        <div className="grid grid-cols-2 gap-1.5">
          <ActionButton label="Top" icon={<span className="text-sm leading-none">↥</span>} disabled={disabled} onClick={() => emitStudioAction("align-top")} />
          <ActionButton label="Left" icon={<span className="text-sm leading-none">↤</span>} disabled={disabled} onClick={() => emitStudioAction("align-left")} />
          <ActionButton label="Middle" icon={<span className="text-sm leading-none">↕</span>} disabled={disabled} onClick={() => emitStudioAction("align-center-vertical")} />
          <ActionButton label="Center" icon={<span className="text-sm leading-none">↔</span>} disabled={disabled} onClick={() => emitStudioAction("align-center-horizontal")} />
          <ActionButton label="Bottom" icon={<span className="text-sm leading-none">↧</span>} disabled={disabled} onClick={() => emitStudioAction("align-bottom")} />
          <ActionButton label="Right" icon={<span className="text-sm leading-none">↦</span>} disabled={disabled} onClick={() => emitStudioAction("align-right")} />
        </div>
      </section>

      <section className="space-y-2">
        <SectionTitle>ADVANCED</SectionTitle>
        <div className="grid grid-cols-2 gap-1.5">
          <NumberField label="Width" disabled={disabled} value={Math.round(box.width)} onChange={updateWidth} />
          <NumberField label="Height" disabled={disabled} value={Math.round(box.height)} onChange={updateHeight} />
          <NumberField label="X" disabled={disabled} value={Math.round(selected.x)} onChange={(x) => update({ x })} />
          <NumberField label="Y" disabled={disabled} value={Math.round(selected.y)} onChange={(y) => update({ y })} />
          <NumberField label="Rotate" disabled={disabled} value={Math.round(selected.rotation ?? 0)} onChange={(rotation) => update({ rotation })} suffix="°" />
          <div className="flex items-end">
            <button
              type="button"
              disabled={disabled}
              onClick={() => setRatioLocked((current) => !current)}
              className={
                "flex h-8 w-full items-center gap-1.5 rounded-lg border border-studio-border px-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-accent active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 " +
                (ratioLocked ? "border-studio-accent bg-studio-accent text-white" : "bg-studio-elevated text-studio-text hover:bg-studio-accentHover")
              }
              aria-pressed={ratioLocked}
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center">{ratioLocked ? <Lock size={13} /> : <Unlock size={13} />}</span>
              <span className="truncate">Ratio lock</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
