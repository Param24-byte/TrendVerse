"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { TrendGrid } from "@/components/dashboard/TrendGrid";
import { PostFeed } from "@/components/dashboard/PostFeed";
import { useTrends } from "@/hooks/useTrends";
import { usePosts } from "@/hooks/usePosts";
import ShimmerText from "@/components/kokonutui/shimmer-text";
import { motion, AnimatePresence } from "framer-motion";
import { PLATFORM_META, Platform, NICHES } from "@/lib/types";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [currentNiche, setCurrentNiche] = useState("ai-tools");

  // Fetch real-time data from Supabase
  const { trends, loading: trendsLoading } = useTrends(currentNiche);
  const { posts, platformCounts, loading: postsLoading } = usePosts(currentNiche);

  // Spotlight coordinates state
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Extract platform breakdown for donut using true DB counts
  const totalPosts = Object.values(platformCounts).reduce((a, b) => a + b, 0) || 1;
  const donutData = Object.keys(PLATFORM_META)
    .map((plat) => {
      const count = platformCounts[plat] || 0;
      const meta = PLATFORM_META[plat as Platform];
      return { name: meta.label, value: count, color: meta.color };
    })
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  // Shimmer skeleton loading grid
  const SkeletonGrid = () => (
    <div className="space-y-12">
      <div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-[380px] w-full rounded-2xl border border-white/5 bg-[#08080a] p-6 flex flex-col justify-between overflow-hidden relative shimmer"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-lg bg-white/5" />
                  <div className="h-5 w-16 rounded-full bg-white/5" />
                </div>
                <div className="h-6 w-3/4 rounded bg-white/5" />
                <div className="h-4 w-1/2 rounded bg-white/5" />
                <div className="h-16 w-full rounded bg-white/5" />
              </div>
              <div className="h-10 w-full rounded bg-white/5 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <div className="h-8 w-48 rounded bg-white/5 shimmer" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-36 w-full rounded-2xl border border-white/5 bg-[#08080a]/50 p-5 flex flex-col justify-between shimmer"
            >
              <div className="space-y-3">
                <div className="h-5 w-24 rounded bg-white/5" />
                <div className="h-6 w-3/4 rounded bg-white/5" />
              </div>
              <div className="h-4 w-1/3 rounded bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex flex-col flex-1 pl-16 h-full relative">
        <Header />
        
        <main className="flex-1 overflow-y-auto bg-transparent p-8">
          <div className="mx-auto max-w-7xl">
            {/* Spotlight Hero Header Box */}
            <div 
              onMouseMove={handleMouseMove}
              className="relative p-6 sm:p-8 rounded-2xl border border-white/5 bg-[#08080a]/40 overflow-hidden mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300"
              style={{
                background: `radial-gradient(circle 220px at ${coords.x}px ${coords.y}px, rgba(99, 102, 241, 0.08), transparent)`,
              }}
            >
              <div className="flex-1">
                <ShimmerText
                  text="Trending Now"
                  className="text-3xl font-extrabold tracking-tight mb-2 text-white"
                />
                <p className="text-slate-400 text-xs sm:text-sm max-w-xl leading-relaxed mb-4">
                  Real-time developer trends clustered from GitHub, Hacker News, Product Hunt, and Hugging Face.
                </p>
                <div className="flex flex-wrap gap-2">
                  {NICHES.map((niche) => {
                    const isActive = niche.id === currentNiche;
                    const Icon = (LucideIcons as any)[niche.lucideIcon] || LucideIcons.Circle;
                    return (
                      <button
                        key={niche.id}
                        onClick={() => setCurrentNiche(niche.id)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                          isActive
                            ? "bg-indigo-600 text-white"
                            : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {niche.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Platform Share Donut Chart */}
              {!trendsLoading && !postsLoading && posts.length > 0 && (
                <div className="h-[140px] w-full max-w-[350px] shrink-0 border border-white/5 bg-[#08080a]/60 rounded-2xl p-5 flex items-center justify-between gap-5 shadow-lg">
                  <div className="w-28 h-28 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          innerRadius={36}
                          outerRadius={50}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {donutData.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ background: "#08080a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "12px" }}
                          itemStyle={{ color: "#fff" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 flex flex-col justify-center text-xs space-y-1.5 overflow-hidden pr-1">
                    <p className="font-semibold text-slate-500 uppercase tracking-wider mb-2 text-[11px]">Platform Share</p>
                    {donutData.slice(0, 3).map((d) => (
                      <div key={d.name} className="flex items-center justify-between text-slate-300">
                        <span className="truncate pr-2">{d.name}</span>
                        <span className="font-mono font-bold text-slate-400 text-sm">{((d.value / totalPosts) * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentNiche}
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.98 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                {(trendsLoading || postsLoading) ? (
                  <SkeletonGrid />
                ) : trends.length === 0 && posts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                      <LucideIcons.SearchX className="w-8 h-8 text-slate-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">No data for this niche yet</h3>
                    <p className="text-slate-400 text-sm max-w-md mb-6">
                      This niche hasn't been scraped yet. Go to <strong className="text-white">Settings → Data Ingestion Pipeline</strong> and run the pipeline for this niche, or wait for the next automated cron cycle (every 30 minutes).
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Top row: The aggregated clusters */}
                    <TrendGrid trends={trends} />

                    {/* Labeled divider for visual card separation */}
                    <div className="relative my-12 flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-white/5" />
                      </div>
                      <span className="relative z-10 rounded-full bg-[#000000] border border-white/5 px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Raw Activity Stream
                      </span>
                    </div>

                    {/* Bottom row: The raw scraped posts making up those clusters */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.5 }}
                    >
                      <PostFeed 
                        posts={posts} 
                        title="Aggregated Scraped Posts" 
                      />
                    </motion.div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
