import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Shield,
  FileText,
  Home as HomeIcon,
  Lock,
  ArrowRight,
  Upload,
  Globe2,
  MessageSquare,
  TrendingUp,
  MapPin,
  Route,
} from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const primaryHref = user ? "/dashboard" : "/login";

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">
              LeaseCheck CU
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              href={primaryHref}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
            >
              <FileText className="w-4 h-4" />
              Lease Checker
            </Link>
            <Link
              href={primaryHref}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
            >
              <HomeIcon className="w-4 h-4" />
              Rent Check
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
              <Lock className="w-3 h-3" />
              Privacy-first
            </span>
            {user ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-full transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center gap-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-full transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-green-50 to-green-50/40">
        <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
              UIUC STUDENTS &middot; SIGN IN TO ANALYZE
            </span>

            <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
              It&apos;s the
              <br />
              <span className="text-green-600">Lease we can do</span>
            </h1>

            <div className="mt-8 flex items-center gap-3">
              <Link
                href={primaryHref}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-xl transition-colors"
              >
                Check your lease
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={primaryHref}
                className="flex items-center gap-2 border border-gray-300 text-gray-700 hover:border-gray-400 font-medium px-6 py-3 rounded-xl transition-colors"
              >
                <MapPin className="w-4 h-4" />
                Check rent fairness
              </Link>
            </div>

            <p className="mt-4 flex items-center gap-1.5 text-sm text-gray-500">
              <Lock className="w-3.5 h-3.5" />
              Sign in with your Illinois email — your lease data stays tied to
              your account, never shared.
            </p>
          </div>

          {/* Right: cards */}
          <div className="space-y-5">
            <Link
              href={primaryHref}
              className="block bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">
                Lease Checker
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Upload your lease. We scan for auto-renewal traps, vague
                maintenance clauses, unreasonable fees, and privacy
                violations — with plain-English explanations and questions to
                ask your landlord.
              </p>
              <div className="mt-4 flex gap-2">
                <span className="text-xs font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-full">
                  High Risk
                </span>
                <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                  Review
                </span>
                <span className="text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                  Standard
                </span>
              </div>
            </Link>

            <Link
              href={primaryHref}
              className="block bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">
                Rent Fairness Check
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Enter your monthly rent, bedroom count, and Champaign-Urbana
                location. Get an instant fairness verdict benchmarked against
                real local market rates.
              </p>
              <div className="mt-4 h-2 rounded-full bg-gradient-to-r from-green-500 via-yellow-400 to-red-500" />
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-green-50/40 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold tracking-wide text-green-700">
              HOW IT WORKS
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-gray-900">
              Built for renters, not lawyers
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                num: "01",
                icon: Upload,
                title: "Paste or upload",
                body: "Drop in your lease text or upload a PDF. We'll handle the rest.",
              },
              {
                num: "02",
                icon: Globe2,
                title: "Smart analysis",
                body: "Our engine scans for dozens of known red flags, unusual fees, and rights violations.",
              },
              {
                num: "03",
                icon: MessageSquare,
                title: "Ask better questions",
                body: "Each flagged clause comes with a ready-to-send question for your landlord.",
              },
            ].map((step) => (
              <div
                key={step.num}
                className="bg-white rounded-2xl border border-gray-200 p-7"
              >
                <div className="flex items-start justify-between">
                  <span className="text-3xl font-extrabold text-gray-200">
                    {step.num}
                  </span>
                  <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center">
                    <step.icon className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-10 grid sm:grid-cols-2 md:grid-cols-4 gap-8">
          {[
            {
              icon: Globe2,
              title: "AI-powered analysis",
              body: "Trained on common lease patterns",
            },
            {
              icon: MapPin,
              title: "Location-aware",
              body: "Champaign-Urbana rent data",
            },
            {
              icon: TrendingUp,
              title: "Market insights",
              body: "Visual rent fairness gauge",
            },
            {
              icon: Route,
              title: "Guided workflow",
              body: "From upload to action items",
            },
          ].map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                <f.icon className="w-4.5 h-4.5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {f.title}
                </p>
                <p className="text-xs text-gray-500">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-green-50/40">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm text-gray-900">
              LeaseCheck CU
            </span>
          </div>
          <p className="text-xs text-gray-500 text-center">
            Not legal advice. For educational purposes only. Always consult a
            housing counselor before signing.
          </p>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <Lock className="w-3.5 h-3.5" />
            Your data is secured — sign in required
          </span>
        </div>
      </footer>
    </div>
  );
}
