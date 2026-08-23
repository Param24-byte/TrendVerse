"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Lock, Mail, Loader2, ArrowRight, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        toast.success("Check your email to confirm registration!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-emerald-500/5 blur-3xl" />

      {/* Main glass box */}
      <div className="w-full max-w-md rounded-3xl border border-white/5 bg-[#0a0f1e]/40 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white font-heading">
            {isSignUp ? "Create your account" : "Welcome to TrendVerse"}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {isSignUp
              ? "Sign up to track and save developer trends"
              : "Sign in to access advanced trend analytics"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="mt-8 space-y-4">
          <div className="relative">
            <Mail className="absolute top-3 left-3 h-5 w-5 text-slate-500" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/5 bg-[#070b15]/60 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute top-3 left-3 h-5 w-5 text-slate-500" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/5 bg-[#070b15]/60 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? "Register" : "Sign In"}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-slate-500">
            {isSignUp ? "Already have an account?" : "New to TrendVerse?"}
          </span>{" "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-medium text-indigo-400 hover:text-indigo-300 focus:outline-none"
          >
            {isSignUp ? "Sign In" : "Register here"}
          </button>
        </div>
      </div>
    </div>
  );
}
