import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { Platform } from "@/lib/types";

// Helper to wait and poll Bright Data for results
async function pollBrightDataResults(url: string, token: string): Promise<any[]> {
  const maxRetries = 30; // 30 * 5s = 150 seconds max wait
  
  for (let i = 0; i < maxRetries; i++) {
    // Wait 5 seconds between polls
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (res.status === 200) {
      const data = await res.json();
      // If it's still running, it might return a status object. 
      // Bright Data returns the actual array of results when finished.
      if (Array.isArray(data)) {
        return data;
      }
    } else if (res.status !== 202) {
      // 202 means processing. Anything else is an error.
      throw new Error(`Bright Data API error: ${res.statusText}`);
    }
  }
  
  throw new Error("Timeout waiting for Bright Data scraper to finish");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await params;
    const body = await request.json().catch(() => ({}));
    
    // Auth check (basic protection for the ingest route)
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = process.env.BRIGHTDATA_API_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "Missing Bright Data token" }, { status: 500 });
    }

    let scraperId = "";
    let inputs = [{}];
    const niche = body.niche || "ai-tools";

    // Configure inputs based on platform
    switch (platform) {
      case "github":
        scraperId = process.env.BRIGHTDATA_GITHUB_SCRAPER_ID!;
        inputs = [{ language: body.language || "all", since: body.since || "daily" }];
        break;
      case "hackernews":
        scraperId = process.env.BRIGHTDATA_HACKERNEWS_SCRAPER_ID!;
        inputs = [{ pages: body.pages || 1 }];
        break;
      default:
        return NextResponse.json({ error: "Unsupported platform" }, { status: 400 });
    }

    if (!scraperId) {
      return NextResponse.json({ error: `Missing scraper ID for ${platform}` }, { status: 500 });
    }

    // 1. Trigger the scraper
    const triggerRes = await fetch(
      `https://api.brightdata.com/dca/trigger?collector=${scraperId}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ queue_next: true, format: "json", inputs }),
      }
    );

    if (!triggerRes.ok) {
      throw new Error(`Failed to trigger scraper: ${triggerRes.statusText}`);
    }

    const triggerData = await triggerRes.json();
    const resultsUrl = triggerData.results_url; // Bright Data returns a URL to poll for results

    if (!resultsUrl) {
      throw new Error("No results URL provided by Bright Data");
    }

    // 2. Poll for results
    const rawResults = await pollBrightDataResults(resultsUrl, token);

    // 3. Format and insert into Supabase
    const supabase = createServerClient();
    const insertedPosts = [];

    for (const item of rawResults) {
      if (item.error) continue; // Skip errors from our self-healing logic

      // Standardise the post object based on our DB schema
      const post = {
        platform: platform as Platform,
        niche: niche,
        title: item.title || item.repo_name,
        caption: item.description || null,
        url: item.url,
        creator: item.author || null,
        hashtags: [item.language].filter(Boolean),
        engagement_count: item.points || item.stars_total || 0,
        engagement_breakdown: {
          stars_today: item.stars_today || 0,
          forks: item.forks || 0,
          comments: item.comment_count || 0
        },
        rank_position: item.rank,
        // Velocity score calculation (simplified for now, ML service handles clustering)
        velocity_score: (item.points || item.stars_today || 0) / (item.rank || 1)
      };

      const { data, error } = await supabase
        .table("posts")
        .insert(post)
        .select()
        .single();

      if (!error && data) {
        insertedPosts.push(data);
      }
    }

    return NextResponse.json({
      success: true,
      platform,
      posts_inserted: insertedPosts.length,
    });

  } catch (error: any) {
    console.error(`Ingestion error for platform:`, error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
