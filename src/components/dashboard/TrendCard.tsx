"use client";

import { Trend, PLATFORM_META, Platform } from "@/lib/types";
import { Sparkles, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { TrendModal } from "./TrendModal";

interface TrendCardProps {
  trend: Trend;
  index: number;
}

export function TrendCard({ trend, index }: TrendCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const sourceUrl = trend.trend_posts?.find(tp => tp.posts?.url)?.posts?.url;
  const firstPlatform = trend.platforms?.[0];
  const accentColor = PLATFORM_META[firstPlatform as Platform]?.color || "#818cf8";
  const layoutId = `trend-card-${trend.id}`;

  return (
    <>
      <motion.div
        layoutId={layoutId}
        className="group relative flex flex-col justify-between h-[380px] w-full rounded-2xl border border-white/10 bg-[#08080a] shadow-lg hover:shadow-[0_8px_32px_rgba(99,102,241,0.05)] transition-shadow overflow-hidden"
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

                {/* Platform Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {trend.platforms?.map((plat) => (
                    <span key={plat} className="text-xs font-semibold px-2 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300">
                      {PLATFORM_META[plat as Platform]?.label || plat}
                    </span>
                  ))}
                </div>
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
          {isExpanded && (
            <TrendModal 
              trend={trend} 
              index={index} 
              layoutId={layoutId} 
              accentColor={accentColor} 
              onClose={() => setIsExpanded(false)} 
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
