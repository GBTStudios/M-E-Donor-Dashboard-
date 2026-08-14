import { SignUpForm } from "@/components/auth/SignUpForm";
import Image from "next/image";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-brand-cream flex flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Image src="/logo.png" alt="Groundbreaker" width={40} height={40} className="object-contain rounded-lg" />
        <span className="text-[#1A534A] font-bold text-lg leading-tight">
          Groundbreaker
          <br />
          <span className="font-normal text-sm text-[#5B7571]">Impact</span>
        </span>
      </div>
      <SignUpForm />
    </main>
  );
}
