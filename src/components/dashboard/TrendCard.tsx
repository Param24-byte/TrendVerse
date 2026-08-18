import { Trend } from "@/lib/types";
import { PLATFORM_META } from "@/lib/types";
import { ArrowUpRight, TrendingUp, Layers, Activity } from "lucide-react";

interface TrendCardProps {
  trend: Trend;
  index: number;
}

export function TrendCard({ trend, index }: TrendCardProps) {
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
    </div>
  );
}
