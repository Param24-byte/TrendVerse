import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ trendId: string }> }
) {
  try {
    const { trendId } = await params;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const supabase = createServerClient();

    // 1. Fetch the trend
    const { data: trend, error: trendError } = await supabase
      .from("trends")
      .select("*")
      .eq("id", trendId)
      .single();

    if (trendError || !trend) {
      return NextResponse.json({ error: "Trend not found" }, { status: 404 });
    }

    // If we already have a brief, just return it instead of regenerating
    if (trend.research_brief) {
      return NextResponse.json({ success: true, brief: trend.research_brief });
    }

    // 2. Fetch associated posts for context
    // We join trend_posts with posts to get the actual post content
    const { data: trendPosts, error: postsError } = await supabase
      .from("trend_posts")
      .select(`
        post_id,
        posts (
          title,
          caption,
          hashtags,
          engagement_count,
          url
        )
      `)
      .eq("trend_id", trendId);

    if (postsError) {
      console.error("Error fetching trend posts:", postsError);
      return NextResponse.json({ error: "Failed to fetch context posts" }, { status: 500 });
    }

    const posts = trendPosts.map(tp => tp.posts);

    // 3. Construct the prompt
    const prompt = `
Act as an expert tech analyst. Write a concise, 2-3 paragraph research brief on this emerging trend: "${trend.cluster_label}".

Here is some raw data/posts from the community discussing this trend:
${posts.map((p: any) => `
- Title: ${p.title}
  Caption: ${p.caption || "None"}
  Engagement: ${p.engagement_count}
`).join("\n")}

Your goal is to:
1. Summarize what this trend is about and why it's gaining traction.
2. Provide actionable insights for a developer or founder looking to capitalize on this trend.
Keep the formatting clean using Markdown (bolding, bullet points). Do not include any filler introductions like "Here is your brief".
`;

    // 4. Generate the brief using Gemini 3.6 Flash
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    const brief = response.text;

    if (!brief) {
      throw new Error("Gemini returned an empty response");
    }

    // 5. Save the brief back to the database
    await supabase
      .from("trends")
      .update({ research_brief: brief })
      .eq("id", trendId);

    return NextResponse.json({ success: true, brief });

  } catch (error: any) {
    console.error("Error generating brief:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate AI brief" },
      { status: 500 }
    );
  }
}
