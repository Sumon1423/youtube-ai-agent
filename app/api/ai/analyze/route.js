
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIMARY_MODEL = "gemini-3.8-flash";
const FALLBACK_MODEL = "gemini-3.5-flash-lite";
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/interactions";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function extractJSON(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Gemini returned an empty response.");
  }

  let cleaned = text.trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end <= start) {
    throw new Error("Gemini did not return a JSON object.");
  }

  cleaned = cleaned.slice(start, end + 1);

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Gemini JSON parsing failed:", error.message);
    throw new Error(`Gemini returned malformed JSON: ${error.message}`);
  }
}

function getOutputText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text;
  }

  if (Array.isArray(data.outputs)) {
    for (const item of data.outputs) {
      if (typeof item.text === "string") return item.text;

      if (Array.isArray(item.content)) {
        const text = item.content
          .filter((part) => part.type === "text" && part.text)
          .map((part) => part.text)
          .join("\n");

        if (text) return text;
      }
    }
  }

  if (Array.isArray(data.steps)) {
    for (const step of data.steps) {
      if (typeof step.text === "string") return step.text;

      if (Array.isArray(step.content)) {
        const text = step.content
          .filter((part) => part.type === "text" && part.text)
          .map((part) => part.text)
          .join("\n");

        if (text) return text;
      }
    }
  }

  throw new Error("Gemini response did not contain readable output.");
}

function isTemporaryError(status) {
  return [429, 500, 502, 503, 504].includes(status);
}

async function callGemini(model, prompt) {
  // 3 total attempts: initial request, then retries after 5s and 10s.
  const retryDelays = [5000, 10000];

  for (let attempt = 0; attempt < 3; attempt++) {
    let response;

    try {
      response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          model,
          input: prompt,
          store: false,
          generation_config: {
            max_output_tokens: 7000,
            ...(model === PRIMARY_MODEL
              ? { thinking_level: "medium" }
              : {}),
          },
        }),
        cache: "no-store",
      });
    } catch (error) {
      // Network errors are temporary; retry using the same model.
      if (attempt < 2) {
        await sleep(retryDelays[attempt]);
        continue;
      }

      throw new Error(
        `${model} network request failed: ${error.message}`
      );
    }

    const raw = await response.text();

    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      throw new Error(
        `${model} returned a non-JSON response. HTTP ${response.status}: ${raw.slice(0, 300)}`
      );
    }

    if (response.ok) {
      return {
        text: getOutputText(result),
        model,
      };
    }

    const message =
      result?.error?.message ||
      result?.message ||
      `Gemini request failed with HTTP ${response.status}.`;

    if (isTemporaryError(response.status) && attempt < 2) {
      console.warn(
        `${model} temporary error (${response.status}). Retry ${attempt + 1}/2.`
      );

      await sleep(retryDelays[attempt]);
      continue;
    }

    const error = new Error(message);
    error.status = response.status;
    error.model = model;
    throw error;
  }

  throw new Error(`${model} failed after retries.`);
}

async function generateAnalysis(prompt) {
  try {
    return await callGemini(PRIMARY_MODEL, prompt);
  } catch (error) {
    if (!isTemporaryError(error.status)) {
      throw error;
    }

    console.warn(
      `${PRIMARY_MODEL} is overloaded. Switching to ${FALLBACK_MODEL}.`
    );

    return await callGemini(FALLBACK_MODEL, prompt);
  }
}

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeVideo(video) {
  const performance = video.performance_data || {};

  return {
    id: video.id,
    youtubeVideoId: video.youtube_video_id,
    title: video.title || "Untitled video",
    description: video.description || "",
    views: safeNumber(video.views),
    likes: safeNumber(video.likes),
    comments: safeNumber(video.comments_count),
    retention: video.retention ?? null,
    performanceData: performance,
    syncedAt: video.created_at || null,
  };
}

function buildPrompt(channel, videos) {
  return `
You are a professional YouTube Shorts growth analyst.

Analyze the following real channel and video data.
The channel targets viewers in the United States.
Give practical, evidence-based recommendations.

IMPORTANT RULES:
1. Do not invent analytics, metrics, audience behavior, or video details.
2. Clearly distinguish measured facts from hypotheses.
3. Do not claim a video succeeded or failed based only on views.
4. Compare videos fairly, considering their available data.
5. If data is missing, mention it in dataLimitations.
6. Give specific improvements, not generic advice.
7. Return ONLY valid JSON. Do not use Markdown or code fences.
8. All written analysis must be in English.

CHANNEL:
${JSON.stringify(channel, null, 2)}

VIDEO ANALYTICS:
${JSON.stringify(videos, null, 2)}

Return this exact JSON structure:

{
  "overview": {
    "summary": "Short overall channel assessment",
    "overallStatus": "Growing, Stable, or Needs Improvement",
    "keyFinding": "Most important evidence-based finding"
  },
  "strengths": [
    {
      "title": "Strength",
      "evidence": "Supporting data",
      "recommendation": "How to build on it"
    }
  ],
  "weaknesses": [
    {
      "title": "Weakness",
      "evidence": "Supporting data",
      "recommendation": "How to improve"
    }
  ],
  "topPerformers": [
    {
      "videoId": "Video ID",
      "title": "Video title",
      "reason": "Evidence-based explanation"
    }
  ],
  "underperformers": [
    {
      "videoId": "Video ID",
      "title": "Video title",
      "reason": "Evidence-based explanation",
      "improvement": "Suggested improvement"
    }
  ],
  "videoInsights": [
    {
      "videoId": "Video ID",
      "title": "Video title",
      "whatWorked": "What appears to have worked",
      "whatDidNotWork": "What may need improvement",
      "nextStep": "Specific next step"
    }
  ],
  "nextVideoStrategy": {
    "recommendedConcept": "One specific next video concept",
    "targetAudience": "Intended audience",
    "hook": "Opening hook",
    "contentAngle": "Unique angle",
    "reason": "Why this concept is recommended based on the data",
    "titleIdeas": ["Title 1", "Title 2", "Title 3"],
    "editingSuggestions": [
      "Specific editing suggestion"
    ]
  },
  "actionPlan": [
    {
      "priority": "High, Medium, or Low",
      "action": "What to do",
      "reason": "Why it matters"
    }
  ],
  "dataLimitations": [
    "Missing or insufficient data"
  ]
}

Use empty arrays when there is not enough evidence.
Do not invent video IDs. Use the actual IDs provided above.
`;
}

export async function POST(request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    const geminiKey = process.env.GEMINI_API_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: "Supabase environment variables are missing." },
        { status: 500 }
      );
    }

    if (!geminiKey) {
      return NextResponse.json(
        { success: false, error: "GEMINI_API_KEY is missing from environment variables." },
        { status: 500 }
      );
    }

    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Authorization token is missing." },
        { status: 401 }
      );
    }

    const accessToken = authorization.slice(7);

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Your login session is invalid or expired. Please log in again." },
        { status: 401 }
      );
    }

    // Find the user's connected YouTube channel.
    const { data: channels, error: channelError } = await supabase
      .from("channels")
      .select("id,channel_name,channel_url,connection_status,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (channelError) {
      console.error("Channel query error:", channelError);

      return NextResponse.json(
        { success: false, error: "Could not load your connected channel: " + channelError.message },
        { status: 500 }
      );
    }

    if (!channels?.length) {
      return NextResponse.json(
        { success: false, error: "No YouTube channel is connected to your account." },
        { status: 404 }
      );
    }

    const channelIds = channels.map((channel) => channel.id);

    // Load the user's video analytics.
    const { data: videoRows, error: videoError } = await supabase
      .from("videos")
      .select(
        "id,channel_id,youtube_video_id,title,description,views,likes,comments_count,retention,performance_data,created_at"
      )
      .in("channel_id", channelIds)
      .order("created_at", { ascending: false })
      .limit(100);

    if (videoError) {
      console.error("Video query error:", videoError);

      return NextResponse.json(
        { success: false, error: "Could not load video analytics: " + videoError.message },
        { status: 500 }
      );
    }

    if (!videoRows?.length) {
      return NextResponse.json(
        {
          success: false,
          error: "No synced videos were found. Sync your YouTube videos and analytics first.",
        },
        { status: 404 }
      );
    }

    const videos = videoRows.map(normalizeVideo);

    const channelSummary = channels.map((channel) => ({
      id: channel.id,
      name: channel.channel_name,
      url: channel.channel_url,
      connectionStatus: channel.connection_status,
    }));

    const prompt = buildPrompt(channelSummary, videos);

    // Primary model with automatic retry and fallback.
    const generated = await generateAnalysis(prompt);

    const analysis = extractJSON(generated.text);

    const requiredFields = [
      "overview",
      "strengths",
      "weaknesses",
      "topPerformers",
      "underperformers",
      "videoInsights",
      "nextVideoStrategy",
      "actionPlan",
      "dataLimitations",
    ];

    const missingFields = requiredFields.filter(
      (field) => !(field in analysis)
    );

    if (missingFields.length) {
      throw new Error(
        "AI analysis is missing required fields: " + missingFields.join(", ")
      );
    }

    return NextResponse.json({
      success: true,
      channel: channelSummary,
      videosAnalyzed: videos.length,
      generatedAt: new Date().toISOString(),
      modelUsed: generated.model,
      analysis,
    });
  } catch (error) {
    console.error("AI analysis route error:", {
      message: error.message,
      status: error.status || null,
      model: error.model || null,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || "AI analysis failed. Please try again.",
      },
      { status: error.status && error.status >= 400 && error.status < 600
        ? error.status
        : 500 }
    );
  }
}
