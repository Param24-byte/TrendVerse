"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { TrendGrid } from "@/components/dashboard/TrendGrid";
import { PostFeed } from "@/components/dashboard/PostFeed";
import { useTrends } from "@/hooks/useTrends";
import { usePosts } from "@/hooks/usePosts";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [currentNiche, setCurrentNiche] = useState("ai-tools");

  // Fetch real-time data from Supabase
  const { trends, loading: trendsLoading } = useTrends(currentNiche);
  const { posts, loading: postsLoading } = usePosts(currentNiche);

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
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2 font-heading">
              Trending Now
            </h1>
            <p className="text-slate-400 mb-8">
              Real-time developer trends clustered from GitHub, Hacker News, Product Hunt, and Hugging Face.
            </p>

            {(trendsLoading || postsLoading) ? (
              <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-white/5 bg-white/5">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <p className="text-sm font-medium text-slate-400">Loading live data from Supabase...</p>
              </div>
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
          </div>
        </main>
      </div>
    </div>
  );
}
