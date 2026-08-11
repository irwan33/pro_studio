"use client";

import { Minus, Plus } from "lucide-react";

type Props = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  label?: string;
};

export function NumberInputControl({ value, onChange, min = 0, max = 999, step = 1, unit = "", label }: Props) {
  function handleDecrement() {
    const next = Math.max(min, value - step);
    onChange(Number(next.toFixed(2)));
  }

  function handleIncrement() {
    const next = Math.min(max, value + step);
    onChange(Number(next.toFixed(2)));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed)) {
      onChange(Math.min(max, Math.max(min, parsed)));
    }
  }

  return (
    <div className="flex items-center rounded-xl border border-[#E5E7EB] bg-white px-1 shadow-2xs">
      {label && <span className="px-1.5 text-[11px] font-medium text-gray-500">{label}</span>}
      <button
        type="button"
        onClick={handleDecrement}
        className="flex h-7 w-7 items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg transition"
        title="Decrease"
      >
        <Minus size={13} />
      </button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
        className="h-7 w-12 text-center text-xs font-semibold text-[#1F1F24] outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      {unit && <span className="pr-1 text-[11px] text-gray-400">{unit}</span>}
      <button
        type="button"
        onClick={handleIncrement}
        className="flex h-7 w-7 items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg transition"
        title="Increase"
      >
        <Plus size={13} />
      </button>
    </div>
  );
}
