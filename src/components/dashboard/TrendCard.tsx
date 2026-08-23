"use client";

import { Trend, PLATFORM_META, Platform } from "@/lib/types";
import { ArrowUpRight, TrendingUp, Layers, Activity, Sparkles, Loader2, ExternalLink, ArrowRight, X } from "lucide-react";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, animate, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

interface TrendCardProps {
  trend: Trend;
  index: number;
}

export function TrendCard({ trend, index }: TrendCardProps) {
  const [brief, setBrief] = useState<string | null>(trend.research_brief || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // 3. Magnetic Hover Tilt calculation (only applies to the base card)
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isExpanded) return;
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

  const layoutId = `trend-card-${trend.id}`;

  const ModalContent = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 md:px-0">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#08080a]/95"
        onClick={() => setIsExpanded(false)}
      />
      <motion.div
        layoutId={layoutId}
        className="relative z-50 flex flex-col w-full max-w-4xl h-[85vh] rounded-3xl border border-white/10 bg-[#08080a] shadow-2xl overflow-hidden"
      >
        <button
          onClick={() => setIsExpanded(false)}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div 
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
        />

        <div className="p-8 flex-1 flex flex-col min-h-0">
          {/* Modal Header */}
          <div className="flex flex-col gap-4 mb-8">
             <div className="flex items-center gap-3">
               <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-sm font-bold text-slate-300 border border-white/10">
                 #{index + 1}
               </span>
               <h3 className="text-2xl font-bold leading-tight text-white pr-12">
                 {trend.cluster_label}
               </h3>
             </div>
             
             <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/20">
                  <Activity className="w-3.5 h-3.5" />
                  Score: {trend.trend_score?.toFixed(1)}
                </div>
                <span>{trend.post_count} posts across {trend.platforms?.length} platforms</span>
             </div>
          </div>

          <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-6">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              AI Research Brief
            </h4>
          </div>

          {/* Scrollable brief content */}
          <div className="flex-1 overflow-y-auto pr-4 text-sm text-slate-300 scrollbar-thin">
            {isLoading ? (
              <div className="flex h-full flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <span className="text-sm text-slate-500">Synthesizing comprehensive brief...</span>
              </div>
            ) : brief ? (
              <div className="prose prose-invert prose-p:mb-4 prose-headings:text-white prose-headings:font-bold max-w-none text-slate-300">
                <ReactMarkdown>{streamedText}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-2xl">
                <Sparkles className="w-12 h-12 text-slate-600 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Generate a deeper analysis</h3>
                <p className="text-slate-400 mb-6 max-w-md">Our AI can read the source posts and synthesize a complete research brief summarizing the community sentiment and technical details.</p>
                <button
                  type="button"
                  onClick={handleGenerateBrief}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-500 transition-all shadow-md hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Full AI Brief</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </motion.div>
    </div>
  );

  return (
    <>
      <motion.div
        layoutId={layoutId}
        className="group relative flex flex-col justify-between h-[380px] w-full rounded-2xl border border-white/10 bg-[#08080a] shadow-xl hover:shadow-[0_8px_32px_rgba(99,102,241,0.05)] transition-shadow overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={isExpanded ? { rotateX: 0, rotateY: 0 } : { rotateX: tilt.x, rotateY: tilt.y }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="p-6 flex flex-col h-full relative z-10">
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

          {/* Footer Stats */}
          <div className="border-t border-white/5 pt-4 mt-auto">
            <div className="flex items-center justify-between mb-4 text-[10px] font-mono text-slate-500">
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

            {/* Click to read summary button */}
            <button
              onClick={() => setIsExpanded(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 hover:border-white/20 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              Click to read summary
            </button>
          </div>
        </div>
      </motion.div>

      {/* Expanded Overlay Portal/Modal */}
      {mounted && createPortal(
        <AnimatePresence>
          {isExpanded && <ModalContent />}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
