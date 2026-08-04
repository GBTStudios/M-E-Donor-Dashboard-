import AdminLayout from "@/components/admin/AdminLayout";
import { ProfileCard } from "@/components/admin/ProfileCard";

export default function ProfilePage() {
  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-[#1A534A] mb-6">Admin Profile</h1>
      <ProfileCard />
    </AdminLayout>
  );
}
