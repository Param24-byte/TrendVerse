import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const niche = body.niche || "ai-tools";

    const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";
    const secret = process.env.INTERNAL_API_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

    // 1. Embed missing posts
    const embedRes = await fetch(`${mlServiceUrl}/embed/batch`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${secret}`
      },
      body: JSON.stringify({ niche })
    });
    const embedData = await embedRes.json().catch(() => null);

    // 2. Cluster posts into trends
    const clusterRes = await fetch(`${mlServiceUrl}/cluster`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${secret}`
      },
      body: JSON.stringify({ niche, window_hours: 24, n_clusters: 5 })
    });
    const clusterData = await clusterRes.json().catch(() => null);

    return NextResponse.json({
      success: true,
      embeddings: embedData,
      clusters: clusterData
    });
  } catch (error) {
    console.error("ML trigger error:", error);
    return NextResponse.json({ error: "Failed to trigger ML service" }, { status: 500 });
  }
}
