"use client";

import { Trend, PLATFORM_META, Platform } from "@/lib/types";
import { Activity, Sparkles, Loader2, X } from "lucide-react";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

interface TrendModalProps {
  trend: Trend;
  index: number;
  layoutId: string;
  accentColor: string;
  onClose: () => void;
}

export function TrendModal({ trend, index, layoutId, accentColor, onClose }: TrendModalProps) {
  const [brief, setBrief] = useState<string | null>(trend.research_brief || null);
  const [isLoading, setIsLoading] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
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
    }, 20);
    return () => clearInterval(interval);
  }, [brief]);

  const handleGenerateBrief = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);
    try {
      const res = await fetch(`/api/brief/${trend.id}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate brief");
      const data = await res.json();
      setBrief(data.brief);
      setReportId(data.reportId);
      toast.success("AI brief generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate brief");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 md:px-0">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#08080a]/95"
        onClick={onClose}
      />
      <motion.div
        layoutId={layoutId}
        className="relative z-50 flex flex-col w-full max-w-4xl h-[85vh] rounded-3xl border border-white/10 bg-[#08080a] shadow-2xl overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div 
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
        />

        <div className="p-8 flex-1 flex flex-col min-h-0">
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
}
