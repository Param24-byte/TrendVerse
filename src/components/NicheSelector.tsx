"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NICHES, NicheId } from "@/lib/types";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface NicheSelectorProps {
  currentNiche: string;
  onNicheChange: (nicheId: string) => void;
}

export function NicheSelector({ currentNiche, onNicheChange }: NicheSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const activeNiche = NICHES.find((n) => n.id === currentNiche) || NICHES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 focus:outline-none"
      >
        <span className="text-lg">{activeNiche.icon}</span>
        <span>{activeNiche.label}</span>
        <ChevronDown
          className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right rounded-xl border border-white/10 bg-[#0f1629]/95 p-1 shadow-2xl backdrop-blur-xl"
            >
              {NICHES.map((niche) => {
                const isActive = niche.id === currentNiche;
                return (
                  <button
                    key={niche.id}
                    onClick={() => {
                      onNicheChange(niche.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                      isActive
                        ? "bg-indigo-500/15 text-white"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{niche.icon}</span>
                      <span className={cn("font-medium", isActive && "text-indigo-400")}>
                        {niche.label}
                      </span>
                    </div>
                    {isActive && <Check className="h-4 w-4 text-indigo-400" />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
