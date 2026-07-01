"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mail } from "lucide-react";

type Mode = "signin" | "signup" | "forgot";

export function AuthForm({ mode: initialMode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setSuccess(null);
    setPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const supabase = createClient();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setSuccess("Account created! Check your email to confirm, then sign in.");
      }
    } else if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });
      if (error) {
        setError(error.message);
      } else {
        setSuccess("Check your email for a password reset link.");
      }
    }

    setLoading(false);
  }

  const heading = mode === "signup" ? "Create your account" : mode === "signin" ? "Welcome back" : "Reset your password";
  const submitLabel = mode === "signup" ? "Create account" : mode === "signin" ? "Sign in" : "Send reset link";

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/beaver.png" alt="Lease Beaver" className="w-40 h-40 object-contain mx-auto mb-3" />
          <p className="text-gray-600">Automated lease analysis for UIUC students</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-green-900/5 border border-white/50 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">{heading}</h2>

          {success ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-2 shadow-inner border border-green-100">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm text-green-700 bg-green-50 rounded-lg px-4 py-3">{success}</p>
              <button
                onClick={() => switchMode("signin")}
                className="block w-full text-sm text-green-700 font-medium mt-2"
              >
                Back to sign in →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@illinois.edu"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white/50 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all"
                />
              </div>

              {mode !== "forgot" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        onClick={() => switchMode("forgot")}
                        className="text-xs text-green-700 hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white/50 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all"
                  />
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-green-600 text-white font-medium rounded-xl shadow-md shadow-green-600/20 hover:shadow-green-600/40 hover:-translate-y-0.5 hover:bg-green-700 disabled:opacity-50 disabled:hover:translate-y-0 transition-all duration-300"
              >
                {loading ? "Please wait…" : submitLabel}
              </button>
            </form>
          )}

          {!success && (
            <p className="mt-6 text-center text-sm text-gray-500">
              {mode === "signup" ? (
                <>
                  Already have an account?{" "}
                  <button onClick={() => switchMode("signin")} className="text-green-700 font-medium">Sign in</button>
                </>
              ) : mode === "signin" ? (
                <>
                  New here?{" "}
                  <button onClick={() => switchMode("signup")} className="text-green-700 font-medium">Create an account</button>
                </>
              ) : (
                <>
                  Remember it?{" "}
                  <button onClick={() => switchMode("signin")} className="text-green-700 font-medium">Back to sign in</button>
                </>
              )}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
