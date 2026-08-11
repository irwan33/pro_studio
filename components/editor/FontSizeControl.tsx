"use client";

import { useState, useEffect, useRef } from "react";
import { Minus, Plus } from "lucide-react";

type Props = {
  value: number;
  onChange: (value: number) => void;
};

export function FontSizeControl({ value, onChange }: Props) {
  const [inputValue, setInputValue] = useState(String(value ?? 72));
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setInputValue(String(value ?? 72));
  }, [value]);

  function applyValue(next: number) {
    const clamped = Math.min(500, Math.max(6, Number(next)));
    if (!isNaN(clamped)) {
      onChange(clamped);
      setInputValue(String(clamped));
    }
  }

  function handleDecrement() {
    applyValue((value ?? 72) - 1);
  }

  function handleIncrement() {
    applyValue((value ?? 72) + 1);
  }

  function startHolding(action: () => void) {
    action();
    holdTimeoutRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(action, 100);
    }, 400);
  }

  function stopHolding() {
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
  }

  function handleBlur() {
    const parsed = parseFloat(inputValue);
    if (isNaN(parsed)) {
      setInputValue(String(value ?? 72));
    } else {
      applyValue(parsed);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleBlur();
      (e.target as HTMLInputElement).blur();
    }
  }

  return (
    <div className="flex h-9 items-center rounded-xl border border-gray-300 bg-white px-1 shadow-2xs">
      <button
        type="button"
        onMouseDown={() => startHolding(handleDecrement)}
        onMouseUp={stopHolding}
        onMouseLeave={stopHolding}
        onTouchStart={() => startHolding(handleDecrement)}
        onTouchEnd={stopHolding}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 transition active:scale-95"
        title="Decrease font size"
      >
        <Minus size={14} />
      </button>

      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="h-7 w-11 text-center text-xs font-semibold text-gray-900 outline-none bg-transparent"
      />

      <button
        type="button"
        onMouseDown={() => startHolding(handleIncrement)}
        onMouseUp={stopHolding}
        onMouseLeave={stopHolding}
        onTouchStart={() => startHolding(handleIncrement)}
        onTouchEnd={stopHolding}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 transition active:scale-95"
        title="Increase font size"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
