"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { TrendGrid } from "@/components/dashboard/TrendGrid";
import { mockTrends } from "@/lib/mock-data";

export default function DashboardPage() {
  const [currentNiche, setCurrentNiche] = useState("ai-tools");

  // In Phase 9, this will be replaced with a Supabase hook
  // For now, we filter the mock data by the selected niche
  const activeTrends = mockTrends.filter((t) => t.niche === currentNiche);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar currentNiche={currentNiche} />
      
      <div className="flex flex-col flex-1 pl-64 h-full">
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

            {/* Dashboard grid */}
            <TrendGrid trends={activeTrends} />
          </div>
        </main>
      </div>
    </div>
  );
}
