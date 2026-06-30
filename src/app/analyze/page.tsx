import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Shield, ArrowLeft, FileText } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";
import { LeaseAnalyzer } from "@/components/LeaseAnalyzer";

export default async function AnalyzePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/beaver.png" alt="Lease Beaver" className="w-12 h-12 object-contain" />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:block">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <FileText className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lease Checker</h1>
            <p className="text-sm text-gray-500">Upload your lease to get started</p>
          </div>
        </div>

        <LeaseAnalyzer />
      </main>
    </div>
  );
}
