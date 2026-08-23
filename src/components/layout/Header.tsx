"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, User, LogOut, Settings as SettingsIcon, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import toast from "react-hot-toast";

export function Header() {
  const [user, setUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { data } = await supabase
          .from("trends")
          .select("id, cluster_label, niche, trend_score")
          .ilike("cluster_label", `%${searchQuery}%`)
          .limit(5);
        setSearchResults(data || []);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, supabase]);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Signed out successfully");
      router.push("/login");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to sign out");
    }
  };

  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : "U";

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-white/5 bg-black/80 px-4 shadow-sm backdrop-blur-xl sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="relative flex flex-1">
          <label htmlFor="search-field" className="sr-only">
            Search trends
          </label>
          <Search
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-slate-500"
            aria-hidden="true"
          />
          <input
            id="search-field"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block h-full w-full border-0 bg-transparent py-0 pl-8 pr-0 text-white placeholder:text-slate-500 focus:ring-0 sm:text-sm"
            placeholder="Search emerging developer trends..."
            type="search"
            name="search"
            autoComplete="off"
          />

          {/* Search dropdown results preview */}
          <AnimatePresence>
            {searchQuery && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setSearchQuery("")} />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-16 left-0 w-full max-w-lg rounded-2xl border border-white/5 bg-[#08080a]/95 backdrop-blur-xl p-3 shadow-2xl z-50"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3 mb-2">
                    Matching Trends
                  </p>
                  {searchLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    <motion.div 
                      initial="hidden"
                      animate="show"
                      variants={{
                        hidden: { opacity: 0 },
                        show: {
                          opacity: 1,
                          transition: { staggerChildren: 0.05 }
                        }
                      }}
                      className="space-y-1"
                    >
                      {searchResults.map((result) => (
                        <motion.div
                          key={result.id}
                          variants={{
                            hidden: { opacity: 0, y: 5 },
                            show: { opacity: 1, y: 0 }
                          }}
                        >
                          <Link
                            href={`/briefs?search=${encodeURIComponent(result.cluster_label)}`}
                            onClick={() => setSearchQuery("")}
                            className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-all"
                          >
                            <div className="flex flex-col min-w-0 pr-4">
                              <span className="font-medium truncate text-slate-200">{result.cluster_label}</span>
                              <span className="text-[10px] text-slate-500 capitalize">{result.niche.replace("-", " ")}</span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              Score {result.trend_score.toFixed(1)}
                            </span>
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <p className="text-xs text-slate-500 px-3 py-2">No matching trends found.</p>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">


          {/* Profile / Dropdown */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-semibold text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30 transition-all focus:outline-none"
              >
                {userInitials}
              </button>
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/5 bg-[#0e1324] p-2 shadow-2xl z-20 animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-2 text-xs border-b border-white/5">
                      <p className="text-slate-500">Logged in as</p>
                      <p className="truncate font-semibold text-white mt-0.5">{user.email}</p>
                    </div>
                    <Link
                      href="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-all mt-1"
                    >
                      <SettingsIcon className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        handleSignOut();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
