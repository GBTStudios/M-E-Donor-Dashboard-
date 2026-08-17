import DonorLayout from "@/components/donor/DonorLayout";
import { DonorProfileCard } from "@/components/donor/DonorProfileCard";

export default function DonorProfilePage() {
  return (
    <DonorLayout>
      <h1 className="text-2xl font-semibold text-[#1A534A] mb-6">Donor Profile</h1>
      <DonorProfileCard />
    </DonorLayout>
  );
}