import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { GoogleGenAI, Type } from "@google/genai";

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

    // 2. Fetch associated posts for context (including URL and creator)
    const { data: trendPosts, error: postsError } = await supabase
      .from("trend_posts")
      .select(`
        post_id,
        posts (
          title,
          caption,
          hashtags,
          engagement_count,
          url,
          creator
        )
      `)
      .eq("trend_id", trendId);

    if (postsError) {
      console.error("Error fetching trend posts:", postsError);
      return NextResponse.json({ error: "Failed to fetch context posts" }, { status: 500 });
    }

    const posts = trendPosts.map(tp => tp.posts);

    // 3. Construct the prompt with creators and url data
    const prompt = `
Act as an expert tech analyst. Write a research report on this emerging trend: "${trend.cluster_label}".

Here is some raw data/posts from the community discussing this trend:
${posts.map((p: any) => `
- Title: ${p.title}
  Caption: ${p.caption || "None"}
  Engagement: ${p.engagement_count || 0}
  Creator: ${p.creator || "None"}
  URL: ${p.url || "None"}
`).join("\n")}

Your goal is to extract:
1. A concise, 2-3 paragraph research brief on why this is gaining traction and actionable insights for a founder or developer.
2. A list of 3-5 relevant developer hashtags or topics.
3. 2-4 key creators, authors, or organizations from the context (e.g. usernames or repositories owner).
4. 2-4 recommended resource links from the context posts (e.g. github URLs, product hunt URLs, etc.).
`;

    // 4. Generate structured JSON report using Gemini
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brief_markdown: { 
              type: Type.STRING, 
              description: "A concise 2-3 paragraph research brief in clean Markdown." 
            },
            key_hashtags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of 3-5 relevant developer hashtags."
            },
            top_creators: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of 2-4 creator handles or organization names."
            },
            recommended_resources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  url: { type: Type.STRING }
                },
                required: ["title", "url"]
              },
              description: "Array of resource links."
            }
          },
          required: ["brief_markdown", "key_hashtags", "top_creators", "recommended_resources"]
        }
      }
    });

    const reportData = JSON.parse(response.text || "{}");

    if (!reportData.brief_markdown) {
      throw new Error("Gemini returned an empty brief");
    }

    // 5. Save the report to research_reports
    const { data: report, error: reportError } = await supabase
      .from("research_reports")
      .insert({
        niche: trend.niche,
        trend_id: trendId,
        brief_markdown: reportData.brief_markdown,
        key_hashtags: reportData.key_hashtags,
        top_creators: reportData.top_creators,
        recommended_resources: reportData.recommended_resources
      })
      .select()
      .single();

    if (reportError) {
      console.error("Error creating research report:", reportError);
    }

    // 6. Save the brief back to the legacy trends column for dashboard compatibility
    await supabase
      .from("trends")
      .update({ research_brief: reportData.brief_markdown })
      .eq("id", trendId);

    return NextResponse.json({ 
      success: true, 
      brief: reportData.brief_markdown,
      reportId: report?.id 
    });

  } catch (error: any) {
    console.error("Error generating brief:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate AI brief" },
      { status: 500 }
    );
  }
}
