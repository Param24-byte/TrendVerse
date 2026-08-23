"use client";

import { motion } from "framer-motion";
import { Trend } from "@/lib/types";
import { TrendCard } from "./TrendCard";

interface TrendGridProps {
  trends: Trend[];
}

// Framer motion variants for staggered grid animation
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export function TrendGrid({ trends }: TrendGridProps) {
  if (!trends || trends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 py-24 text-center">
        <p className="text-lg font-medium text-slate-300">No trends detected yet</p>
        <p className="mt-2 text-sm text-slate-500">
          Our ML engine is currently clustering the latest scraped posts.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
    >
      {trends.map((trend, index) => (
        <motion.div
          key={trend.id}
          variants={itemVariants}
          layout
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
        >
          <TrendCard trend={trend} index={index} />
        </motion.div>
      ))}
    </motion.div>
  );
}
