import LoginForm from "@/components/LoginForm";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5efe4] px-4">
      <div className="mb-6 flex items-center gap-3">
        <Image src="/logo.png" alt="Groundbreaker" width={40} height={40} className="object-contain" />
        <span className="text-[#1A534A] font-bold text-lg leading-tight">
          Groundbreaker
          <br />
          <span className="font-normal text-sm text-[#5B7571]">Impact</span>
        </span>
      </div>
      <div className="w-full max-w-md bg-[#eaf5f0] rounded-xl border border-black/10 p-8">
        <LoginForm />
      </div>
    </div>
  );
}
