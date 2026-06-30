import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Shield,
  FileText,
  TrendingUp,
  ArrowRight,
  Upload,
  Globe2,
  MessageSquare,
  Scale,
} from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/beaver.png" alt="Lease Beaver" className="w-[180px] h-[180px] object-contain" />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:block">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-1 text-gray-500">What would you like to check today?</p>
        </div>

        {/* Main action cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Link
            href="/analyze"
            className="group bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md hover:border-green-200 transition-all"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Lease Checker</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Upload your lease. We scan for auto-renewal traps, vague maintenance
              clauses, unreasonable fees, and privacy violations — with plain-English
              explanations and questions to ask your landlord.
            </p>
            <div className="flex gap-2">
              <span className="text-xs font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-full">High Risk</span>
              <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">Review</span>
              <span className="text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">Standard</span>
            </div>
          </Link>

          <Link
            href="/compare"
            className="group bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md hover:border-green-200 transition-all"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Rent Fairness Check</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Enter your monthly rent, bedroom count, and Champaign-Urbana location.
              Get an instant fairness verdict benchmarked against real local market rates.
            </p>
            <div className="h-2 rounded-full bg-gradient-to-r from-green-500 via-yellow-400 to-red-500" />
          </Link>
        </div>

        {/* Dispute Assistant full-width card */}
        <Link
          href="/dispute-assistant"
          className="group bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md hover:border-green-200 transition-all flex items-center justify-between gap-6 mb-6"
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
              <Scale className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Dispute Assistant</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Get help disputing any lease issue — security deposits, early termination, landlord entry, habitability, and more. Grounded in Illinois law and C-U norms.
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all shrink-0" />
        </Link>

        {/* How it works */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h3 className="text-sm font-semibold text-green-700 mb-1">HOW IT WORKS</h3>
          <p className="text-lg font-bold text-gray-900 mb-6">Built for renters, not lawyers</p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { num: "01", icon: Upload, title: "Paste or upload", body: "Drop in your lease text or upload a PDF. We'll handle the rest." },
              { num: "02", icon: Globe2, title: "Smart analysis", body: "Our engine scans for dozens of known red flags, unusual fees, and rights violations." },
              { num: "03", icon: MessageSquare, title: "Ask better questions", body: "Each flagged clause comes with a ready-to-send question for your landlord." },
            ].map((step) => (
              <div key={step.num} className="flex gap-4">
                <span className="text-2xl font-extrabold text-gray-100 shrink-0">{step.num}</span>
                <div>
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center mb-2">
                    <step.icon className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
