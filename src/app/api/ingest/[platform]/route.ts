import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { Platform } from "@/lib/types";

// Helper to wait and poll Bright Data for results
async function pollBrightDataResults(url: string, token: string): Promise<any[]> {
  const maxRetries = 30; // 30 * 5s = 150 seconds max wait
  
  for (let i = 0; i < maxRetries; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 200) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    } else if (res.status !== 202) {
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
    const niche = body.niche || "ai-tools";
    // Validate authentication
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient();
    const insertedPosts: any[] = [];

    // ── NATIVE APIS ──────────────────────────────────────────────────────────
    if (["devto", "reddit", "stackexchange"].includes(platform)) {
       
       if (platform === "devto") {
         const tag = niche === "ai-tools" ? "ai" : niche;
         const res = await fetch(`https://dev.to/api/articles?tag=${tag}&top=1`);
         if (!res.ok) throw new Error("Dev.to API error");
         const data = await res.json();
         
         for (const item of data.slice(0, 10)) {
           insertedPosts.push({
             id: `devto-${item.id}`,
             platform: "devto",
             niche,
             title: item.title,
             caption: item.description,
             url: item.url,
             creator: item.user?.username || null,
             hashtags: item.tag_list || [],
             engagement_count: item.public_reactions_count || 0,
             engagement_breakdown: { comments: item.comments_count || 0 },
             velocity_score: (item.public_reactions_count || 0) / 2
           });
         }
       } 
       else if (platform === "stackexchange") {
         const tag = niche === "ai-tools" ? "machine-learning" : niche;
         const res = await fetch(`https://api.stackexchange.com/2.3/questions?order=desc&sort=votes&tagged=${tag}&site=stackoverflow&pagesize=10`);
         if (!res.ok) throw new Error("StackExchange API error");
         const data = await res.json();
         
         for (const item of data.items || []) {
           insertedPosts.push({
             id: `so-${item.question_id}`,
             platform: "stackexchange",
             niche,
             title: item.title,
             caption: null,
             url: item.link,
             creator: item.owner?.display_name || null,
             hashtags: item.tags || [],
             engagement_count: item.score || 0,
             engagement_breakdown: { views: item.view_count || 0, answers: item.answer_count || 0 },
             velocity_score: (item.score || 0) / 2
           });
         }
       }
       else if (platform === "reddit") {
         const sub = niche === "ai-tools" ? "MachineLearning" : "programming";
         const res = await fetch(`https://www.reddit.com/r/${sub}/top.json?limit=10&t=day`, {
           headers: { "User-Agent": process.env.REDDIT_USER_AGENT || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 TrendVerse/1.0" }
         });
         if (!res.ok) throw new Error("Reddit API error");
         const data = await res.json();
         
         for (const child of data.data?.children || []) {
           const item = child.data;
           insertedPosts.push({
             id: `reddit-${item.id}`,
             platform: "reddit",
             niche,
             title: item.title,
             caption: item.selftext?.substring(0, 200) || null,
             url: `https://reddit.com${item.permalink}`,
             creator: item.author,
             hashtags: [],
             engagement_count: item.score || 0,
             engagement_breakdown: { comments: item.num_comments || 0 },
             velocity_score: (item.score || 0) / 2
           });
         }
       }
    } 
    // ── BRIGHT DATA SCRAPER STUDIO ──────────────────────────────────────────
    else {
       const token = process.env.BRIGHTDATA_API_TOKEN;
       if (!token) throw new Error("Missing Bright Data token");

       let scraperId = "";
       let inputs = [{}];
       if (platform === "github") {
         scraperId = process.env.BRIGHTDATA_GITHUB_SCRAPER_ID!;
         inputs = [{ language: body.language || "all", since: body.since || "daily" }];
       } else if (platform === "hackernews") {
         scraperId = process.env.BRIGHTDATA_HACKERNEWS_SCRAPER_ID!;
         inputs = [{ pages: body.pages || 1 }];
       } else if (platform === "producthunt") {
         scraperId = process.env.BRIGHTDATA_PRODUCTHUNT_SCRAPER_ID!;
       } else if (platform === "huggingface") {
         scraperId = process.env.BRIGHTDATA_HUGGINGFACE_SCRAPER_ID!;
       } else {
         throw new Error("Unsupported platform");
       }

       if (!scraperId) throw new Error(`Missing scraper ID for ${platform}`);

       const triggerRes = await fetch(`https://api.brightdata.com/dca/trigger?collector=${scraperId}`, {
         method: "POST",
         headers: {
           "Authorization": `Bearer ${token}`,
           "Content-Type": "application/json",
         },
         body: JSON.stringify({ queue_next: true, format: "json", inputs }),
       });

       if (!triggerRes.ok) throw new Error(`Failed to trigger scraper: ${triggerRes.statusText}`);
       
       const triggerData = await triggerRes.json();
       const resultsUrl = triggerData.results_url;
       if (!resultsUrl) throw new Error("No results URL provided by Bright Data");

       const scrapedData = await pollBrightDataResults(resultsUrl, token);
       
       for (const item of scrapedData) {
         if (item.error) continue;
         insertedPosts.push({
           id: `bd-${Date.now()}-${Math.random().toString(36).substring(7)}`,
           platform: platform as Platform,
           niche,
           title: item.title || item.repo_name,
           caption: item.description || null,
           url: item.url,
           creator: item.author || null,
           hashtags: [item.language].filter(Boolean),
           engagement_count: item.points || item.stars_total || 0,
           engagement_breakdown: { stars_today: item.stars_today || 0, forks: item.forks || 0, comments: item.comment_count || 0 },
           rank_position: item.rank,
           velocity_score: (item.points || item.stars_today || 0) / (item.rank || 1)
         });
       }
    }

    // Insert all collected posts to Supabase
    let finalInsertedCount = 0;
    for (const post of insertedPosts) {
      const { error } = await supabase.from("posts").upsert(post, { onConflict: "id" });
      if (!error) finalInsertedCount++;
    }

    return NextResponse.json({
      success: true,
      platform,
      posts_inserted: finalInsertedCount,
    });

  } catch (error: any) {
    console.error(`Ingestion error for platform:`, error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
