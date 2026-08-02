import { RequireFirstLoginComplete } from "@/components/admin/RequireFirstLoginComplete";
import AdminStoryForm from "@/components/admin/AdminStoryForm";

export default function NewStoryPage() {
  return (
    <RequireFirstLoginComplete>
      <div className="min-h-screen bg-[#f5efe4] px-4 py-16">
        <AdminStoryForm mode="create" />
      </div>
    </RequireFirstLoginComplete>
  );
}
