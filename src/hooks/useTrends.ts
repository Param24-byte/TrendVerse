"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trend } from "@/lib/types";

export function useTrends(niche: string) {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    async function fetchTrends() {
      setLoading(true);
        const { data, error } = await supabase
        .from("trends")
        .select(`
          *,
          trend_posts (
            posts (
              url
            )
          )
        `)
        .eq("niche", niche)
        .order("trend_score", { ascending: false });

      if (error) {
        console.error("Error fetching trends:", error);
      } else if (mounted) {
        setTrends(data || []);
      }
      if (mounted) setLoading(false);
    }

    fetchTrends();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`public:trends:niche=eq.${niche}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trends",
          filter: `niche=eq.${niche}`,
        },
        (payload) => {
          console.log("Real-time trend update:", payload);
          // Just refetch the whole list to keep it simple and perfectly sorted
          fetchTrends();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [niche, supabase]);

  return { trends, loading };
}
