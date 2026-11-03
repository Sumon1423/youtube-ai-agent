
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ------------------------------------------
// Extract and validate Gemini JSON
// ------------------------------------------

function extractJSON(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Gemini returned an empty response.");
  }

  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const start = cleaned.indexOf("{");

  if (start === -1) {
    throw new Error("Gemini did not return a JSON object.");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  let end = -1;

  for (let i = start; i < cleaned.length; i++) {
    const char = cleaned[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === "{") {
      depth++;
    } else if (char === "}") {
      depth--;

      if (depth === 0) {
        end = i;
        break;
      }
    }
  }

  if (end === -1) {
    throw new Error("Gemini returned incomplete JSON.");
  }

  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch (error) {
    console.error("Gemini JSON parsing failed:", error.message);
    throw new Error("Gemini returned malformed JSON.");
  }
}

// ------------------------------------------
// Helpers
// ------------------------------------------

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function buildVideoData(video) {
  const performance =
    video.performance_data &&
    typeof video.performance_data === "object"
      ? video.performance_data
      : {};

  const analytics =
    performance.analytics &&
    typeof performance.analytics === "object"
      ? performance.analytics
      : {};

  const retention = analytics.audienceRetention;

  return {
    title: video.title || "Untitled video",
    description: (video.description || "").slice(0, 1200),
    youtubeVideoId: video.youtube_video_id,
    publishedOrSyncedAt: video.created_at,

    views: numberOrNull(analytics.views ?? video.views),
    likes: numberOrNull(analytics.likes ?? video.likes),

    comments: numberOrNull(
      analytics.comments ?? video.comments_count
    ),

    shares: numberOrNull(analytics.shares),

    watchTimeMinutes: numberOrNull(
      analytics.watchTimeMinutes
    ),

    averageViewDurationSeconds: numberOrNull(
      analytics.averageViewDurationSeconds
    ),

    averageViewPercentage: numberOrNull(
      analytics.averageViewPercentage ?? video.retention
    ),

    subscribersGained: numberOrNull(
      analytics.subscribersGained
    ),

    subscribersLost: numberOrNull(
      analytics.subscribersLost
    ),

    audienceRetention:
      Array.isArray(retention?.points)
        ? retention.points.slice(0, 100)
        : [],

    analyticsDateRange: analytics.dateRange || null,
  };
}

function validateAnalysis(analysis) {
  if (!analysis || typeof analysis !== "object") {
    throw new Error("AI returned an invalid analysis.");
  }

  const arrayFields = [
    "strengths",
    "weaknesses",
    "topPerformers",
    "underperformers",
    "videoInsights",
    "actionPlan",
    "dataLimitations",
  ];

  for (const field of arrayFields) {
    if (!Array.isArray(analysis[field])) {
      analysis[field] = [];
    }
  }

  if (
    !analysis.overview ||
    typeof analysis.overview !== "object"
  ) {
    analysis.overview = {
      summary: "Analysis completed.",
      performanceLevel: "Unknown",
      totalViews: 0,
      averageViews: 0,
      totalVideosAnalyzed: 0,
      keyFinding: "No key finding was provided.",
    };
  }

  if (
    !analysis.nextVideoStrategy ||
    typeof analysis.nextVideoStrategy !== "object"
  ) {
    analysis.nextVideoStrategy = {};
  }

  return analysis;
}

// ------------------------------------------
// Gemini Interactions API
// ------------------------------------------

async function callGemini(videoData, channelName) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in server settings.");
  }

  const model = "gemini-3.8-flash";

  const totalViews = videoData.reduce(
    (sum, video) => sum + (video.views || 0),
    0
  );

  const averageViews =
    videoData.length > 0
      ? Math.round(totalViews / videoData.length)
      : 0;

  const prompt = `
You are a professional YouTube Shorts growth analyst.

Analyze this real YouTube channel using only the supplied data.

CHANNEL:
${channelName}

CHANNEL TOTALS:
Videos supplied: ${videoData.length}
Combined views: ${totalViews}
Average views per video: ${averageViews}

VIDEO DATA:
${JSON.stringify(videoData)}

YOUR TASK:

1. Analyze overall channel performance.
2. Identify measurable strengths and weaknesses.
3. Identify top-performing videos and explain why they performed well.
4. Identify underperforming videos using evidence from the supplied metrics.
5. Analyze individual video performance.
6. Examine audience retention curves when available.
7. Identify possible viewer drop-off points only when retention data supports the conclusion.
8. Recommend a practical next-video strategy for a US audience.
9. Create a prioritized action plan.
10. Explain data limitations honestly.

IMPORTANT RULES:

- Write the report in Bengali.
- Keep video titles exactly as supplied.
- Keep metric names such as Views, CTR, Retention and Watch Time in English.
- Never invent analytics, audience demographics, CTR, impressions or traffic sources.
- Do not claim to know why viewers swiped away unless the supplied data supports the conclusion.
- Distinguish measured facts from possible explanations.
- Do not assume every video is a YouTube Short if its data does not establish that.
- If information is missing, mention it in dataLimitations.
- Give specific recommendations, not generic motivational advice.
- Do not fabricate video titles or performance numbers.
- Return only one valid JSON object. No Markdown fences and no text outside JSON.

REQUIRED JSON STRUCTURE:

{
  "overview": {
    "summary": "string",
    "performanceLevel": "Strong, Average, Weak, or Unknown",
    "totalViews": 0,
    "averageViews": 0,
    "totalVideosAnalyzed": 0,
    "keyFinding": "string"
  },
  "strengths": ["string"],
  "weaknesses": ["string"],
  "topPerformers": [
    {
      "title": "exact video title",
      "views": 0,
      "reason": "evidence-based explanation"
    }
  ],
  "underperformers": [
    {
      "title": "exact video title",
      "views": 0,
      "evidence": "measured evidence",
      "possibleIssues": ["string"]
    }
  ],
  "videoInsights": [
    {
      "title": "exact video title",
      "performance": "string",
      "strengths": ["string"],
      "weaknesses": ["string"],
      "retentionInsights": ["string"],
      "recommendations": ["string"]
    }
  ],
  "nextVideoStrategy": {
    "recommendedConcept": "string",
    "targetAudience": "string",
    "hook": "string",
    "contentAngle": "string",
    "suggestedLength": "string",
    "visualStyle": "string",
    "editingStyle": "string",
    "reason": "string"
  },
  "actionPlan": [
    {
      "priority": "High, Medium, or Low",
      "task": "string",
      "reason": "string"
    }
  ],
  "dataLimitations": ["string"]
}

The totalViews and averageViews in overview must be calculated
from the supplied data.

The totalVideosAnalyzed must equal the number of supplied videos.

Use these exact totals:
totalViews = ${totalViews}
averageViews = ${averageViews}
totalVideosAnalyzed = ${videoData.length}
`;

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/interactions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        model,
        input: prompt,
        store: false,
        generation_config: {
          thinking_level: "medium",
          max_output_tokens: 7000,
        },
      }),
      cache: "no-store",
    }
  );

  const raw = await response.text();

  let result;

  try {
    result = JSON.parse(raw);
  } catch {
    console.error(
      "Gemini returned a non-JSON API response:",
      raw.slice(0, 500)
    );

    throw new Error(
      `Gemini API returned an invalid response (HTTP ${response.status}).`
    );
  }

  if (!response.ok) {
    console.error("Gemini API error:", result);

    throw new Error(
      result.error?.message ||
      `Gemini API request failed (HTTP ${response.status}).`
    );
  }

  if (result.status && result.status !== "completed") {
    throw new Error(
      `Gemini interaction did not complete. Status: ${result.status}.`
    );
  }

  let generatedText = result.output_text || "";

  // Fallback: collect text from model output steps.
  if (!generatedText && Array.isArray(result.outputs)) {
    generatedText = result.outputs
      .filter((item) => item.type === "text")
      .map((item) => item.text || "")
      .join("");
  }

  // Fallback for responses that expose steps.
  if (!generatedText && Array.isArray(result.steps)) {
    generatedText = result.steps
      .filter((step) => step.type === "model_output")
      .flatMap((step) => step.content || [])
      .filter((part) => part.type === "text")
      .map((part) => part.text || "")
      .join("");
  }

  if (!generatedText.trim()) {
    console.error(
      "Gemini returned no output text:",
      JSON.stringify(result).slice(0, 1500)
    );

    throw new Error("Gemini returned an empty analysis.");
  }

  const analysis = extractJSON(generatedText);

  return validateAnalysis(analysis);
}

// ------------------------------------------
// POST: AI Video Doctor
// ------------------------------------------

export async function POST(request) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const publishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const secretKey =
      process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !publishableKey || !secretKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase server configuration is incomplete.",
        },
        { status: 500 }
      );
    }

    // Authenticate user.
    const authorization =
      request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const accessToken = authorization.slice(7);

    const authClient = createClient(
      supabaseUrl,
      publishableKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    const {
      data: authData,
      error: authError,
    } = await authClient.auth.getUser(accessToken);

    if (authError || !authData?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid login session. Please log in again.",
        },
        { status: 401 }
      );
    }

    const userId = authData.user.id;

    // Server-side database client.
    const admin = createClient(
      supabaseUrl,
      secretKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // Find connected YouTube channel.
    const {
      data: channel,
      error: channelError,
    } = await admin
      .from("channels")
      .select(
        "id,channel_id,channel_name,connection_status"
      )
      .eq("user_id", userId)
      .eq("connection_status", "connected")
      .limit(1)
      .maybeSingle();

    if (channelError) {
      console.error("Channel lookup failed:", channelError);

      return NextResponse.json(
        {
          success: false,
          error: "Could not load your connected YouTube channel.",
        },
        { status: 500 }
      );
    }

    if (!channel) {
      return NextResponse.json(
        {
          success: false,
          error: "No connected YouTube channel found.",
        },
        { status: 404 }
      );
    }

    // Load synced videos and analytics.
    const {
      data: videos,
      error: videosError,
    } = await admin
      .from("videos")
      .select(
        "id,youtube_video_id,title,description,views,likes,comments_count,retention,performance_data,created_at"
      )
      .eq("channel_id", channel.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (videosError) {
      console.error("Video lookup failed:", videosError);

      return NextResponse.json(
        {
          success: false,
          error: "Could not load your synced videos.",
        },
        { status: 500 }
      );
    }

    if (!videos || videos.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No synced videos found. Sync your YouTube videos first.",
        },
        { status: 400 }
      );
    }

    const videoData = videos.map(buildVideoData);

    // Run AI analysis.
    const analysis = await callGemini(
      videoData,
      channel.channel_name || "YouTube Channel"
    );

    return NextResponse.json({
      success: true,
      channel: channel.channel_name,
      videosAnalyzed: videoData.length,
      generatedAt: new Date().toISOString(),
      analysis,
    });

  } catch (error) {
    console.error("AI Video Doctor error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "AI channel analysis failed.",
      },
      { status: 500 }
    );
  }
}
