"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Home, LogOut, Settings as SettingsIcon, Loader2, Command } from "lucide-react";
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Global Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        document.getElementById('search-field')?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    <header className="sticky top-0 z-40 flex h-24 shrink-0 items-center justify-between border-b border-white/5 bg-black px-8 shadow-sm backdrop-blur-xl">
      
      {/* Left side: Breadcrumbs */}
      <div className="flex items-center gap-3">
        <Home className="h-5 w-5 text-white" />
        <span className="text-lg font-bold text-white tracking-tight">Dashboard</span>
      </div>

      {/* Right side: Search and Profile */}
      <div className="flex items-center gap-x-4">
        
        {/* Search Bar matching the image format */}
        <div className="relative group flex items-center">
          <div className="flex items-center h-9 w-64 rounded-lg bg-white/5 border border-white/10 px-3 transition-colors group-focus-within:border-white/20 group-focus-within:bg-white/10">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              id="search-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-0 px-2 py-1 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-0"
              placeholder="Search trends..."
              autoComplete="off"
            />
            <div className="flex items-center gap-0.5 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 shrink-0">
              <Command className="h-3 w-3 text-slate-400" />
              <span className="text-[10px] font-medium text-slate-400">K</span>
            </div>
          </div>

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
                  className="absolute top-12 right-0 w-full min-w-[320px] rounded-2xl border border-white/5 bg-[#08080a]/95 backdrop-blur-xl p-3 shadow-2xl z-50"
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
                            href="/"
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

        {/* Profile / Dropdown */}
        {user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white border border-white/20 hover:bg-white/20 transition-all focus:outline-none"
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
            className="flex items-center justify-center rounded-xl bg-white/10 px-4 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-white/20 transition-all"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
