import { RequireFirstLoginComplete } from "@/components/admin/RequireFirstLoginComplete";
import AdminStoriesList from "@/components/admin/AdminStoriesList";

export default function AdminStoriesPage() {
  return (
    <RequireFirstLoginComplete>
      <div className="min-h-screen bg-[#f5efe4] px-4 py-16">
        <AdminStoriesList />
      </div>
    </RequireFirstLoginComplete>
  );
}
