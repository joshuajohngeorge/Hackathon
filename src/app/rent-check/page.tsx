import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Shield, ArrowLeft, TrendingUp } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";

export default async function RentCheckPage() {
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
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rent Fairness Check</h1>
            <p className="text-sm text-gray-500">See how your rent compares to local Champaign-Urbana rates</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Coming soon</h2>
          <p className="text-gray-500 max-w-sm mx-auto">
            Rent benchmarking against real C-U market data is being built.
          </p>
        </div>
      </main>
    </div>
  );
}
