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

export default function DashboardPage() {
  const [currentNiche, setCurrentNiche] = useState("ai-tools");

  // Fetch real-time data from Supabase
  const { trends, loading: trendsLoading } = useTrends(currentNiche);
  const { posts, loading: postsLoading } = usePosts(currentNiche);

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
      <Sidebar currentNiche={currentNiche} />
      
      <div className="flex flex-col flex-1 pl-64 h-full relative">
        <Header 
          currentNiche={currentNiche} 
          onNicheChange={setCurrentNiche} 
        />
        
        <main className="flex-1 overflow-y-auto bg-transparent p-8">
          <div className="mx-auto max-w-7xl">
            <ShimmerText
              text="Trending Now"
              className="text-3xl font-bold tracking-tight mb-2 font-heading"
            />
            <p className="text-slate-400 mb-8">
              Real-time developer trends clustered from GitHub, Hacker News, Product Hunt, and Hugging Face.
            </p>

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

                    {/* Bottom row: The raw scraped posts making up those clusters */}
                    <PostFeed 
                      posts={posts} 
                      title="Raw Scrape Activity (Live Feed)" 
                    />
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
