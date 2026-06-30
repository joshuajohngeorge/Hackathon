import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">LeaseCheck CU</h1>
          <span className="text-sm text-gray-500">{user.email}</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">🏠</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Dashboard coming soon
          </h2>
          <p className="text-gray-500">
            Upload your lease to get started with AI-powered analysis.
          </p>
        </div>
      </div>
    </main>
  );
}
