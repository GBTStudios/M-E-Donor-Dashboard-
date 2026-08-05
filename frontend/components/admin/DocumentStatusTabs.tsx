"use client";

export type StatusTabValue = "all" | "published" | "pending" | "excluded";

const TABS: { value: StatusTabValue; label: string }[] = [
  { value: "all", label: "All Documents" },
  { value: "published", label: "Live / Published" },
  { value: "pending", label: "Pending Review" },
  { value: "excluded", label: "Excluded" },
];

interface DocumentStatusTabsProps {
  active: StatusTabValue;
  onChange: (value: StatusTabValue) => void;
}

export default function DocumentStatusTabs({ active, onChange }: DocumentStatusTabsProps) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 flex-wrap">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
            active === tab.value
              ? "bg-white text-gray-800 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
