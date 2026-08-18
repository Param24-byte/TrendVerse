"use client";

import { Trend } from "@/lib/types";
import { PLATFORM_META } from "@/lib/types";
import { ArrowUpRight, TrendingUp, Layers, Activity, Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface TrendCardProps {
  trend: Trend;
  index: number;
}

export function TrendCard({ trend, index }: TrendCardProps) {
  const [brief, setBrief] = useState<string | null>(trend.research_brief || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateBrief = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (brief) {
      setIsExpanded(!isExpanded);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/brief/${trend.id}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate brief");
      const data = await res.json();
      setBrief(data.brief);
      setIsExpanded(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-indigo-500/50">
      {/* Background Gradient Blob */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl transition-all group-hover:bg-indigo-500/20" />
      
      {/* Header (Score & Rank) */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-sm font-bold text-slate-300 border border-white/10">
            #{index + 1}
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Velocity Score
            </span>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
              <span className="text-lg font-bold">{trend.trend_score?.toFixed(1) || "0.0"}</span>
            </div>
          </div>
        </div>
        
        {/* Growth Badge */}
        {trend.growth_rate && trend.growth_rate > 1 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
            <ArrowUpRight className="h-3 w-3" />
            {((trend.growth_rate - 1) * 100).toFixed(0)}%
          </span>
        )}
      </div>

      {/* Main Content */}
      <div className="mb-6">
        <h3 className="mb-2 text-xl font-bold leading-tight text-white group-hover:text-indigo-300 transition-colors">
          {trend.cluster_label}
        </h3>
        <p className="line-clamp-2 text-sm text-slate-400">
          Leading post: {trend.representative_title}
        </p>
      </div>

      {/* Footer Stats & Platforms */}
      <div className="flex items-center justify-between border-t border-white/10 pt-4">
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <Layers className="h-4 w-4 text-slate-500" />
            <span>{trend.post_count} posts</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <Activity className="h-4 w-4 text-slate-500" />
            <span>{trend.engagement_velocity?.toFixed(0)} eng/hr</span>
          </div>
        </div>

        {/* Platform Icons */}
        <div className="flex -space-x-2">
          {trend.platforms?.slice(0, 4).map((platform) => {
            const meta = PLATFORM_META[platform];
            if (!meta) return null;
            return (
              <div 
                key={platform}
                title={meta.label}
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0a0f1e] text-xs ${meta.badgeClass}`}
              >
                {meta.emoji}
              </div>
            );
          })}
          {trend.platforms && trend.platforms.length > 4 && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0a0f1e] bg-slate-800 text-[10px] font-bold text-slate-300">
              +{trend.platforms.length - 4}
            </div>
          )}
        </div>
      </div>

      {/* AI Brief Section */}
      <div className="mt-6 border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={handleGenerateBrief}
          disabled={isLoading}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500/10 px-4 py-2.5 text-sm font-medium text-indigo-300 transition-all hover:bg-indigo-500/20 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 transition-transform group-hover:scale-110" />
          )}
          {isLoading ? "Generating Brief..." : brief ? (isExpanded ? "Hide AI Brief" : "Read AI Brief") : "Generate AI Brief"}
          {brief && !isLoading && (
             isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {error && (
          <p className="mt-2 text-center text-xs text-red-400">{error}</p>
        )}

        {isExpanded && brief && (
          <div className="mt-4 animate-in fade-in slide-in-from-top-2 rounded-xl bg-black/20 p-4 text-sm leading-relaxed text-slate-300 prose prose-invert prose-p:mb-2 prose-headings:mb-3 prose-headings:text-white prose-a:text-indigo-400 max-w-none border border-white/5">
            <ReactMarkdown>{brief}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
