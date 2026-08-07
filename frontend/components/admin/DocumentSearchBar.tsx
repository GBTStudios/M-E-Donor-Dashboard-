"use client";

import { Search } from "lucide-react";

interface DocumentSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function DocumentSearchBar({ value, onChange }: DocumentSearchBarProps) {
  return (
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by document name..."
        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-black/10 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700"
      />
    </div>
  );
}
