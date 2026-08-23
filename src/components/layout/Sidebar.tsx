"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Settings, BookOpen, Activity, ChevronsRight, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/", icon: BarChart3 },
    { name: "Live Activity", href: "/activity", icon: Activity },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-50 flex flex-col items-start border-r border-white/10 bg-black backdrop-blur-xl py-4 transition-all duration-300 ease-in-out",
      isOpen ? "w-64" : "w-16 items-center"
    )}>
      {/* Top Expand Icon & Brand */}
      <div 
        className={cn(
          "mb-8 flex h-10 items-center text-white/70 hover:text-white cursor-pointer transition-colors",
          isOpen ? "w-full justify-between px-6" : "w-10 justify-center"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen && <span className="font-bold text-white tracking-wide">TrendVerse</span>}
        <ChevronsRight className={cn("h-5 w-5 transition-transform duration-300", isOpen && "rotate-180")} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col w-full gap-y-2 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              title={!isOpen ? item.name : undefined}
              className={cn(
                "group relative flex h-10 items-center rounded-xl transition-all duration-200",
                isOpen ? "px-4 w-full justify-start gap-3" : "w-10 justify-center mx-auto"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-white/10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon
                className={cn(
                  "relative z-10 h-5 w-5 shrink-0 transition-colors duration-200",
                  isActive ? "text-white" : "text-white/50 group-hover:text-white"
                )}
              />
              {isOpen && (
                <span className={cn(
                  "relative z-10 text-sm font-medium transition-colors duration-200 truncate",
                  isActive ? "text-white" : "text-white/70 group-hover:text-white"
                )}>
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom User Icon */}
      <div className="mt-auto w-full px-3">
        <Link
          href="/settings"
          className={cn(
            "flex h-10 items-center bg-white/10 text-white hover:bg-white/20 transition-all",
            isOpen ? "w-full px-4 gap-3 justify-start rounded-xl" : "w-10 justify-center mx-auto rounded-full"
          )}
        >
          <User className="h-5 w-5 shrink-0" />
          {isOpen && <span className="text-sm font-medium truncate">Profile</span>}
        </Link>
      </div>
    </aside>
  );
}
