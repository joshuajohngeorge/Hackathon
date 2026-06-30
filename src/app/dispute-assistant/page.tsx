import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Shield, ArrowLeft } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";
import { DisputeChat } from "@/components/DisputeChat";

export default async function DisputeAssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ analysisId?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { analysisId } = await searchParams;

  // Load existing conversation history for this user
  const { data: history } = await supabase
    .from("dispute_messages")
    .select("role, content")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(50);

  const initialHistory = (history ?? []).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="shrink-0 bg-white border-b border-gray-100 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm">Dispute Assistant</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:block">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Full-height chat */}
      <div className="flex-1 overflow-hidden">
        <DisputeChat analysisId={analysisId} initialHistory={initialHistory} />
      </div>
    </div>
  );
}
