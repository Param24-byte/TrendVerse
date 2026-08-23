import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { Platform } from "@/lib/types";
import crypto from "crypto";

export const maxDuration = 60;

// Helper to wait and poll Bright Data for results
async function pollBrightDataResults(url: string, token: string): Promise<any[]> {
  const maxRetries = 12; // 12 * 5s = 60 seconds max wait
  
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

    // 0. Validate platform against the canonical list
    const { VALID_PLATFORMS } = await import("@/lib/types");
    if (!VALID_PLATFORMS.includes(platform as any)) {
      return NextResponse.json({ error: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(", ")}` }, { status: 400 });
    }

    // 1. Input validation on niche
    const VALID_NICHES = ["ai-tools", "web-development", "devops-cloud", "open-source", "blockchain"];
    if (!VALID_NICHES.includes(niche)) {
      return NextResponse.json({ error: "Invalid niche" }, { status: 400 });
    }

    // 2. Validate authentication using shared secret or service role key
    const authHeader = request.headers.get("Authorization");
    const secret = process.env.INTERNAL_API_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (authHeader !== `Bearer ${secret}`) {
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
         const userAgent = process.env.REDDIT_USER_AGENT || "TrendVerse/1.0 (by /u/TrendVerseAdmin)";
         let res: Response | null = null;
         let retries = 3;
         let delay = 1000;

         for (let i = 0; i < retries; i++) {
           try {
             res = await fetch(`https://www.reddit.com/r/${sub}/top.json?limit=10&t=day`, {
               headers: { "User-Agent": userAgent }
             });
             if (res.ok) break;
             if (res.status === 403 || res.status === 429) {
               console.warn(`Reddit API returned status ${res.status}. Backing off...`);
               await new Promise(resolve => setTimeout(resolve, delay));
               delay *= 2;
             } else {
               throw new Error(`Reddit API status: ${res.status}`);
             }
           } catch (fetchErr: any) {
             if (i === retries - 1) {
               console.error("Reddit scraper failed after retries:", fetchErr);
               return NextResponse.json({ success: true, platform: "reddit", posts_inserted: 0 });
             }
             await new Promise(resolve => setTimeout(resolve, delay));
             delay *= 2;
           }
         }

         if (!res || !res.ok) {
           console.error(`Reddit API failed with status ${res?.status || 'Unknown'}. Soft failing.`);
           return NextResponse.json({ success: true, platform: "reddit", posts_inserted: 0 });
         }

         try {
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
         } catch (parseErr) {
           console.error("Reddit JSON parsing failed:", parseErr);
           return NextResponse.json({ success: true, platform: "reddit", posts_inserted: 0 });
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
         inputs = [{ url: "https://github.com/trending", language: body.language || "all", since: body.since || "daily" }];
       } else if (platform === "hackernews") {
         scraperId = process.env.BRIGHTDATA_HACKERNEWS_SCRAPER_ID!;
         inputs = [{ url: "https://news.ycombinator.com/", pages: body.pages || 1 }];
       } else if (platform === "producthunt") {
         scraperId = process.env.BRIGHTDATA_PRODUCTHUNT_SCRAPER_ID!;
         inputs = [{ url: "https://www.producthunt.com/" }];
       } else if (platform === "huggingface") {
         scraperId = process.env.BRIGHTDATA_HUGGINGFACE_SCRAPER_ID!;
         inputs = [{ url: "https://huggingface.co/models" }];
       } else {
         throw new Error("Unsupported platform");
       }

       if (!scraperId) throw new Error(`Missing scraper ID for ${platform}`);

       const triggerRes = await fetch(`https://api.brightdata.com/dca/trigger?collector=${scraperId}&queue_next=1&format=json`, {
         method: "POST",
         headers: {
           "Authorization": `Bearer ${token}`,
           "Content-Type": "application/json",
         },
         body: JSON.stringify(inputs),
       });

       if (!triggerRes.ok) {
         const errText = await triggerRes.text();
         throw new Error(`Failed to trigger scraper: ${triggerRes.status} ${triggerRes.statusText} - ${errText}`);
       }
       
       const triggerData = await triggerRes.json();
       console.log("BrightData Trigger Response:", triggerData);
       
       let resultsUrl = triggerData.results_url || triggerData.url;
       if (!resultsUrl && triggerData.collection_id) {
         resultsUrl = `https://api.brightdata.com/dca/dataset?id=${triggerData.collection_id}`;
       }
       if (!resultsUrl) throw new Error(`No results URL provided by Bright Data. Response: ${JSON.stringify(triggerData)}`);

       const scrapedData = await pollBrightDataResults(resultsUrl, token);
       
       let loggedSampleForPlatform = false;
       for (const item of scrapedData) {
         if (item.error) continue;

         // Broad title fallback chain covering known Bright Data field variants:
         //  - GitHub: title, repo_name, repository_title
         //  - HackerNews: title, heading
         //  - ProductHunt: name, product_name, tagline
         //  - HuggingFace: model_name, model_id, name
         const resolvedTitle =
           item.title || item.repo_name || item.name || item.product_name ||
           item.model_name || item.heading || item.repository_title ||
           item.tagline || item.model_id || null;

         if (!resolvedTitle) {
           // Log ONE sample raw record per platform so we can identify missing keys
           if (!loggedSampleForPlatform) {
             console.warn(
               `[ingest/${platform}] Could not resolve title. Sample raw keys:`,
               JSON.stringify(Object.keys(item)),
               "Sample record (first 500 chars):",
               JSON.stringify(item).substring(0, 500)
             );
             loggedSampleForPlatform = true;
           }
           continue; // Skip untitled posts entirely
         }

         const uniqueKey = item.url || item.repo_name || resolvedTitle || "";
         const hash = crypto.createHash("sha1").update(uniqueKey).digest("hex").slice(0, 16);
         insertedPosts.push({
           id: `bd-${platform}-${hash}`,
           platform: platform as Platform,
           niche,
           title: resolvedTitle,
           caption: item.description || item.tagline || null,
           url: item.url,
           creator: item.author || item.maker || item.user || null,
           hashtags: [item.language, item.topic].filter(Boolean),
           engagement_count: item.points || item.stars_total || item.votes_count || item.likes || 0,
           engagement_breakdown: { stars_today: item.stars_today || 0, forks: item.forks || 0, comments: item.comment_count || item.comments_count || 0 },
           rank_position: item.rank,
           velocity_score: (item.points || item.stars_today || item.votes_count || 0) / (item.rank || 1)
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
