"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Post } from "@/lib/types";

export function usePosts(niche: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    async function fetchPosts() {
      setLoading(true);
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("niche", niche)
        .order("velocity_score", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching posts:", error);
      } else if (mounted) {
        setPosts(data || []);
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
          // Prepend the new post for an instant UI update, 
          // or just refetch to ensure correct velocity_score sorting
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [niche, supabase]);

  return { posts, loading };
}
