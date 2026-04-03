import { useState } from "react";

type CategoryPickerProps = {
  selected: string;
  onSelect: (category: string) => void;
  categoryStats?: Record<string, { budget: number; used: number }>;
};

const categories = [
  ["dining", "🍽️ Dining"],
  ["groceries", "🛒 Groceries"],
  ["travel", "✈️ Travel"],
  ["gas", "⛽ Gas"],
] as const;

export default function CategoryPicker({
  selected,
  onSelect,
  categoryStats,
}: CategoryPickerProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const hoveredStats = hovered ? categoryStats?.[hovered] : undefined;

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {categories.map(([value, label]) => {
          const active = selected === value;
          return (
            <button
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                active
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-brand-300"
              }`}
              key={value}
              onClick={() => onSelect(value)}
              onMouseEnter={() => setHovered(value)}
              onMouseLeave={() =>
                setHovered((current: string | null) =>
                  current === value ? null : current,
                )
              }
              type="button"
            >
              {label}
            </button>
          );
        })}
      </div>

      {hovered && hoveredStats ? (
        <div className="mt-3 rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-900">
          <span className="font-semibold capitalize">{hovered}</span>: Budget $
          {hoveredStats.budget.toFixed(2)} · Used $
          {hoveredStats.used.toFixed(2)}
        </div>
      ) : null}
    </div>
  );
}
