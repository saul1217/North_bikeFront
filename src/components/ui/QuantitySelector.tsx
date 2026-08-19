"use client";

import { Minus, Plus } from "lucide-react";

type QuantitySelectorProps = {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  className?: string;
};

export function QuantitySelector({
  value,
  min = 1,
  max = 99,
  onChange,
  className = "",
}: QuantitySelectorProps) {
  return (
    <div
      className={`inline-flex h-11 items-center border border-north-border bg-white ${className}`}
    >
      <button
        type="button"
        aria-label="Disminuir cantidad"
        className="flex h-full w-10 items-center justify-center text-north-dark hover:bg-north-background disabled:opacity-40"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-10 text-center text-sm font-medium tabular-nums">
        {value}
      </span>
      <button
        type="button"
        aria-label="Aumentar cantidad"
        className="flex h-full w-10 items-center justify-center text-north-dark hover:bg-north-background disabled:opacity-40"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
