"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function DashboardPage() {
  const [currentNiche, setCurrentNiche] = useState("ai-tools");

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
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
              Trending Now
            </h1>
            <p className="text-slate-400 mb-8">
              Real-time developer trends clustered from GitHub, Hacker News, Product Hunt, and Hugging Face.
            </p>

            {/* Dashboard grid will go here */}
            <div className="rounded-xl border border-dashed border-white/20 p-12 text-center text-slate-500">
              Trend Grid goes here
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
