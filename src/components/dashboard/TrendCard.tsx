"use client";

import { Trend } from "@/lib/types";
import { PLATFORM_META, Platform } from "@/lib/types";
import { ArrowUpRight, TrendingUp, Layers, Activity, Sparkles, Loader2, ExternalLink, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, animate } from "framer-motion";

interface TrendCardProps {
  trend: Trend;
  index: number;
}

export function TrendCard({ trend, index }: TrendCardProps) {
  const [brief, setBrief] = useState<string | null>(trend.research_brief || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);

  // 1. Score count-up animation
  const [displayScore, setDisplayScore] = useState(0);
  useEffect(() => {
    const controls = animate(0, trend.trend_score || 0, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate: (value) => setDisplayScore(Math.round(value * 10) / 10),
    });
    return () => controls.stop();
  }, [trend.trend_score]);

  // 2. Word-by-word streaming typing effect for AI briefs
  const [streamedText, setStreamedText] = useState("");
  useEffect(() => {
    if (!brief) {
      setStreamedText("");
      return;
    }
    let i = 0;
    const words = brief.split(" ");
    setStreamedText("");
    const interval = setInterval(() => {
      if (i < words.length) {
        setStreamedText((prev) => prev + (prev ? " " : "") + words[i]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 20); // 20ms per word
    return () => clearInterval(interval);
  }, [brief]);

  // 3. Magnetic Hover Tilt calculation
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Rotate max 4 degrees
    const rotateX = -(y / (rect.height / 2)) * 4;
    const rotateY = (x / (rect.width / 2)) * 4;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsFlipped(false);
  };

  // 4. Generate consistent sparkline shape based on trend.id hash
  const sparklineData = Array.from({ length: 6 }, (_, i) => {
    const charCode = trend.id.charCodeAt(i % trend.id.length) || 10;
    return { value: (charCode % 40) + i * 3 };
  });
  const sparklinePoints = sparklineData.map((d, i) => `${i * 12},${35 - (d.value / 60) * 25}`).join(" ");

  const sourceUrl = trend.trend_posts?.find(tp => tp.posts?.url)?.posts?.url;

  // 5. Circular score gauge params
  const scorePercent = Math.min((trend.trend_score || 0) * 10, 100);
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scorePercent / 100) * circumference;

  // Accent color from first platform
  const firstPlatform = trend.platforms?.[0];
  const accentColor = PLATFORM_META[firstPlatform as Platform]?.color || "#818cf8";

  const handleGenerateBrief = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/brief/${trend.id}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate brief");
      const data = await res.json();
      setBrief(data.brief);
      setReportId(data.reportId);
      toast.success("AI brief generated!");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || "Failed to generate brief");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="group relative h-[380px] w-full [perspective:2000px] cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={cn(
          "relative h-full w-full rounded-2xl transition-[transform] duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)]"
        )}
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateY(${isFlipped ? 180 : 0}deg) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
      >
        {/* FRONT OF CARD */}
        <div
          className={cn(
            "absolute inset-0 h-full w-full p-6 flex flex-col justify-between overflow-hidden",
            "[backface-visibility:hidden] [transform:rotateY(0deg)]",
            "rounded-2xl border border-white/10 bg-[#08080a] shadow-xl hover:shadow-[0_8px_32px_rgba(99,102,241,0.05)] transition-shadow"
          )}
        >
          {/* Top Edge Accent Bar */}
          <div 
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
          />

          {/* Header */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-sm font-bold text-slate-300 border border-white/10">
                  #{index + 1}
                </span>

                {/* Score Radial Gauge */}
                <div className="relative flex h-12 w-12 items-center justify-center shrink-0" title={`Velocity Score: ${trend.trend_score?.toFixed(1)}`}>
                  <svg className="w-12 h-12 transform -rotate-90">
                    <circle cx="24" cy="24" r={radius} className="stroke-white/5" strokeWidth="2.5" fill="transparent" />
                    <motion.circle 
                      cx="24" 
                      cy="24" 
                      r={radius} 
                      className="stroke-emerald-400" 
                      strokeWidth="3" 
                      fill="transparent" 
                      strokeDasharray={circumference}
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </svg>
                  <span className="absolute text-[10px] font-extrabold text-emerald-400 tabular-nums">
                    {displayScore.toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Sparkline Drawing Animation */}
              <div className="flex items-center h-8 pr-1" title="Hourly Ingestion Rate">
                <svg className="w-16 h-8 overflow-visible" viewBox="0 0 60 40">
                  <motion.polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    points={sparklinePoints}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                  />
                </svg>
              </div>
            </div>

            {/* Title / Description */}
            <div className="mb-4">
              {sourceUrl ? (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="group/link flex items-start gap-2"
                >
                  <h3 className="text-lg font-bold leading-tight text-white group-hover/link:text-indigo-400 transition-colors line-clamp-2">
                    {trend.cluster_label}
                  </h3>
                  <ExternalLink className="h-4 w-4 text-slate-500 opacity-0 group-hover/link:opacity-100 transition-opacity mt-1 flex-shrink-0" />
                </a>
              ) : (
                <h3 className="text-lg font-bold leading-tight text-white line-clamp-2">
                  {trend.cluster_label}
                </h3>
              )}
              <p className="mt-2 line-clamp-3 text-xs text-slate-400">
                Leading post: {trend.representative_title}
              </p>
            </div>
          </div>

          {/* Footer Stats & Interactions */}
          <div className="border-t border-white/5 pt-4">
            <div className="flex items-center justify-between mb-3 text-[10px] font-mono text-slate-500">
              <div className="flex gap-2">
                <span>{trend.post_count} posts</span>
                <span>•</span>
                <span>{trend.engagement_velocity?.toFixed(0)}/hr</span>
              </div>
              <div className="flex gap-1.5">
                {trend.platforms?.map((plat) => (
                  <span key={plat} title={PLATFORM_META[plat as Platform]?.label}>
                    {PLATFORM_META[plat as Platform]?.emoji}
                  </span>
                ))}
              </div>
            </div>

            {/* Sparkles Flip Hint */}
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-indigo-400/80">
              <Sparkles className="h-3 w-3 animate-pulse" />
              <span>Hover to read AI Brief</span>
            </div>
          </div>
        </div>

        {/* BACK OF CARD */}
        <div
          className={cn(
            "absolute inset-0 h-full w-full p-6 flex flex-col justify-between",
            "[backface-visibility:hidden] [transform:rotateY(180deg)]",
            "rounded-2xl border border-white/5 bg-[#08080a] shadow-xl"
          )}
        >
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                AI Research Brief
              </h4>
              <span className="text-[10px] font-mono text-slate-500">#{index + 1}</span>
            </div>

            {/* Scrollable brief content */}
            <div className="flex-1 overflow-y-auto pr-1 text-xs text-slate-300 scrollbar-thin">
              {isLoading ? (
                <div className="flex h-full flex-col items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                  <span className="text-[10px] text-slate-500">Synthesizing brief...</span>
                </div>
              ) : brief ? (
                <div className="prose prose-invert prose-p:mb-2 prose-headings:text-white prose-headings:font-bold max-w-none text-slate-300">
                  <ReactMarkdown>{streamedText}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center p-4">
                  <p className="text-slate-500 mb-3 text-[11px]">No brief generated for this trend yet.</p>
                  <button
                    type="button"
                    onClick={handleGenerateBrief}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-all shadow-md"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate AI Brief</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action button */}
          {brief && !isLoading && (
            <div className="border-t border-white/5 pt-3 mt-3">
              {reportId ? (
                <Link
                  href={`/briefs/${reportId}`}
                  className="flex items-center justify-between w-full text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <span>Open Full Research Report</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  href="/briefs"
                  className="flex items-center justify-between w-full text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <span>Go to Research Center</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
