"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Search, BookOpen, Calendar, ArrowRight, Layers } from "lucide-react";
import Link from "next/link";
import { NICHES } from "@/lib/types";

export default function BriefsListPage() {
  const [currentNiche, setCurrentNiche] = useState("ai-tools");
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNicheFilter, setSelectedNicheFilter] = useState<string>("all");
  const supabase = createClient();

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      const { data, error } = await supabase
        .from("research_reports")
        .select(`
          *,
          trends (
            cluster_label,
            representative_title,
            trend_score
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching reports:", error);
      } else {
        setReports(data || []);
      }
      setLoading(false);
    }
    fetchReports();
  }, [supabase]);

  // Filter reports by search query and niche selection
  const filteredReports = reports.filter((r) => {
    const matchesNiche = selectedNicheFilter === "all" || r.niche === selectedNicheFilter;
    const title = r.trends?.cluster_label || "Untitled Brief";
    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.brief_markdown?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.key_hashtags?.some((h: string) => h.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesNiche && matchesSearch;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar currentNiche={currentNiche} />

      <div className="flex flex-col flex-1 pl-64 h-full relative">
        <Header currentNiche={currentNiche} onNicheChange={setCurrentNiche} />

        <main className="flex-1 overflow-y-auto bg-transparent p-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2 font-heading">
                  AI Research Briefs
                </h1>
                <p className="text-slate-400">
                  Detailed summaries, recommended links, and insights on emerging developer trends.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search briefs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/5 bg-[#0e1324]/40 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Niche filter chips */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-white/5 pb-4">
              <button
                onClick={() => setSelectedNicheFilter("all")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
                  selectedNicheFilter === "all"
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                    : "border-white/5 bg-white/5 text-slate-400 hover:text-slate-200"
                }`}
              >
                All Niches
              </button>
              {NICHES.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setSelectedNicheFilter(n.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
                    selectedNicheFilter === n.id
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                      : "border-white/5 bg-white/5 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {n.icon} {n.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-white/5 bg-[#0a0f1e]/40">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <p className="text-sm font-medium text-slate-400">Loading research briefs...</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#0a0f1e]/20 py-24 text-center">
                <BookOpen className="h-10 w-10 text-slate-600 mb-4" />
                <p className="text-lg font-medium text-slate-300">No briefs found</p>
                <p className="mt-2 text-sm text-slate-500">
                  Create a brief on the dashboard first to display it here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredReports.map((report) => {
                  const title = report.trends?.cluster_label || "Untitled Brief";
                  const nicheMeta = NICHES.find((n) => n.id === report.niche);
                  const formattedDate = new Date(report.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <div
                      key={report.id}
                      className="glass group flex flex-col justify-between rounded-2xl p-6 border border-white/5 bg-[#0e1324]/30 transition-all duration-300 hover:shadow-lg hover:border-indigo-500/30"
                    >
                      <div>
                        {/* Header details */}
                        <div className="flex items-center justify-between mb-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                            {nicheMeta?.icon} {nicheMeta?.label}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                            <Calendar className="h-3 w-3" />
                            {formattedDate}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1 mb-2">
                          {title}
                        </h3>

                        {/* Description Preview */}
                        <p className="text-sm text-slate-400 line-clamp-3 mb-4">
                          {report.brief_markdown?.replace(/[#*`]/g, "")}
                        </p>

                        {/* Hashtags */}
                        {report.key_hashtags && report.key_hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {report.key_hashtags.slice(0, 3).map((tag: string) => (
                              <span
                                key={tag}
                                className="text-[10px] font-mono bg-white/5 border border-white/5 text-slate-400 rounded px-1.5 py-0.5"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer Link */}
                      <Link
                        href={`/briefs/${report.id}`}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600/10 py-2.5 text-sm font-semibold text-indigo-400 hover:bg-indigo-600/20 transition-all"
                      >
                        <span>Read Full Report</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
