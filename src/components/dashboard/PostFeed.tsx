"use client";

import { Post } from "@/lib/types";
import { PLATFORM_META } from "@/lib/types";
import { ExternalLink, MessageSquare, Star, GitFork, ArrowUp } from "lucide-react";
import { LiquidGlassCard } from "@/components/kokonutui/liquid-glass-card";

interface PostFeedProps {
  posts: Post[];
  title?: string;
}

export function PostFeed({ posts, title = "Latest Activity" }: PostFeedProps) {
  if (!posts || posts.length === 0) return null;

  return (
    <div className="mt-12 w-full">
      <h2 className="mb-6 text-2xl font-bold tracking-tight text-white font-heading">
        {title}
      </h2>
      
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {posts.map((post) => {
          const meta = PLATFORM_META[post.platform];
          
          return (
            <a 
              key={post.id}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <LiquidGlassCard className="h-full flex flex-col justify-between p-5 border border-white/5 bg-background/10 hover:border-indigo-500/30 transition-all duration-300 rounded-2xl">
                <div>
                  <div className="mb-3 flex items-start justify-between">
                    <div className={`flex items-center gap-2 rounded-md border px-2 py-1 text-xs font-medium ${meta?.badgeClass || 'bg-white/5 border-white/10 text-white'}`}>
                      <span>{meta?.emoji}</span>
                      <span>{meta?.label}</span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-500 opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-indigo-400" />
                  </div>
                  
                  <h4 className="mb-2 text-base font-semibold text-slate-200 group-hover:text-indigo-300">
                    {post.title}
                  </h4>
                  
                  {post.caption && (
                    <p className="line-clamp-2 text-sm text-slate-400">
                      {post.caption}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/5 pt-4 text-xs text-slate-400">
                  {post.creator && (
                    <span className="font-medium text-slate-300">@{post.creator}</span>
                  )}
                  
                  {post.engagement_breakdown?.stars_today !== undefined && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-amber-400" />
                      <span>{post.engagement_breakdown.stars_today.toLocaleString()} today</span>
                    </div>
                  )}
                  
                  {post.engagement_breakdown?.forks !== undefined && (
                    <div className="flex items-center gap-1">
                      <GitFork className="h-3.5 w-3.5 text-slate-400" />
                      <span>{post.engagement_breakdown.forks.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {post.engagement_breakdown?.comments !== undefined && (
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                      <span>{post.engagement_breakdown.comments.toLocaleString()}</span>
                    </div>
                  )}

                  {post.engagement_breakdown?.upvotes !== undefined && (
                    <div className="flex items-center gap-1">
                      <ArrowUp className="h-3.5 w-3.5 text-rose-400" />
                      <span>{post.engagement_breakdown.upvotes.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </LiquidGlassCard>
            </a>
          );
        })}
      </div>
    </div>
  );
}
