"use client";

import { useEffect, useState, useRef } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Search, Play, Pause, ExternalLink, MessageSquare, GitFork, ArrowUp, Zap, Star } from "lucide-react";
import { NICHES, PLATFORM_META, Platform } from "@/lib/types";
import toast from "react-hot-toast";
import ShimmerText from "@/components/kokonutui/shimmer-text";
import { motion, AnimatePresence } from "framer-motion";

export default function LiveActivityPage() {
  const [currentNiche, setCurrentNiche] = useState("ai-tools");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [isStreaming, setIsStreaming] = useState(true);

  const supabase = createClient();
  const channelRef = useRef<any>(null);

  // Fetch initial posts on niche mount
  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .eq("niche", currentNiche)
          .order("scraped_at", { ascending: false })
          .limit(40);

        if (error) {
          console.error("Error fetching posts:", error);
        } else {
          setPosts(data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [currentNiche, supabase]);

  // Subscription channel for real-time inserts
  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (!isStreaming) {
      return;
    }

    const channel = supabase
      .channel(`public:posts:niche=eq.${currentNiche}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
          filter: `niche=eq.${currentNiche}`,
        },
        (payload) => {
          setPosts((prevPosts) => {
            if (prevPosts.some((p) => p.id === payload.new.id)) {
              return prevPosts;
            }
            toast("New live post ingested!", { icon: "📥", duration: 1500 });
            // Dispatch custom window event to pulse header indicator
            window.dispatchEvent(new CustomEvent("new-post-ingested"));
            return [payload.new, ...prevPosts].slice(0, 40); // Keep last 40 posts
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [currentNiche, isStreaming, supabase]);

  const toggleStream = () => {
    setIsStreaming(!isStreaming);
    toast(isStreaming ? "Live stream paused" : "Live stream active", {
      icon: isStreaming ? "⏸️" : "▶️",
    });
  };

  const filteredPosts = posts.filter((p) => {
    const matchesPlatform = selectedPlatform === "all" || p.platform === selectedPlatform;
    const matchesSearch =
      !searchQuery ||
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.creator?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  // Calculate platform percentages
  const totalPosts = posts.length || 1;
  const platformBreakdown = Object.keys(PLATFORM_META)
    .map((plat) => {
      const count = posts.filter((p) => p.platform === plat).length;
      const percentage = (count / totalPosts) * 100;
      const meta = PLATFORM_META[plat as Platform];
      return { platform: plat, percentage, color: meta.color, label: meta.label, emoji: meta.emoji };
    })
    .filter((b) => b.percentage > 0);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar currentNiche={currentNiche} />

      <div className="flex flex-col flex-1 pl-64 h-full relative">
        <Header currentNiche={currentNiche} onNicheChange={setCurrentNiche} />

        <main className="flex-1 overflow-y-auto bg-transparent p-8">
          <div className="mx-auto max-w-7xl">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <ShimmerText
                  text="Live Activity Feed"
                  className="text-3xl font-bold tracking-tight mb-2 font-heading"
                />
                <p className="text-slate-400">
                  Real-time incoming posts scraped across primary developer platforms.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Pause/Play Stream Button */}
                <button
                  type="button"
                  onClick={toggleStream}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold border transition-all ${
                    isStreaming
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                      : "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                  }`}
                >
                  {isStreaming ? (
                    <>
                      <Pause className="h-4 w-4" />
                      <span>Streaming Live</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      <span>Stream Paused</span>
                    </>
                  )}
                </button>

                {/* Search Bar */}
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search feed..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-white/5 bg-[#0e1324]/40 py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Platform filter chips */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-white/5 pb-4">
              <button
                onClick={() => setSelectedPlatform("all")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
                  selectedPlatform === "all"
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                    : "border-white/5 bg-white/5 text-slate-400 hover:text-slate-200"
                }`}
              >
                All Platforms
              </button>
              {Object.keys(PLATFORM_META).map((plat) => {
                const meta = PLATFORM_META[plat as Platform];
                return (
                  <button
                    key={plat}
                    onClick={() => setSelectedPlatform(plat)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
                      selectedPlatform === plat
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                        : "border-white/5 bg-white/5 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {meta.emoji} {meta.label}
                  </button>
                );
              })}
            </div>

            {/* Dynamic stacked breakdown bar */}
            {posts.length > 0 && (
              <div className="mb-8 rounded-2xl border border-white/5 bg-[#08080a]/60 p-4">
                <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Platform Share Breakdown</span>
                  <span>{posts.length} total active posts</span>
                </div>
                <div className="flex h-3 w-full rounded-full bg-white/5 overflow-hidden">
                  {platformBreakdown.map((item) => (
                    <motion.div
                      key={item.platform}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ type: "spring", stiffness: 100, damping: 20 }}
                      className="h-full"
                      style={{ backgroundColor: item.color }}
                      title={`${item.emoji} ${item.label}: ${item.percentage.toFixed(0)}%`}
                    />
                  ))}
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex h-96 flex-col items-center justify-center gap-4 rounded-2xl border border-white/5 bg-[#0a0f1e]/40">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <p className="text-sm font-medium text-slate-400">Loading incoming stream...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#0a0f1e]/20 py-24 text-center">
                <Zap className="h-10 w-10 text-slate-600 mb-4 animate-pulse" />
                <p className="text-lg font-medium text-slate-300">No posts in feed</p>
                <p className="mt-2 text-sm text-slate-500">
                  Try triggering a manual scrape in Settings or select a different filter.
                </p>
              </div>
            ) : (
              <motion.div 
                layout 
                className="grid grid-cols-1 gap-4 md:grid-cols-2"
              >
                <AnimatePresence mode="popLayout">
                  {filteredPosts.map((post) => {
                    const meta = PLATFORM_META[post.platform as Platform];
                    const formattedDate = post.posted_at
                      ? new Date(post.posted_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "";

                    return (
                      <motion.a
                        key={post.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9, y: -20 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1, 
                          y: 0,
                          borderColor: [
                            "rgba(255, 255, 255, 0.05)",
                            meta?.color || "rgba(99, 102, 241, 0.8)",
                            "rgba(255, 255, 255, 0.05)"
                          ]
                        }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 25,
                          borderColor: { duration: 2.5 }
                        }}
                        href={post.url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass group flex flex-col justify-between rounded-xl p-5 border bg-[#0e1324]/30 hover:border-indigo-500/30 hover:bg-white/5 transition-all duration-300"
                        style={{ borderLeftWidth: "4px" }}
                      >
                        <div>
                          {/* Header details */}
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${meta?.badgeClass}`}>
                              {meta?.emoji} {meta?.label}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">{formattedDate}</span>
                          </div>

                          {/* Title */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-2">
                              {post.title || post.caption || "Untitled Scraped Post"}
                            </h3>
                            <ExternalLink className="h-3.5 w-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 flex-shrink-0" />
                          </div>

                          {/* Caption Preview */}
                          {post.caption && post.title && (
                            <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                              {post.caption}
                            </p>
                          )}

                          {/* Creator info */}
                          {post.creator && (
                            <span className="text-[10px] font-mono text-slate-500">
                              By: <span className="text-slate-400">{post.creator}</span>
                            </span>
                          )}
                        </div>

                        {/* Engagement stats */}
                        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5 text-[10px] font-mono text-slate-400">
                          {post.velocity_score !== undefined && post.velocity_score !== null && (
                            <div className="flex items-center gap-1 text-emerald-400">
                              <Zap className="h-3 w-3" />
                              <span>Score: {post.velocity_score.toFixed(1)}</span>
                            </div>
                          )}
                          {post.engagement_count !== undefined && post.engagement_count !== null && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-amber-400" />
                              <span>{post.engagement_count.toLocaleString()}</span>
                            </div>
                          )}
                          {post.engagement_breakdown?.forks !== undefined && (
                            <div className="flex items-center gap-1">
                              <GitFork className="h-3 w-3" />
                              <span>Forks: {post.engagement_breakdown.forks}</span>
                            </div>
                          )}
                          {post.engagement_breakdown?.comments !== undefined && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>Comments: {post.engagement_breakdown.comments}</span>
                            </div>
                          )}
                        </div>
                      </motion.a>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
