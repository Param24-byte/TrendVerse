"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Post } from "@/lib/types";

export function usePosts(niche: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [platformCounts, setPlatformCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    async function fetchPosts() {
      setLoading(true);
      
      // Fetch top posts for the feed
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("niche", niche)
        .order("velocity_score", { ascending: false })
        .limit(300);

      if (error) {
        console.error("Error fetching posts:", error);
      } else if (mounted) {
        setPosts(data || []);
      }
      
      // Fetch true platform stats for the entire dataset via our SQL view
      const { data: statsData } = await supabase
        .from("platform_niche_counts")
        .select("platform, post_count")
        .eq("niche", niche);
        
      if (mounted && statsData) {
        const counts = statsData.reduce((acc: Record<string, number>, curr) => {
          acc[curr.platform] = Number(curr.post_count);
          return acc;
        }, {});
        setPlatformCounts(counts);
      }
      
      if (mounted) setLoading(false);
    }

    fetchPosts();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`public:posts:niche=eq.${niche}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
          filter: `niche=eq.${niche}`,
        },
        (payload) => {
          console.log("Real-time post insert:", payload);
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [niche, supabase]);

  return { posts, platformCounts, loading };
}
