"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function LiveIndicator() {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const handleNewPost = () => {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 800);
      return () => clearTimeout(timer);
    };
    window.addEventListener("new-post-ingested", handleNewPost);
    return () => window.removeEventListener("new-post-ingested", handleNewPost);
  }, []);

  return (
    <motion.div
      animate={pulse ? { 
        scale: [1, 1.15, 1], 
        borderColor: ["rgba(16, 185, 129, 0.2)", "rgba(16, 185, 129, 0.8)", "rgba(16, 185, 129, 0.2)"],
        boxShadow: ["0 0 15px rgba(16,185,129,0.15)", "0 0 25px rgba(16,185,129,0.4)", "0 0 15px rgba(16,185,129,0.15)"]
      } : {}}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
    >
      <div className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
        <motion.span
          animate={pulse ? { scale: [1, 1.8, 1] } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"
        ></motion.span>
      </div>
      <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
        Live Data
      </span>
      <Zap className="ml-0.5 h-3.5 w-3.5 text-emerald-400" />
    </motion.div>
  );
}
