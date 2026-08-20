"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NICHES } from "@/lib/types";
import { BarChart3, Settings, BookOpen, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentNiche: string;
}

export function Sidebar({ currentNiche }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/", icon: BarChart3 },
    { name: "Research Briefs", href: "/briefs", icon: BookOpen },
    { name: "Live Activity", href: "/activity", icon: Activity },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-black/80 backdrop-blur-xl">
      {/* Brand */}
      <div className="flex h-16 items-center px-6 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
            <BarChart3 className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-heading">
            TrendVerse
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-indigo-500/10 text-indigo-400"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors duration-200",
                  isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Active Niche Indicator */}
      <div className="p-4 mt-auto border-t border-white/5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 px-2">
          Active Niche
        </p>
        {NICHES.map((niche) => {
          if (niche.id !== currentNiche) return null;
          return (
            <div
              key={niche.id}
              className="flex items-center gap-3 rounded-lg bg-indigo-500/5 px-3 py-2.5 border border-indigo-500/20"
            >
              <span className="text-xl">{niche.icon}</span>
              <span className="text-sm font-medium text-slate-200">
                {niche.label}
              </span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
