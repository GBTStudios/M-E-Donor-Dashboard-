import AdminLayout from "@/components/admin/AdminLayout";
import AdminStoryForm from "@/components/admin/AdminStoryForm";

export default function NewStoryPage() {
  return (
    <AdminLayout>
      <AdminStoryForm mode="create" />
    </AdminLayout>
  );
}
