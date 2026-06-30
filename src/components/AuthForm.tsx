"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignUp = mode === "signup";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">LeaseCheck CU</h1>
          <p className="mt-2 text-gray-600">
            AI-powered lease analysis for UIUC students
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-4">📧</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Check your email
              </h2>
              <p className="text-gray-600">
                We sent a {isSignUp ? "sign-up" : "sign-in"} link to{" "}
                <strong>{email}</strong>. Click it to continue.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                {isSignUp ? "Create your account" : "Welcome back"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@illinois.edu"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {loading
                    ? "Sending…"
                    : isSignUp
                      ? "Sign up with email link"
                      : "Send sign-in link"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                {isSignUp ? (
                  <>
                    Already have an account?{" "}
                    <a href="/login" className="text-green-700 font-medium">
                      Sign in
                    </a>
                  </>
                ) : (
                  <>
                    New here?{" "}
                    <a href="/signup" className="text-green-700 font-medium">
                      Sign up
                    </a>
                  </>
                )}
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
