"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Settings, BookOpen, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function Sidebar() {
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
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-indigo-500/10 border border-indigo-500/20"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon
                className={cn(
                  "relative z-10 h-5 w-5 transition-colors duration-200",
                  isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                )}
              />
              <span className={cn("relative z-10 transition-colors duration-200", isActive ? "text-indigo-400 font-semibold" : "text-slate-400 group-hover:text-slate-200")}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}
