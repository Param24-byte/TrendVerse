"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowLeft, RefreshCw, Hash, User, ExternalLink, Calendar, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";
import { NICHES } from "@/lib/types";
import { motion } from "framer-motion";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function BriefDetailsPage({ params }: PageProps) {
  const [currentNiche, setCurrentNiche] = useState("ai-tools");
  const [reportId, setReportId] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function resolveParams() {
      const resolved = await params;
      setReportId(resolved.id);
    }
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!reportId) return;

    async function fetchReportDetails() {
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
        .eq("id", reportId)
        .single();

      if (error) {
        console.error("Error fetching report details:", error);
        toast.error("Failed to load brief details");
      } else {
        setReport(data);
      }
      setLoading(false);
    }

    fetchReportDetails();
  }, [reportId, supabase]);

  const handleRegenerate = async () => {
    if (!report?.trend_id) return;
    setRegenerating(true);
    try {
      const res = await fetch(`/api/brief/${report.trend_id}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to regenerate brief");
      const data = await res.json();
      toast.success("Brief regenerated successfully!");
      if (data.reportId) {
        router.push(`/briefs/${data.reportId}`);
      } else {
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to regenerate brief");
    } finally {
      setRegenerating(false);
    }
  };

  const title = report?.trends?.cluster_label || "Untitled Brief";
  const nicheMeta = NICHES.find((n) => n.id === report?.niche);
  const formattedDate = report?.created_at
    ? new Date(report.created_at).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar currentNiche={currentNiche} />

      <div className="flex flex-col flex-1 pl-64 h-full relative">
        <Header currentNiche={currentNiche} onNicheChange={setCurrentNiche} />

        <main className="flex-1 overflow-y-auto bg-transparent p-8">
          <div className="mx-auto max-w-7xl">
            {/* Back to Briefs List */}
            <button
              onClick={() => router.push("/briefs")}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Briefs</span>
            </button>

            {loading ? (
              <div className="flex h-96 flex-col items-center justify-center gap-4 rounded-2xl border border-white/5 bg-[#0a0f1e]/40">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <p className="text-sm font-medium text-slate-400">Loading brief content...</p>
              </div>
            ) : !report ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#0a0f1e]/20 py-24 text-center">
                <BookOpen className="h-10 w-10 text-slate-600 mb-4 animate-pulse" />
                <p className="text-lg font-medium text-slate-300">Brief not found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Main Markdown & Resources Column (Span 2) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Article content header wrapped in a layered document reveal shadow stack */}
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={sectionVariants}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="relative"
                  >
                    {/* Stack Layer 2 */}
                    <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-2xl border border-white/5 bg-black/40 -z-10" />
                    {/* Stack Layer 1 */}
                    <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-2xl border border-white/5 bg-black/60 -z-10" />
                    
                    {/* Main Card */}
                    <div className="rounded-2xl border border-white/5 bg-[#08080a] p-6 sm:p-8 shadow-xl">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                          {nicheMeta?.icon} {nicheMeta?.label}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                          <Calendar className="h-3 w-3" />
                          {formattedDate}
                        </span>
                      </div>

                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-6 font-heading">
                        {title}
                      </h1>

                      {/* Markdown Body */}
                      <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed select-text prose-p:mb-4 prose-headings:text-white prose-headings:font-bold prose-headings:mt-6 prose-headings:mb-3 prose-a:text-indigo-400 prose-ul:list-disc prose-ul:pl-5 prose-li:mb-1">
                        <ReactMarkdown>{report.brief_markdown}</ReactMarkdown>
                      </div>
                    </div>
                  </motion.div>

                  {/* Recommended Resources */}
                  {report.recommended_resources && report.recommended_resources.length > 0 && (
                    <motion.div
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      variants={sectionVariants}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="rounded-2xl border border-white/5 bg-[#0e1324]/20 p-6 sm:p-8"
                    >
                      <h2 className="text-lg font-bold text-white mb-4 font-heading">
                        Recommended Resources
                      </h2>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {report.recommended_resources.map((res: any, idx: number) => (
                          <a
                            key={idx}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col justify-between rounded-xl border border-white/5 bg-[#070b15]/40 p-4 hover:border-indigo-500/30 hover:bg-white/5 transition-all"
                          >
                            <span className="text-sm font-semibold text-slate-300 group-hover:text-indigo-400 transition-colors">
                              {res.title}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-indigo-400 mt-3 font-medium">
                              <span>Open resource</span>
                              <ExternalLink className="h-3 w-3" />
                            </div>
                          </a>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Sidebar Details (Span 1) */}
                <div className="space-y-6">
                  {/* Regenerate Card */}
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={sectionVariants}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="rounded-2xl border border-white/5 bg-[#0e1324]/20 p-6"
                  >
                    <button
                      onClick={handleRegenerate}
                      disabled={regenerating}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition-all disabled:opacity-50"
                    >
                      {regenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      <span>{regenerating ? "Regenerating..." : "Regenerate Brief"}</span>
                    </button>
                    <p className="text-xs text-slate-500 mt-3 text-center">
                      Re-runs the brief generation with the latest scraped data and contexts.
                    </p>
                  </motion.div>

                  {/* Hashtags Card */}
                  {report.key_hashtags && report.key_hashtags.length > 0 && (
                    <motion.div
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      variants={sectionVariants}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="rounded-2xl border border-white/5 bg-[#0e1324]/20 p-6"
                    >
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
                        Key Hashtags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {report.key_hashtags.map((tag: string, tagIdx: number) => (
                          <motion.div
                            key={tag}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 15, delay: tagIdx * 0.05 + 0.3 }}
                            whileHover={{ scale: 1.08, boxShadow: "0 0 12px rgba(99, 102, 241, 0.4)", borderColor: "rgba(99, 102, 241, 0.4)" }}
                            className="flex items-center gap-1 rounded-lg bg-indigo-500/5 border border-indigo-500/10 px-2.5 py-1 text-xs text-indigo-300 font-mono cursor-pointer transition-colors"
                          >
                            <Hash className="h-3.5 w-3.5" />
                            <span>{tag}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Top Creators Card */}
                  {report.top_creators && report.top_creators.length > 0 && (
                    <motion.div
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      variants={sectionVariants}
                      transition={{ duration: 0.5, delay: 0.25 }}
                      className="rounded-2xl border border-white/5 bg-[#0e1324]/20 p-6"
                    >
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
                        Top Creators / Users
                      </h3>
                      <div className="space-y-3">
                        {report.top_creators.map((creator: string) => (
                          <div key={creator} className="flex items-center gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                              <User className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-xs font-mono text-slate-300">{creator}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
