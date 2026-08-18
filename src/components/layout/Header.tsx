"use client";

import { Bell, Search } from "lucide-react";
import { NicheSelector } from "@/components/NicheSelector";
import { LiveIndicator } from "@/components/LiveIndicator";

interface HeaderProps {
  currentNiche: string;
  onNicheChange: (nicheId: string) => void;
}

export function Header({ currentNiche, onNicheChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-white/5 bg-[#0a0f1e]/80 px-4 shadow-sm backdrop-blur-xl sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">
            Search trends
          </label>
          <Search
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-slate-500"
            aria-hidden="true"
          />
          <input
            id="search-field"
            className="block h-full w-full border-0 bg-transparent py-0 pl-8 pr-0 text-white placeholder:text-slate-500 focus:ring-0 sm:text-sm"
            placeholder="Search repositories, discussions, and topics..."
            type="search"
            name="search"
          />
        </form>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Niche Selector */}
          <NicheSelector 
            currentNiche={currentNiche} 
            onNicheChange={onNicheChange} 
          />

          {/* Live Indicator */}
          <LiveIndicator />

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-white/10" aria-hidden="true" />

          {/* Profile dropdown / Notifications */}
          <button type="button" className="-m-2.5 p-2.5 text-slate-400 hover:text-slate-300">
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
