import { RequireFirstLoginComplete } from "@/components/admin/RequireFirstLoginComplete";
import AdminStatsForm from "@/components/admin/AdminStatsForm";

export default function AdminStatsPage() {
  return (
    <RequireFirstLoginComplete>
      <div className="min-h-screen bg-[#f5efe4] px-4 py-16">
        <AdminStatsForm />
      </div>
    </RequireFirstLoginComplete>
  );
}
