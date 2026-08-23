"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/client";
import { Loader2, User, Database } from "lucide-react";
import { NICHES } from "@/lib/types";
import toast from "react-hot-toast";
import ShimmerText from "@/components/kokonutui/shimmer-text";

export default function SettingsPage() {
  const [currentNiche, setCurrentNiche] = useState("ai-tools");
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Preference fields
  const [defaultNiche, setDefaultNiche] = useState("ai-tools");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [velocitySpikes, setVelocitySpikes] = useState(true);

  const [savingSettings, setSavingSettings] = useState(false);
  const [runningPipeline, setRunningPipeline] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadUserData() {
      setLoadingUser(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setDefaultNiche(user.user_metadata?.default_niche || "ai-tools");
        setEmailNotifications(user.user_metadata?.email_notifications !== false);
        setVelocitySpikes(user.user_metadata?.velocity_spikes !== false);
      }
      setLoadingUser(false);
    }
    loadUserData();
  }, [supabase]);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          default_niche: defaultNiche,
          email_notifications: emailNotifications,
          velocity_spikes: velocitySpikes,
        },
      });
      if (error) throw error;
      toast.success("Settings saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTriggerPipeline = async () => {
    setRunningPipeline(true);
    setPipelineResult(null);
    toast("Pipeline started. Running scrapers & clustering...", { icon: "⚙️" });

    try {
      const res = await fetch("/api/ingest/run-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: defaultNiche || "ai-tools" }),
      });

      if (!res.ok) throw new Error("Pipeline run failed");
      const data = await res.json();
      setPipelineResult(data);
      toast.success(`Pipeline completed! Inserted ${data.total_posts} posts.`);
    } catch (err: any) {
      toast.error(err.message || "Pipeline execution failed");
    } finally {
      setRunningPipeline(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex flex-col flex-1 pl-16 h-full relative">
        <Header />

        <main className="flex-1 overflow-y-auto bg-transparent p-8">
          <div className="mx-auto max-w-4xl">
            <ShimmerText
              text="Settings"
              className="text-3xl font-bold tracking-tight mb-2 font-heading"
            />
            <p className="text-slate-400 mb-8">
              Manage your user profile, active niche preferences, notifications, and run scrapers.
            </p>

            {loadingUser ? (
              <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-[#0a0a0c]">
                <Loader2 className="h-8 w-8 animate-spin text-[#f5654a]" />
                <p className="text-sm font-medium text-slate-400">Loading user settings...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Profile Card */}
                <div className="rounded-2xl border border-white/10 bg-[#0a0a0c] p-6 sm:p-8">
                  <div className="flex items-center gap-4 border-b border-white/5 pb-4 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5654a]/10 text-[#f5654a] border border-[#f5654a]/20">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white font-heading">Profile</h2>
                      <p className="text-xs text-slate-400">Your account identity details.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Email Address
                      </label>
                      <input
                        type="text"
                        disabled
                        value={user?.email || ""}
                        className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        User ID
                      </label>
                      <input
                        type="text"
                        disabled
                        value={user?.id || ""}
                        className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-xs font-mono text-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>


                {/* API & Scraper Data Sources */}
                <div className="rounded-2xl border border-white/10 bg-[#0a0a0c] p-6 sm:p-8">
                  <div className="flex items-center gap-4 border-b border-white/5 pb-4 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4fc8ae]/10 text-[#4fc8ae] border border-[#4fc8ae]/20">
                      <Database className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white font-heading">Data Ingestion Pipeline</h2>
                      <p className="text-xs text-slate-400">Manually trigger scraper and ML pipeline runs.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Manual Scrape Trigger */}
                    <div className="rounded-xl border border-white/10 bg-[#121216]/70 p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-bold text-white mb-1 font-heading">Orchestrator Run (Scraper & ML Pipeline)</h3>
                          <p className="text-xs text-slate-400 max-w-xl">
                            Executes scraper scripts across all connected sources, normalizes data, generates vector embeddings, and runs ML clustering.
                          </p>
                        </div>
                        
                        <button
                          type="button"
                          onClick={handleTriggerPipeline}
                          disabled={runningPipeline}
                          className="group relative inline-flex items-center justify-center text-xs font-semibold rounded-xl bg-gray-900 border border-white/10 px-6 py-3 text-white transition-all duration-200 hover:bg-gray-800 hover:border-white/20 hover:shadow-lg hover:-translate-y-0.5 hover:shadow-black/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer flex-shrink-0"
                        >
                          {runningPipeline ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin text-white mr-2" />
                              <span>Running Pipeline...</span>
                            </>
                          ) : (
                            <>
                              <span>Execute Pipeline</span>
                              <svg
                                aria-hidden="true"
                                viewBox="0 0 10 10"
                                height="10"
                                width="10"
                                fill="none"
                                className="mt-0.5 ml-2 -mr-1 stroke-white stroke-2"
                              >
                                <path
                                  d="M0 5h7"
                                  className="transition opacity-0 group-hover:opacity-100"
                                />
                                <path
                                  d="M1 1l4 4-4 4"
                                  className="transition group-hover:translate-x-[3px]"
                                />
                              </svg>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Pipeline results panel */}
                      {pipelineResult && (
                        <div className="mt-5 rounded-xl border border-white/5 bg-[#050812] p-4 text-xs animate-in fade-in slide-in-from-top-2">
                          <h4 className="font-bold text-slate-300 border-b border-white/5 pb-2 mb-3">Pipeline Executed: {NICHES.find(n => n.id === pipelineResult.niche)?.label}</h4>
                          <div className="grid grid-cols-2 gap-y-2 gap-x-4 font-mono text-slate-400">
                            <div>Total Ingested: <span className="text-white font-bold">{pipelineResult.total_posts} posts</span></div>
                            <div>Duration: <span className="text-white font-bold">{(pipelineResult.duration_ms / 1000).toFixed(1)}s</span></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
