"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { fetchAdminStats, updateAdminStats, AdminStats, StatsFieldErrors } from "@/lib/adminStats";

const FIELDS: { key: keyof AdminStats; label: string; min: number; max: number; step: string }[] = [
  { key: "participants", label: "Participants", min: 0, max: 1000000, step: "1" },
  { key: "graduation_rate", label: "Graduation Rate (%)", min: 0, max: 100, step: "0.1" },
  { key: "employment_rate", label: "Employment Rate (%)", min: 0, max: 100, step: "0.1" },
  { key: "income_growth_multiplier", label: "Income Growth Multiplier", min: 0, max: 1000, step: "0.1" },
  { key: "cohorts", label: "Cohorts", min: 0, max: 1000, step: "1" },
  { key: "refugee_participants_pct", label: "Refugee Participants (%)", min: 0, max: 100, step: "0.1" },
];

export default function AdminStatsForm() {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<StatsFieldErrors>({});
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    async function load() {
      const result = await fetchAdminStats();

      if (result.success && result.stats) {
        const initial: Record<string, string> = {};
        for (const field of FIELDS) {
          initial[field.key] = String(result.stats[field.key]);
        }
        setValues(initial);
        setLoading(false);
        return;
      }

      if (result.status === 401) {
        router.replace("/login");
        return;
      }

      if (result.status === 403) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      setError(result.error ?? "Something went wrong.");
      setLoading(false);
    }
    load();
  }, [router]);

  function handleChange(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSavedMessage("");
    setSaving(true);

    const changes: Record<string, number> = {};
    for (const field of FIELDS) {
      const raw = values[field.key];
      const num = field.key === "participants" || field.key === "cohorts" ? parseInt(raw, 10) : parseFloat(raw);
      if (!Number.isNaN(num)) changes[field.key] = num;
    }

    const result = await updateAdminStats(changes);
    setSaving(false);

    if (result.success) {
      setSavedMessage("Stats updated successfully.");
      return;
    }

    if (result.status === 401) {
      router.replace("/login");
      return;
    }

    if (result.status === 403) {
      setAccessDenied(true);
      return;
    }

    setError(result.error ?? "Something went wrong.");
    if (result.fieldErrors) setFieldErrors(result.fieldErrors);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="text-center py-20">
        <h1 className="text-xl font-semibold text-gray-800">Access denied</h1>
        <p className="text-sm text-gray-500 mt-2">
          You do not have admin access to view this page.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-5">
      <h1 className="text-2xl font-semibold text-gray-800">Landing Page Stats</h1>
      <p className="text-sm text-gray-500">
        These numbers appear in the Impact section of the public landing page.
      </p>

      {FIELDS.map((field) => (
        <div key={field.key}>
          <label htmlFor={field.key} className="text-sm font-medium text-gray-700">
            {field.label}
          </label>
          <input
            id={field.key}
            type="number"
            min={field.min}
            max={field.max}
            step={field.step}
            value={values[field.key] ?? ""}
            onChange={(e) => handleChange(field.key, e.target.value)}
            className="w-full mt-1 px-3 py-2.5 rounded-lg border border-black/10 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
          />
          {fieldErrors[field.key] && (
            <p className="text-sm text-red-600 mt-1">{fieldErrors[field.key]}</p>
          )}
        </div>
      ))}

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {savedMessage && <p className="text-sm text-green-600">{savedMessage}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-teal-800 hover:bg-teal-900 text-white rounded-lg py-2.5 text-sm font-medium transition disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
