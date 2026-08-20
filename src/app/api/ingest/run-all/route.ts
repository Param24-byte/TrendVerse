import { NextResponse } from "next/server";
import { RunAllResult, ScraperRunResult } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const niche = body.niche || "ai-tools";
    
    // Auth check bypassed for local testing

    // Determine inputs based on niche
    let githubInputs = { language: "all", since: "daily" };
    let hnInputs = { pages: 1 };
    let phInputs = { category: "artificial-intelligence" };
    let hfInputs = { filter: "trending" };

    if (niche === "web-development") {
      githubInputs.language = "javascript";
      phInputs.category = "developer-tools";
    } else if (niche === "open-source") {
      githubInputs.language = "all";
      phInputs.category = "open-source";
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const startTime = Date.now();

    // Trigger all platform ingestions concurrently
    const platforms = [
      { name: "github", body: { niche, ...githubInputs } },
      { name: "hackernews", body: { niche, ...hnInputs } },
      { name: "producthunt", body: { niche, ...phInputs } },
      { name: "huggingface", body: { niche, ...hfInputs } },
      { name: "devto", body: { niche } },
      { name: "reddit", body: { niche } },
      { name: "stackexchange", body: { niche } },
    ];

    const results: ScraperRunResult[] = await Promise.all(
      platforms.map(async (p) => {
        try {
          const res = await fetch(`${baseUrl}/api/ingest/${p.name}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify(p.body)
          });
          
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            return { success: false, platform: p.name as any, posts_inserted: 0, error: errData.error || res.statusText };
          }
          
          const data = await res.json();
          return { success: true, platform: p.name as any, posts_inserted: data.posts_inserted };
        } catch (e: any) {
          return { success: false, platform: p.name as any, posts_inserted: 0, error: e.message };
        }
      })
    );

    // Calculate totals
    const totalPosts = results.reduce((acc, curr) => acc + curr.posts_inserted, 0);
    const durationMs = Date.now() - startTime;

    // Trigger ML clustering immediately after ingestion completes
    if (totalPosts > 0) {
      try {
        await fetch(`${process.env.ML_SERVICE_URL || 'http://localhost:8000'}/embed/batch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ niche })
        });
        
        await fetch(`${process.env.ML_SERVICE_URL || 'http://localhost:8000'}/cluster`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ niche, window_hours: 24, n_clusters: 5 })
        });
      } catch (mlError) {
        console.error("Failed to trigger ML pipeline post-ingestion:", mlError);
        // We don't fail the ingestion response if ML fails, just log it
      }
    }

    const response: RunAllResult = {
      niche,
      results,
      total_posts: totalPosts,
      duration_ms: durationMs
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error(`Orchestrator error:`, error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
