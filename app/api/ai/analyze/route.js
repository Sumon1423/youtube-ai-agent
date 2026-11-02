
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

function getAnalytics(video) {
  const data = video.performance_data || {};
  return data.analytics || data.youtubeAnalytics || data;
}

function getVideoData(video) {
  const analytics = getAnalytics(video);

  const retentionData =
    analytics.audienceRetention ||
    analytics.retentionCurve ||
    analytics.retentionPoints ||
    [];

  const points = Array.isArray(retentionData)
    ? retentionData
    : retentionData.points || [];

  return {
    title: video.title || "Untitled video",
    description: video.description || "",
    views: Number(video.views || 0),
    likes: Number(analytics.likes ?? video.likes ?? 0),
    comments: Number(
      analytics.comments ?? video.comments_count ?? 0
    ),
    shares: Number(analytics.shares || 0),
    averageViewDurationSeconds: Number(
      analytics.averageViewDurationSeconds ??
      analytics.averageViewDuration ??
      0
    ),
    averageViewPercentage:
      analytics.averageViewPercentage == null
        ? video.retention == null
          ? null
          : Number(video.retention)
        : Number(analytics.averageViewPercentage),
    watchTimeMinutes: Number(
      analytics.watchTimeMinutes ??
      analytics.estimatedMinutesWatched ??
      0
    ),
    subscribersGained: Number(
      analytics.subscribersGained || 0
    ),
    subscribersLost: Number(
      analytics.subscribersLost || 0
    ),
    retentionCurve: points.slice(0, 80).map((point) => ({
      time: Number(point.elapsedVideoTimeRatio ?? 0),
      audienceWatchRatio:
        point.audienceWatchRatio == null
          ? null
          : Number(point.audienceWatchRatio),
      relativeRetentionPerformance:
        point.relativeRetentionPerformance == null
          ? null
          : Number(point.relativeRetentionPerformance),
    })),
    analyticsDateRange: analytics.dateRange || null,
  };
}

export async function POST(request) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.SUPABASE_SECRET_KEY;

    const openaiKey =
      process.env.OPENAI_API_KEY;

    if (!supabaseUrl || !supabaseKey || !openaiKey) {
      return NextResponse.json(
        { error: "Server configuration is incomplete." },
        { status: 500 }
      );
    }

    // Authenticate the user.
    const authorization =
      request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const token = authorization.slice(7);

    const supabase = createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { data: authData, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !authData?.user) {
      return NextResponse.json(
        { error: "Invalid login session." },
        { status: 401 }
      );
    }

    const userId = authData.user.id;

    // Optional: analyze one selected video.
    const body = await request.json().catch(() => ({}));
    const selectedVideoId = body.videoId || null;

    // Find the user's connected channel.
    const { data: channel, error: channelError } =
      await supabase
        .from("channels")
        .select("id, channel_name")
        .eq("user_id", userId)
        .eq("connection_status", "connected")
        .limit(1)
        .maybeSingle();

    if (channelError || !channel) {
      return NextResponse.json(
        { error: "No connected YouTube channel found." },
        { status: 404 }
      );
    }

    // Load only this user's channel videos.
    let videoQuery = supabase
      .from("videos")
      .select(
        "id,youtube_video_id,title,description,views,likes,comments_count,retention,performance_data,created_at"
      )
      .eq("channel_id", channel.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (selectedVideoId) {
      videoQuery = videoQuery.eq("id", selectedVideoId);
    }

    const { data: videos, error: videosError } =
      await videoQuery;

    if (videosError) {
      throw new Error("Could not load video analytics.");
    }

    if (!videos || videos.length === 0) {
      return NextResponse.json(
        { error: "No synced videos found." },
        { status: 404 }
      );
    }

    const videoData = videos.map(getVideoData);

    // Ask OpenAI to analyze the real metrics.
    const prompt = `
Analyze the following YouTube Shorts performance data.

Channel: ${channel.channel_name || "YouTube Channel"}

IMPORTANT RULES:
- Use only the supplied data.
- Never invent metrics, audience behavior, or causes.
- Clearly distinguish measured facts from hypotheses.
- Do not claim to know the actual opening hook, editing,
  script, visuals, or ending because video footage and
  transcripts have not been provided.
- Average View Percentage is NOT Viewed vs. Swiped Away.
- A missing metric must be reported as unavailable.
- Compare videos carefully. Avoid conclusions based only
  on raw views when video ages or exposure differ.
- Give practical recommendations for future Shorts.
- Return valid JSON only.

Analyze these videos:
${JSON.stringify(videoData)}

Return this JSON structure:

{
  "overview": "Short channel performance summary",
  "overallStrengths": ["strength 1"],
  "overallWeaknesses": ["weakness 1"],
  "topPerformers": [
    {
      "title": "Video title",
      "reason": "Evidence-based explanation"
    }
  ],
  "underperformers": [
    {
      "title": "Video title",
      "possibleIssues": ["issue"],
      "evidence": ["metric or observation"]
    }
  ],
  "videoInsights": [
    {
      "title": "Video title",
      "performance": "Strong, Average, or Weak",
      "strengths": ["strength"],
      "weaknesses": ["weakness"],
      "retentionInsights": ["observation"],
      "recommendations": ["actionable recommendation"]
    }
  ],
  "nextVideoStrategy": {
    "recommendedApproach": "Recommended content approach",
    "hookAdvice": "Advice for testing future hooks",
    "storytellingAdvice": "Storytelling recommendation",
    "editingAdvice": "Editing recommendation",
    "endingAdvice": "Ending recommendation"
  },
  "actionPlan": [
    {
      "priority": "High",
      "task": "Specific task",
      "reason": "Why this matters"
    }
  ],
  "dataLimitations": ["Missing or insufficient data"]
}
`;

    const aiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "developer",
              content:
                "You are a careful YouTube Shorts analytics specialist. Never fabricate evidence. Return valid JSON only.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: {
            type: "json_object",
          },
          temperature: 0.3,
          max_tokens: 3000,
        }),
        cache: "no-store",
      }
    );

    const aiResult = await aiResponse.json();

    if (!aiResponse.ok) {
      console.error("OpenAI API error:", aiResult);

      throw new Error(
        aiResult.error?.message ||
        "AI analysis request failed."
      );
    }

    const content =
      aiResult.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("AI returned an empty response.");
    }

    let analysis;

    try {
      analysis = JSON.parse(content);
    } catch {
      throw new Error("AI returned invalid JSON.");
    }

    return NextResponse.json({
      success: true,
      channel: channel.channel_name,
      videosAnalyzed: videos.length,
      analysis,
      usage: aiResult.usage || null,
    });

  } catch (error) {
    console.error(
      "AI Performance Analysis error:",
      error.message
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "AI performance analysis failed.",
      },
      { status: 500 }
    );
  }
}
