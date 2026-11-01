
"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        setMessage(
          data.session
            ? "Account created successfully!"
            : "Account created. Please check your email to confirm your account."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        window.location.href = "/";
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080d15] text-white flex items-center justify-center p-5">
      <div className="w-full max-w-md rounded-2xl border border-[#1d2b40] bg-[#0c1420] p-7 shadow-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 text-3xl">
            🤖
          </div>

          <h1 className="text-2xl font-bold">
            YouTube AI Agent
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Your Personal AI Channel Manager
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-xl bg-[#080d15] p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
            className={`rounded-lg py-3 text-sm font-semibold ${
              mode === "login"
                ? "bg-blue-600 text-white"
                : "text-slate-400"
            }`}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setMessage("");
            }}
            className={`rounded-lg py-3 text-sm font-semibold ${
              mode === "signup"
                ? "bg-blue-600 text-white"
                : "text-slate-400"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-[#26364d] bg-[#080d15] px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full rounded-xl border border-[#26364d] bg-[#080d15] px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          {message && (
            <p className="rounded-lg bg-blue-500/10 p-3 text-sm text-blue-300 break-words">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 font-semibold transition hover:bg-blue-500 disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Login to Dashboard"
              : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Secure authentication powered by Supabase
        </p>
      </div>
    </main>
  );
}
