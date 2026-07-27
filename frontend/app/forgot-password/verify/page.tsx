import VerifyCodeForm from "@/components/VerifyCodeForm";

export default function VerifyCodePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5efe4] px-4">
      <div className="w-full max-w-md bg-[#eaf5f0] rounded-xl border border-black/10 p-8">
        <VerifyCodeForm />
      </div>
    </div>
  );
}