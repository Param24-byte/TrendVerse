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
import { PLATFORM_META, Platform } from "@/lib/types";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

export default function DashboardPage() {
  const [currentNiche, setCurrentNiche] = useState("ai-tools");

  // Fetch real-time data from Supabase
  const { trends, loading: trendsLoading } = useTrends(currentNiche);
  const { posts, loading: postsLoading } = usePosts(currentNiche);

  // Spotlight coordinates state
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Extract platform breakdown for donut
  const totalPosts = posts.length || 1;
  const donutData = Object.keys(PLATFORM_META)
    .map((plat) => {
      const count = posts.filter((p) => p.platform === plat).length;
      const meta = PLATFORM_META[plat as Platform];
      return { name: meta.label, value: count, color: meta.color };
    })
    .filter((d) => d.value > 0);

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
                  className="text-3xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-white via-indigo-200 to-slate-400 bg-clip-text text-transparent"
                />
                <p className="text-slate-400 text-xs sm:text-sm max-w-xl leading-relaxed">
                  Real-time developer trends clustered from GitHub, Hacker News, Product Hunt, and Hugging Face.
                </p>
              </div>

              {/* Platform Share Donut Chart */}
              {!trendsLoading && !postsLoading && posts.length > 0 && (
                <div className="h-[140px] w-full max-w-[350px] shrink-0 border border-white/5 bg-[#08080a]/60 rounded-2xl p-5 flex items-center justify-between gap-5 shadow-md">
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
                        <span className="font-mono font-bold text-slate-400 text-sm">{((d.value / posts.length) * 100).toFixed(0)}%</span>
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
