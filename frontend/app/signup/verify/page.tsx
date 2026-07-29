import { Suspense } from "react";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { VerifyCodeForm } from "@/components/auth/VerifyCodeForm";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#F7F1EB] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#1A534A] mb-4 tracking-tight">
            Secure your impact.
          </h1>
          <p className="text-base text-[#5B7571] leading-relaxed mb-8 max-w-sm">
            We&apos;ve sent a 6-digit security code to your professional inbox. This step ensures
            that your contributions and data access remain protected under our enterprise
            security protocols.
          </p>

          <div className="max-w-xs mb-8">
            <Image
              src="/images/verify-email-illustration.png"
              alt=""
              width={400}
              height={400}
              className="w-full h-auto"
              priority
            />
          </div>

          <div className="inline-flex items-center gap-3 bg-white/60 border border-[#C5E5E3] rounded-2xl px-4 py-3">
            <ShieldCheck className="w-5 h-5 text-[#1A534A] flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#3D524C]">Multi-Factor Authentication</p>
              <p className="text-xs text-[#7C9791]">Standard compliance for NGO data integrity.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center md:justify-end">
          <Suspense fallback={null}>
            <VerifyCodeForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
