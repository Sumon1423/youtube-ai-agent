
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

function getAnalytics(video) {
  const performance = video?.performance_data || {};

  return (
    performance.analytics ||
    performance.youtubeAnalytics ||
    performance ||
    {}
  );
}

function getRetention(video, analytics) {
  const data =
    analytics?.audienceRetention ||
    analytics?.retentionCurve ||
    analytics?.retentionPoints ||
    analytics?.retention ||
    video?.retention ||
    [];

  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.points)) {
    return data.points;
  }

  return [];
}

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function prepareVideo(video) {
  const analytics = getAnalytics(video);
  const retention = getRetention(video, analytics);

  return {
    id: video.id,
    youtubeVideoId: video.youtube_video_id,
    title: video.title || "Untitled video",
    description: video.description || "",
    publishedAt: video.created_at,

    views: safeNumber(
      analytics?.views ?? video.views
    ),

    likes: safeNumber(
      analytics?.likes ?? video.likes
    ),

    comments: safeNumber(
      analytics?.comments ??
      analytics?.commentsCount ??
      video.comments_count
    ),

    shares: safeNumber(analytics?.shares),

    averageViewDurationSeconds: safeNumber(
      analytics?.averageViewDurationSeconds ??
      analytics?.averageViewDuration
    ),

    averageViewPercentage: safeNumber(
      analytics?.averageViewPercentage
    ),

    watchTimeMinutes: safeNumber(
      analytics?.watchTimeMinutes ??
      analytics?.estimatedMinutesWatched
    ),

    subscribersGained: safeNumber(
      analytics?.subscribersGained
    ),

    retentionPoints: retention.slice(0, 30),
  };
}

function extractJSON(text) {
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  let cleaned = text.trim();

  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("Gemini did not return valid JSON.");
  }

  return JSON.parse(cleaned.slice(start, end + 1));
}

// Wait helper
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Identify temporary API errors
function isTemporaryError(status) {
  return [408, 429, 500, 502, 503, 504].includes(status);
}

// Retry Gemini and use a fallback model if necessary
async function callGemini(systemInstruction, userPrompt, apiKey) {
  const models = [
    "gemini-3.5-flash-lite",
    "gemini-3.8-flash",
  ];

  let lastError = null;

  for (const model of models) {
    // Two attempts per model
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(
          `Trying Gemini model: ${model}, attempt: ${attempt}`
        );

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemInstruction }],
              },

              contents: [
                {
                  role: "user",
                  parts: [{ text: userPrompt }],
                },
              ],

              generationConfig: {
                temperature: 0.3,
                responseMimeType: "application/json",
                maxOutputTokens: 6000,
              },
            }),
            cache: "no-store",
            signal: AbortSignal.timeout(90000),
          }
        );

        const result = await response.json();

        if (response.ok) {
          const generatedText =
            result?.candidates?.[0]?.content?.parts
              ?.map((part) => part.text || "")
              .join("");

          if (!generatedText) {
            throw new Error(
              "Gemini returned an empty analysis."
            );
          }

          return {
            generatedText,
            usage: result.usageMetadata || null,
            model,
          };
        }

        const message =
          result?.error?.message ||
          "Unknown Gemini API error.";

        lastError = {
          status: response.status,
          message,
          model,
        };

        console.error("Gemini API error:", {
          model,
          attempt,
          status: response.status,
          message,
        });

        // Don't retry permanent errors such as invalid API key
        if (!isTemporaryError(response.status)) {
          throw new Error(
            `Gemini API error (${response.status}): ${message}`
          );
        }

        // Retry with increasing wait time
        if (attempt < 2) {
          await wait(attempt * 2500);
        }
      } catch (error) {
        if (
          error.message?.startsWith("Gemini API error (")
        ) {
          throw error;
        }

        lastError = {
          status: 503,
          message: error.message || "Network error",
          model,
        };

        console.error("Gemini request failed:", {
          model,
          attempt,
          message: error.message,
        });

        if (attempt < 2) {
          await wait(attempt * 2500);
        }
      }
    }

    console.warn(
      `Model ${model} failed. Trying next model...`
    );
  }

  throw new Error(
    `All Gemini attempts failed. Last error: ${
      lastError?.message || "Unknown error"
    }`
  );
}

export async function POST(request) {
  try {
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      return Response.json(
        {
          success: false,
          error:
            "GEMINI_API_KEY is missing in Vercel Environment Variables.",
        },
        { status: 500 }
      );
    }

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SECRET_KEY
    ) {
      return Response.json(
        {
          success: false,
          error: "Supabase server configuration is missing.",
        },
        { status: 500 }
      );
    }

    // Authenticate user
    const authorization =
      request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return Response.json(
        {
          success: false,
          error: "Authorization token is missing.",
        },
        { status: 401 }
      );
    }

    const token = authorization.substring(7);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return Response.json(
        {
          success: false,
          error:
            "Your login session is invalid or expired.",
        },
        { status: 401 }
      );
    }

    // Find connected YouTube channel
    const { data: channels, error: channelError } =
      await supabase
        .from("channels")
        .select("*")
        .eq("user_id", user.id)
        .eq("connection_status", "connected")
        .limit(1);

    if (channelError) {
      throw new Error(
        `Channel database error: ${channelError.message}`
      );
    }

    if (!channels || channels.length === 0) {
      return Response.json(
        {
          success: false,
          error:
            "No connected YouTube channel found. Connect your channel first.",
        },
        { status: 404 }
      );
    }

    const channel = channels[0];

    // Fetch latest 30 videos
    const { data: videos, error: videosError } =
      await supabase
        .from("videos")
        .select(
          "id,channel_id,youtube_video_id,title,description,views,likes,comments_count,retention,performance_data,created_at"
        )
        .eq("channel_id", channel.id)
        .order("created_at", { ascending: false })
        .limit(30);

    if (videosError) {
      throw new Error(
        `Video database error: ${videosError.message}`
      );
    }

    if (!videos || videos.length === 0) {
      return Response.json(
        {
          success: false,
          error:
            "No synced videos found. Sync your YouTube channel first.",
        },
        { status: 404 }
      );
    }

    const preparedVideos = videos.map(prepareVideo);

    // Calculate channel statistics
    const totalViews = preparedVideos.reduce(
      (sum, video) => sum + video.views,
      0
    );

    const totalLikes = preparedVideos.reduce(
      (sum, video) => sum + video.likes,
      0
    );

    const totalComments = preparedVideos.reduce(
      (sum, video) => sum + video.comments,
      0
    );

    const channelData = {
      channelName:
        channel.channel_name ||
        channel.title ||
        channel.name ||
        "YouTube Channel",

      subscriberCount: safeNumber(
        channel.subscriber_count
      ),

      videosAnalyzed: preparedVideos.length,
      totalViews,
      totalLikes,
      totalComments,
    };

    // AI instructions
    const systemInstruction = `
You are CreatorOS, a professional YouTube Shorts analytics strategist.

Your job is to analyze real YouTube channel performance data.

IMPORTANT RULES:

1. Base every conclusion on the supplied data.
2. Never invent metrics, events, audience behavior, or video details.
3. Do not claim that you watched the actual videos.
4. Do not claim to know their hooks, editing, visuals, scripts, or thumbnails because those are not supplied.
5. Distinguish measured facts from possible explanations.
6. If there is insufficient data, clearly say so.
7. Average View Percentage is NOT the same as Viewed vs Swiped Away.
8. A missing retention curve must not be treated as poor retention.
9. Compare videos fairly, considering their views and available metrics.
10. Provide practical advice specifically for YouTube Shorts.
11. Write all explanations in clear English.
12. Return ONLY valid JSON. Do not use Markdown or code fences.

Return this exact JSON structure:

{
  "overview": {
    "summary": "Overall channel performance summary",
    "performanceLevel": "Growing, Stable, or Needs Improvement",
    "totalVideosAnalyzed": 0,
    "totalViews": 0,
    "averageViews": 0,
    "keyFinding": "Most important finding"
  },
  "strengths": [
    "Evidence-based strength"
  ],
  "weaknesses": [
    "Evidence-based weakness"
  ],
  "topPerformers": [
    {
      "title": "Video title",
      "views": 0,
      "reason": "Why it performed well based on available metrics"
    }
  ],
  "underperformers": [
    {
      "title": "Video title",
      "views": 0,
      "possibleIssues": [
        "Possible issue"
      ],
      "evidence": "Metric supporting this observation"
    }
  ],
  "videoInsights": [
    {
      "title": "Video title",
      "performance": "Short performance assessment",
      "strengths": [
        "Strength"
      ],
      "weaknesses": [
        "Weakness"
      ],
      "retentionInsights": [
        "Retention observation or insufficient data"
      ],
      "recommendations": [
        "Actionable recommendation"
      ]
    }
  ],
  "nextVideoStrategy": {
    "recommendedApproach": "Recommended content direction",
    "hookAdvice": "Hook recommendations",
    "storytellingAdvice": "Storytelling recommendations",
    "editingAdvice": "Editing recommendations based on performance data only",
    "endingAdvice": "Ending and audience engagement recommendations"
  },
  "actionPlan": [
    {
      "priority": "High",
      "task": "Specific task",
      "reason": "Why this task matters"
    }
  ],
  "dataLimitations": [
    "Mention missing metrics or information that limits this analysis"
  ]
}

Keep the analysis useful and specific.
Analyze no more than 10 individual videos in videoInsights.
Use no more than 5 top performers and 5 underperformers.
Use no more than 5 action plan items.
`;

    const userPrompt = `
Analyze this YouTube channel using the following real database data.

CHANNEL DATA:
${JSON.stringify(channelData, null, 2)}

VIDEO PERFORMANCE DATA:
${JSON.stringify(preparedVideos, null, 2)}

Return the complete JSON analysis now.
`;

    // Call Gemini with retry and fallback
    const geminiResult = await callGemini(
      systemInstruction,
      userPrompt,
      geminiKey
    );

    const analysis = extractJSON(
      geminiResult.generatedText
    );

    // Return analysis to dashboard
    return Response.json({
      success: true,

      provider: "Google Gemini",

      model: geminiResult.model,

      channel: {
        id: channel.id,
        name: channelData.channelName,
        subscriberCount: channelData.subscriberCount,
      },

      videosAnalyzed: preparedVideos.length,

      analysis,

      usage: geminiResult.usage,
    });
  } catch (error) {
    console.error("AI analysis error:", error);

    const message = error.message || "";

    const isTemporary =
      message.includes("503") ||
      message.includes("429") ||
      message.includes("overloaded") ||
      message.includes("high demand") ||
      message.includes("All Gemini attempts failed");

    return Response.json(
      {
        success: false,
        error: isTemporary
          ? "Gemini is temporarily busy. We tried multiple attempts and backup models. Please try again shortly."
          : message ||
            "An unexpected error occurred during AI analysis.",
      },
      {
        status: isTemporary ? 503 : 500,
      }
    );
  }
}
