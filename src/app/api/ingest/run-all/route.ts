import { NextResponse } from "next/server";
import { RunAllResult, ScraperRunResult } from "@/lib/types";
import { createServerClient } from "@/lib/supabase/server";

export const maxDuration = 600;

const VALID_NICHES = ["ai-tools", "web-development", "devops-cloud", "open-source", "blockchain"];

async function executePipeline(niche: string) {
  // 1. Input Validation
  if (!VALID_NICHES.includes(niche)) {
    return NextResponse.json({ error: "Invalid niche" }, { status: 400 });
  }

  const supabase = createServerClient();

  // 2. Cooldown Rate Limiting
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { data: recentSources } = await supabase
    .from("sources")
    .select("last_scraped_at")
    .eq("niche", niche)
    .gt("last_scraped_at", fifteenMinutesAgo);

  if (recentSources && recentSources.length > 0) {
    const lastRun = new Date(Math.max(...recentSources.map(s => new Date(s.last_scraped_at!).getTime())));
    const waitMinutes = Math.ceil((lastRun.getTime() + 15 * 60 * 1000 - Date.now()) / (60 * 1000));
    return NextResponse.json(
      { error: `Pipeline recently executed. Please wait ${waitMinutes} minute(s) before running again.` },
      { status: 429 }
    );
  }

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

  const secret = process.env.INTERNAL_API_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

  const results: ScraperRunResult[] = await Promise.all(
    platforms.map(async (p) => {
      try {
        const res = await fetch(`${baseUrl}/api/ingest/${p.name}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${secret}`
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

  // 3. Update sources scraped timestamp for successful platform runs
  const nowIso = new Date().toISOString();
  for (const p of results) {
    if (p.success) {
      const { data: existingSource } = await supabase
        .from("sources")
        .select("id")
        .eq("platform", p.platform)
        .eq("niche", niche)
        .maybeSingle();

      if (existingSource) {
        await supabase
          .from("sources")
          .update({ last_scraped_at: nowIso })
          .eq("id", existingSource.id);
      } else {
        await supabase
          .from("sources")
          .insert({
            platform: p.platform,
            niche,
            last_scraped_at: nowIso
          });
      }
    }
  }

  // Trigger ML clustering immediately after ingestion completes
  if (totalPosts > 0) {
    try {
      await fetch(`${baseUrl}/api/ml/trigger`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${secret}`
        },
        body: JSON.stringify({ niche })
      });
    } catch (mlError) {
      console.error("Failed to trigger ML pipeline post-ingestion:", mlError);
    }
  }

  const response: RunAllResult = {
    niche,
    results,
    total_posts: totalPosts,
    duration_ms: durationMs
  };

  return NextResponse.json(response);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const niche = body.niche || "ai-tools";
    return await executePipeline(niche);
  } catch (error: any) {
    console.error(`Orchestrator POST error:`, error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nicheParam = searchParams.get("niche");

    // If a specific niche is requested, run just that one
    if (nicheParam) {
      return await executePipeline(nicheParam);
    }

    // Otherwise (cron job), iterate through ALL niches
    const results: Record<string, any> = {};
    for (const niche of VALID_NICHES) {
      try {
        const res = await executePipeline(niche);
        const body = await res.json();
        results[niche] = body;
      } catch (err: any) {
        results[niche] = { error: err.message };
      }
    }

    return NextResponse.json({ niches_processed: Object.keys(results).length, results });
  } catch (error: any) {
    console.error(`Orchestrator GET error:`, error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
