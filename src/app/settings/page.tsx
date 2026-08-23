"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/client";
import { Loader2, User, Bell, Database, Save, Play, ShieldAlert, CheckCircle2, XCircle, LogOut } from "lucide-react";
import { NICHES, PLATFORM_META } from "@/lib/types";
import toast from "react-hot-toast";
import ShimmerText from "@/components/kokonutui/shimmer-text";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
  const [pipelineNiche, setPipelineNiche] = useState("ai-tools");
  const [pipelineResult, setPipelineResult] = useState<any>(null);

  const supabase = createClient();
  const router = useRouter();

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

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Signed out successfully");
      router.push("/login");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to sign out");
    }
  };

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
        body: JSON.stringify({ niche: pipelineNiche }),
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
              <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-white/5 bg-[#0a0f1e]/40">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <p className="text-sm font-medium text-slate-400">Loading user settings...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Profile Card */}
                <div className="rounded-2xl border border-white/5 bg-[#0e1324]/20 p-6 sm:p-8">
                  <div className="flex items-center gap-4 border-b border-white/5 pb-4 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
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

                {/* Niche & Notifications Preferences */}
                <div className="rounded-2xl border border-white/5 bg-[#0e1324]/20 p-6 sm:p-8">
                  <div className="flex items-center gap-4 border-b border-white/5 pb-4 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                      <Bell className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white font-heading">Preferences</h2>
                      <p className="text-xs text-slate-400">Choose dashboard niches and notifications.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                        Default Active Niche
                      </label>
                      <select
                        value={defaultNiche}
                        onChange={(e) => setDefaultNiche(e.target.value)}
                        className="w-full rounded-xl border border-white/5 bg-[#070b15]/60 px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                      >
                        {NICHES.map((n) => (
                          <option key={n.id} value={n.id} className="bg-[#0e1324]">
                            {n.icon} {n.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Notification Channels
                      </label>
                      
                      {/* Email Switch with satisfies custom layout knob motion */}
                      <div className="flex items-center justify-between p-4 rounded-xl bg-[#070b15]/40 border border-white/5">
                        <div>
                          <p className="text-sm font-semibold text-white">Email Research Summaries</p>
                          <p className="text-xs text-slate-500">Receive weekly summaries of top niches.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEmailNotifications(!emailNotifications)}
                          className={cn(
                            "relative flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer",
                            emailNotifications ? "bg-indigo-600" : "bg-white/5 border border-white/10"
                          )}
                        >
                          <motion.div
                            layout
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="h-4 w-4 rounded-full bg-white shadow-md"
                            style={{ 
                              marginLeft: emailNotifications ? "22px" : "2px",
                              marginRight: emailNotifications ? "2px" : "22px"
                            }}
                          />
                        </button>
                      </div>

                      {/* Velocity switch */}
                      <div className="flex items-center justify-between p-4 rounded-xl bg-[#070b15]/40 border border-white/5">
                        <div>
                          <p className="text-sm font-semibold text-white">Velocity Spike Alerts</p>
                          <p className="text-xs text-slate-500">Alert me when a trend score jumps by over 50%.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setVelocitySpikes(!velocitySpikes)}
                          className={cn(
                            "relative flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer",
                            velocitySpikes ? "bg-indigo-600" : "bg-white/5 border border-white/10"
                          )}
                        >
                          <motion.div
                            layout
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="h-4 w-4 rounded-full bg-white shadow-md"
                            style={{ 
                              marginLeft: velocitySpikes ? "22px" : "2px",
                              marginRight: velocitySpikes ? "2px" : "22px"
                            }}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={handleSaveSettings}
                        disabled={savingSettings}
                        className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-all disabled:opacity-50"
                      >
                        {savingSettings ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        <span>Save Preferences</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* API & Scraper Data Sources */}
                <div className="rounded-2xl border border-white/5 bg-[#0e1324]/20 p-6 sm:p-8">
                  <div className="flex items-center gap-4 border-b border-white/5 pb-4 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                      <Database className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white font-heading">Data Ingestion Pipeline</h2>
                      <p className="text-xs text-slate-400">View source scraper intervals and manually trigger runs.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Platform Status */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                        Connected Platforms & Schedules
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.keys(PLATFORM_META).map((plat) => {
                          const meta = PLATFORM_META[plat as any];
                          return (
                            <div
                              key={plat}
                              className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-[#070b15]/40"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{meta.emoji}</span>
                                <span className="text-xs font-semibold text-white">{meta.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-slate-500">Every 30m</span>
                                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Manual Scrape Trigger */}
                    <div className="rounded-xl border border-white/5 bg-[#070b15]/30 p-4 pt-5">
                      <h3 className="text-sm font-bold text-white mb-2 font-heading">Orchestrator Run (Scraper & ML Pipeline)</h3>
                      <p className="text-xs text-slate-500 mb-4">
                        Manually trigger the orchestrator. This executes the selected niche's scraper scripts, normalizes the data to Supabase, generates vector embeddings, and runs ML clustering.
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <select
                          value={pipelineNiche}
                          onChange={(e) => setPipelineNiche(e.target.value)}
                          className="rounded-xl border border-white/5 bg-[#070b15]/60 px-4 py-2.5 text-xs font-semibold text-white focus:border-indigo-500 focus:outline-none"
                        >
                          {NICHES.map((n) => (
                            <option key={n.id} value={n.id} className="bg-[#0e1324]">
                              {n.icon} {n.label}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={handleTriggerPipeline}
                          disabled={runningPipeline}
                          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-all disabled:opacity-50"
                        >
                          {runningPipeline ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4.5 w-4.5" />
                          )}
                          <span>{runningPipeline ? "Running Pipeline..." : "Execute Pipeline"}</span>
                        </button>
                      </div>

                      {/* Pipeline results panel */}
                      {pipelineResult && (
                        <div className="mt-4 rounded-xl border border-white/5 bg-[#050812] p-4 text-xs animate-in fade-in slide-in-from-top-2">
                          <h4 className="font-bold text-slate-300 border-b border-white/5 pb-2 mb-3">Pipeline Executed: {NICHES.find(n => n.id === pipelineResult.niche)?.label}</h4>
                          <div className="grid grid-cols-2 gap-y-2 gap-x-4 font-mono text-slate-400 mb-4">
                            <div>Total Ingested: <span className="text-white font-bold">{pipelineResult.total_posts} posts</span></div>
                            <div>Duration: <span className="text-white font-bold">{(pipelineResult.duration_ms / 1000).toFixed(1)}s</span></div>
                          </div>
                          
                          <div className="space-y-1.5">

                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Danger Zone Card */}
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 sm:p-8">
                  <div className="flex items-center gap-4 border-b border-rose-500/10 pb-4 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-rose-400 font-heading">Danger Zone</h2>
                      <p className="text-xs text-rose-300/60">Destructive actions for your account.</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">Sign Out of Account</p>
                      <p className="text-xs text-slate-500">Sign out of this session. You will need to log back in.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-6 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
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
