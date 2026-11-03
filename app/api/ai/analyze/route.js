
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIMARY_MODEL = "gemini-3.5-flash-lite";
const FALLBACK_MODEL = "gemini-3.8-flash";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/interactions";

// Extract and parse JSON from Gemini response.
function extractJSON(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Gemini returned an empty response.");
  }

  let cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end <= start) {
    throw new Error("Gemini did not return a complete JSON object.");
  }

  cleaned = cleaned.slice(start, end + 1);

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Gemini JSON parsing failed:", error.message);
    throw new Error(`Gemini returned malformed JSON: ${error.message}`);
  }
}

// Read text from Gemini Interactions API response.
function getOutputText(data) {
  if (
    typeof data.output_text === "string" &&
    data.output_text.trim()
  ) {
    return data.output_text;
  }

  if (Array.isArray(data.outputs)) {
    for (const item of data.outputs) {
      if (typeof item.text === "string") {
        return item.text;
      }

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
      if (typeof step.text === "string") {
        return step.text;
      }

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

// Call Gemini once.
async function callGemini(model, prompt) {
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
          max_output_tokens: 3000,
        },
      }),
      cache: "no-store",
    });
  } catch (error) {
    const networkError = new Error(
      `${model} network request failed: ${error.message}`
    );

    networkError.isNetworkError = true;
    networkError.model = model;

    throw networkError;
  }

  const raw = await response.text();

  let result;

  try {
    result = JSON.parse(raw);
  } catch {
    const error = new Error(
      `${model} returned a non-JSON API response. HTTP ${response.status}: ${raw.slice(0, 300)}`
    );

    error.status = response.status;
    error.model = model;

    throw error;
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

  const error = new Error(message);

  error.status = response.status;
  error.model = model;

  throw error;
}

// Primary model with automatic fallback.
async function generateAnalysis(prompt) {
  try {
    return await callGemini(PRIMARY_MODEL, prompt);
  } catch (error) {
    const shouldFallback =
      isTemporaryError(error.status) ||
      error.isNetworkError === true;

    if (!shouldFallback) {
      throw error;
    }

    console.warn(
      `${PRIMARY_MODEL} failed. Switching to ${FALLBACK_MODEL}.`,
      error.message
    );

    return await callGemini(FALLBACK_MODEL, prompt);
  }
}

// Repair malformed JSON with one additional Gemini request.
async function extractJSONWithRepair(text, model) {
  try {
    return extractJSON(text);
  } catch (originalError) {
    console.warn(
      "Gemini returned invalid JSON. Attempting automatic repair."
    );

    const repairPrompt = `
You are a JSON repair assistant.

Repair the malformed JSON below.

STRICT RULES:
1. Return ONLY one valid JSON object.
2. Every property name must use double quotes.
3. Every string value must use double quotes.
4. Remove trailing commas.
5. Fix missing commas, brackets, and braces where possible.
6. Do not use Markdown or code fences.
7. Do not add explanations.
8. Preserve all original information and structure.
9. Do not invent analytics, metrics, or video IDs.
10. Preserve the original language of all values.
11. Bengali explanations must remain Bengali.
12. English technical terms and English video titles must remain English.
13. Never translate JSON property names.

MALFORMED JSON:
${text}
`;

    try {
      const repaired = await callGemini(model, repairPrompt);
      return extractJSON(repaired.text);
    } catch (repairError) {
      console.error(
        "Automatic JSON repair failed:",
        repairError.message
      );

      throw new Error(
        `Gemini JSON repair failed. Original error: ${originalError.message}`
      );
    }
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

// Build Bengali-English hybrid analysis prompt.
function buildPrompt(channel, videos) {
  return `
You are a professional YouTube Shorts growth analyst.

Analyze the following real channel and video data.
The channel targets viewers in the United States.

Your job is to help the creator understand channel performance
and make better decisions using real analytics.

LANGUAGE AND COMMUNICATION RULES:

1. Write all explanations primarily in natural, conversational Bengali (বাংলা).
2. Use simple, clear Bengali that a Bangladeshi creator can easily understand.
3. Mix English naturally when using important YouTube, analytics,
   editing, and technical terms.
4. Keep commonly used technical terms in English, including:
   Hook, Retention, Audience Retention, CTR, Engagement, Views,
   Swipe Rate, Shorts, Algorithm, SEO, Title, Description,
   Thumbnail, Editing, Transition, Sound Effects, CTA,
   Storytelling, Pacing, Visuals, Analytics, and Content Strategy.
5. Do not translate technical terms awkwardly into Bengali.
6. Explain technical concepts in Bengali so the creator understands
   what they mean and what action to take.
7. Recommendations and explanations must be primarily Bengali.
8. Avoid unnecessary full English sentences.
9. Video titles, SEO keywords, hashtags, and English content examples
   must remain in English because the target audience is in the USA.
10. Any suggested English video script or hook for the USA audience
    must be written in natural American English.
11. JSON property names must remain exactly as given in the schema.
12. Never translate JSON property names.
13. Bengali and English can be mixed naturally within the same value.
14. Do not write the entire analysis in English.
15. Most explanatory text must be Bengali.

ANALYSIS RULES:

1. Do not invent analytics, metrics, audience behavior, or video details.
2. Clearly distinguish measured facts from hypotheses.
3. Do not claim a video succeeded or failed based only on views.
4. Compare videos fairly, considering their available data.
5. If data is missing, mention it in dataLimitations.
6. Give specific improvements, not generic advice.
7. Analyze only the videos provided below.
8. Do not invent video IDs.
9. Use empty arrays when there is not enough evidence.
10. Do not make unsupported claims about the YouTube algorithm.

JSON OUTPUT RULES:

1. Return ONLY valid JSON.
2. Do not use Markdown or code fences.
3. Every JSON property name must use double quotes.
4. Never use trailing commas.
5. Ensure every bracket and brace is properly closed.
6. Return one complete JSON object.
7. Keep the response concise enough to avoid output truncation.

CHANNEL:
${JSON.stringify(channel, null, 2)}

VIDEO ANALYTICS:
${JSON.stringify(videos, null, 2)}

Return this exact JSON structure:

{
  "overview": {
    "summary": "বাংলায় সংক্ষিপ্ত Channel assessment",
    "overallStatus": "Growing, Stable, or Needs Improvement",
    "keyFinding": "বাংলায় সবচেয়ে গুরুত্বপূর্ণ data-based finding"
  },
  "strengths": [
    {
      "title": "বাংলায় Strength-এর নাম",
      "evidence": "বাংলায় supporting data",
      "recommendation": "বাংলায় কীভাবে উন্নতি করবে"
    }
  ],
  "weaknesses": [
    {
      "title": "বাংলায় Weakness-এর নাম",
      "evidence": "বাংলায় supporting data",
      "recommendation": "বাংলায় কীভাবে উন্নতি করবে"
    }
  ],
  "topPerformers": [
    {
      "videoId": "Actual video ID",
      "title": "Actual video title",
      "reason": "বাংলায় evidence-based explanation"
    }
  ],
  "underperformers": [
    {
      "videoId": "Actual video ID",
      "title": "Actual video title",
      "reason": "বাংলায় evidence-based explanation",
      "improvement": "বাংলায় improvement suggestion"
    }
  ],
  "videoInsights": [
    {
      "videoId": "Actual video ID",
      "title": "Actual video title",
      "whatWorked": "বাংলায় কী ভালো কাজ করেছে",
      "whatDidNotWork": "বাংলায় কী উন্নতি করা দরকার",
      "nextStep": "বাংলায় নির্দিষ্ট next step"
    }
  ],
  "nextVideoStrategy": {
    "recommendedConcept": "বাংলায় পরবর্তী ভিডিওর concept",
    "targetAudience": "USA audience-এর বিবরণ",
    "hook": "Natural American English opening hook",
    "contentAngle": "বাংলায় unique content angle",
    "reason": "বাংলায় data-based recommendation reason",
    "titleIdeas": [
      "English Title 1",
      "English Title 2",
      "English Title 3"
    ],
    "editingSuggestions": [
      "বাংলায় নির্দিষ্ট editing suggestion"
    ]
  },
  "actionPlan": [
    {
      "priority": "High, Medium, or Low",
      "action": "বাংলায় কী করতে হবে",
      "reason": "বাংলায় কেন এটি গুরুত্বপূর্ণ"
    }
  ],
  "dataLimitations": [
    "বাংলায় missing বা insufficient data-এর বিবরণ"
  ]
}

IMPORTANT FINAL CHECK:
Before responding, verify that:
- The JSON is syntactically valid.
- All property names are in English exactly as specified.
- Most explanations are in Bengali.
- Technical terms remain in English where appropriate.
- USA-facing titles and hooks are in natural American English.
- No video ID or analytics value has been invented.

Return ONLY the JSON object.
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
        {
          success: false,
          error: "Supabase environment variables are missing.",
        },
        { status: 500 }
      );
    }

    if (!geminiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "GEMINI_API_KEY is missing from environment variables.",
        },
        { status: 500 }
      );
    }

    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "Authorization token is missing.",
        },
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
        {
          success: false,
          error:
            "Your login session is invalid or expired. Please log in again.",
        },
        { status: 401 }
      );
    }

    // Find the user's connected YouTube channels.
    const { data: channels, error: channelError } = await supabase
      .from("channels")
      .select(
        "id,channel_name,channel_url,connection_status,created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (channelError) {
      console.error("Channel query error:", channelError);

      return NextResponse.json(
        {
          success: false,
          error:
            "Could not load your connected channel: " +
            channelError.message,
        },
        { status: 500 }
      );
    }

    if (!channels?.length) {
      return NextResponse.json(
        {
          success: false,
          error: "No YouTube channel is connected to your account.",
        },
        { status: 404 }
      );
    }

    const channelIds = channels.map((channel) => channel.id);

    // Load only the latest 10 synced videos.
    const { data: videoRows, error: videoError } = await supabase
      .from("videos")
      .select(
        "id,channel_id,youtube_video_id,title,description,views,likes,comments_count,retention,performance_data,created_at"
      )
      .in("channel_id", channelIds)
      .order("created_at", { ascending: false })
      .limit(10);

    if (videoError) {
      console.error("Video query error:", videoError);

      return NextResponse.json(
        {
          success: false,
          error:
            "Could not load video analytics: " + videoError.message,
        },
        { status: 500 }
      );
    }

    if (!videoRows?.length) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No synced videos were found. Sync your YouTube videos and analytics first.",
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

    // Generate analysis using primary model and fallback.
    const generated = await generateAnalysis(prompt);

    // Parse JSON and repair once if necessary.
    const analysis = await extractJSONWithRepair(
      generated.text,
      generated.model
    );

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
        "AI analysis is missing required fields: " +
          missingFields.join(", ")
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
        error:
          error.message || "AI analysis failed. Please try again.",
      },
      {
        status:
          error.status &&
          error.status >= 400 &&
          error.status < 600
            ? error.status
            : 500,
      }
    );
  }
}
