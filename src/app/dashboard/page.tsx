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
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100/50 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/beaver.png" alt="Lease Beaver" className="h-16 w-auto object-contain" />
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
            className="group bg-white rounded-3xl border border-gray-100 p-8 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-green-900/10 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Lease Checker</h2>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all shrink-0" />
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Upload your lease. We scan for auto-renewal traps, vague maintenance
              clauses, unreasonable fees, and privacy violations — with plain-English
              explanations and questions to ask your landlord.
            </p>
          </Link>

          <Link
            href="/compare"
            className="group bg-white rounded-3xl border border-gray-100 p-8 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-green-900/10 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Rent Fairness Check</h2>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all shrink-0" />
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Enter your monthly rent, bedroom count, and Champaign-Urbana location.
              Get an instant fairness verdict benchmarked against real local market rates.
            </p>
          </Link>
        </div>

        {/* Dispute Assistant full-width card */}
        <Link
          href="/dispute-assistant"
          className="group bg-white rounded-3xl border border-gray-100 p-8 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-green-900/10 hover:-translate-y-1 transition-all duration-300 flex items-center justify-between gap-6 mb-6"
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
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 p-8">
          <h3 className="text-sm font-semibold text-green-700 mb-1">HOW IT WORKS</h3>
          <p className="text-lg font-bold text-gray-900 mb-6">Built for renters, not lawyers</p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { num: "01", icon: Upload, title: "Paste or upload", body: "Drop in your lease text or upload a PDF. We'll handle the rest." },
              { num: "02", icon: Globe2, title: "Smart analysis", body: "Our system scans for dozens of known red flags, unusual fees, and rights violations." },
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
