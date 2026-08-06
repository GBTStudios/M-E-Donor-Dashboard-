"use client";

interface QADateFilterProps {
  period: "daily" | "weekly" | "monthly";
  onChange: (period: "daily" | "weekly" | "monthly") => void;
}

const OPTIONS: { value: "daily" | "weekly" | "monthly"; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export default function QADateFilter({ period, onChange }: QADateFilterProps) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
            period === opt.value
              ? "bg-white text-gray-800 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
