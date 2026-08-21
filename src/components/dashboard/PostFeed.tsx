"use client";

import { Post } from "@/lib/types";
import { PLATFORM_META } from "@/lib/types";
import { ExternalLink, MessageSquare, Star, GitFork, ArrowUp } from "lucide-react";

interface PostFeedProps {
  posts: Post[];
  title?: string;
}

export function PostFeed({ posts, title = "Latest Activity" }: PostFeedProps) {
  if (!posts || posts.length === 0) return null;

  return (
    <div className="w-full">
      <h2 className="mb-4 text-xl font-bold tracking-tight text-slate-300 font-heading">
        {title}
      </h2>
      
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
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
              <div className="h-full flex flex-col justify-between p-4 border border-white/5 bg-white/[0.01] hover:border-indigo-500/20 hover:bg-white/[0.03] transition-all duration-200 rounded-xl">
                <div>
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase text-slate-400">
                      <span>{meta?.emoji}</span>
                      <span>{meta?.label}</span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-600 opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-indigo-400" />
                  </div>
                  
                  <h4 className="mb-1 text-sm font-semibold text-slate-300 group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {post.title}
                  </h4>
                  
                  {post.caption && (
                    <p className="line-clamp-2 text-xs text-slate-500">
                      {post.caption}
                    </p>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-white/5 pt-3 text-[10px] text-slate-500 font-mono">
                  {post.creator && (
                    <span className="text-slate-400">@{post.creator}</span>
                  )}
                  
                  {post.engagement_breakdown?.stars_today !== undefined && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-500/80" />
                      <span>{post.engagement_breakdown.stars_today.toLocaleString()} today</span>
                    </div>
                  )}
                  
                  {post.engagement_breakdown?.forks !== undefined && (
                    <div className="flex items-center gap-1">
                      <GitFork className="h-3 w-3" />
                      <span>{post.engagement_breakdown.forks.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {post.engagement_breakdown?.comments !== undefined && (
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>{post.engagement_breakdown.comments.toLocaleString()}</span>
                    </div>
                  )}

                  {post.engagement_breakdown?.upvotes !== undefined && (
                    <div className="flex items-center gap-1">
                      <ArrowUp className="h-3 w-3 text-rose-500/80" />
                      <span>{post.engagement_breakdown.upvotes.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
