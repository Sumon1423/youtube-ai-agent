
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

// ------------------------------
// ANALYTICS HELPERS
// ------------------------------

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

    shares: safeNumber(
      analytics?.shares
    ),

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

// ------------------------------
// JSON HELPER
// ------------------------------

function extractJSON(text) {
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  let cleaned = text.trim();

  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("Gemini did not return valid JSON.");
  }

  return JSON.parse(
    cleaned.slice(start, end + 1)
  );
}

// ------------------------------
// RETRY HELPERS
// ------------------------------

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isTemporaryError(status) {
  return [
    408,
    429,
    500,
    502,
    503,
    504,
  ].includes(status);
}

async function callGemini(
  systemInstruction,
  userPrompt,
  apiKey
) {
  const model = "gemini-3.5-flash-lite";

  const maxAttempts = 3;

  let lastError = null;

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {
    try {
      console.log(
        `Gemini attempt ${attempt}/${maxAttempts}`
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
              parts: [
                {
                  text: systemInstruction,
                },
              ],
            },

            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: userPrompt,
                  },
                ],
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

      if (!response.ok) {
        const message =
          result?.error?.message ||
          "Unknown Gemini API error.";

        console.error("Gemini API error:", {
          status: response.status,
          message,
          attempt,
        });

        lastError = {
          status: response.status,
          message,
        };

        if (!isTemporaryError(response.status)) {
          throw new Error(
            `Gemini API error (${response.status}): ${message}`
          );
        }

        if (attempt < maxAttempts) {
          const delay = attempt * 3000;

          console.log(
            `Retrying Gemini after ${delay}ms`
          );

          await wait(delay);
          continue;
        }

        break;
      }

      const generatedText =
        result?.candidates?.[0]?.content?.parts
          ?.map((part) => part.text || "")
          .join("");

      if (!generatedText) {
        throw new Error(
          "Gemini did not generate an analysis. Check the API response and safety settings."
        );
      }

      return {
        generatedText,
        usage: result.usageMetadata || null,
        model,
      };
    } catch (error) {
      if (
        error.message?.startsWith("Gemini API error (")
      ) {
        throw error;
      }

      console.error(
        `Gemini attempt ${attempt} failed:`,
        error
      );

      lastError = {
        status: 503,
        message: error.message || "Network error",
      };

      if (attempt < maxAttempts) {
        await wait(attempt * 3000);
      }
    }
  }

  throw new Error(
    `Gemini is temporarily unavailable. Last error: ${
      lastError?.message || "Unknown error"
    }`
  );
}

// ------------------------------
// MAIN API
// ------------------------------

export async function POST(request) {
  try {
    // Check API configuration

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
          error:
            "Supabase server configuration is missing.",
        },
        { status: 500 }
      );
    }

    // ------------------------------
    // AUTHENTICATION
    // ------------------------------

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

    // ------------------------------
    // CONNECTED CHANNEL
    // ------------------------------

    const {
      data: channels,
      error: channelError,
    } = await supabase
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

    // ------------------------------
    // FETCH VIDEOS
    // ------------------------------

    const {
      data: videos,
      error: videosError,
    } = await supabase
      .from("videos")
      .select(
        "id,channel_id,youtube_video_id,title,description,views,likes,comments_count,retention,performance_data,created_at"
      )
      .eq("channel_id", channel.id)
      .order("created_at", {
        ascending: false,
      })
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

    // ------------------------------
    // CHANNEL STATISTICS
    // ------------------------------

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

      averageViews:
        preparedVideos.length > 0
          ? Math.round(
              totalViews / preparedVideos.length
            )
          : 0,
    };

    // ------------------------------
    // AI INSTRUCTIONS
    // ------------------------------

    const systemInstruction = `
You are CreatorOS, a professional YouTube Shorts analytics strategist.

Your job is to analyze real YouTube channel performance data.

LANGUAGE RULES:

1. Write all explanations in natural, easy-to-understand Bengali.
2. Use standard Bengali script, not Banglish.
3. Keep original YouTube video titles exactly as provided.
4. Never translate video titles.
5. Keep channel names, people's names, case names, and proper nouns unchanged.
6. Keep technical analytics terms in English where translation could create confusion.

Keep these terms in English:
Views, Likes, Comments, Shares, Retention,
Average View Percentage, Average View Duration,
Watch Time, Subscribers Gained, Impressions,
Traffic Sources, Viewed vs Swiped Away,
YouTube Shorts, Hook, Storytelling, Engagement.

7. Keep all JSON keys in English.
8. Keep enum values in English.
9. Do not write the entire report in English.
10. Make the Bengali explanations understandable to beginners.

ANALYSIS RULES:

1. Base every conclusion on supplied data.
2. Never invent metrics, events, audience behavior, or video details.
3. Never claim that you watched the actual videos.
4. Never claim to know hooks, editing, visuals, scripts, or thumbnails because those are not supplied.
5. Separate measured facts from possible explanations.
6. If evidence is insufficient, clearly say so in Bengali.
7. Average View Percentage is NOT the same as Viewed vs Swiped Away.
8. A missing retention curve must not be treated as poor retention.
9. Compare videos fairly.
10. Consider video age and available metrics when comparing performance.
11. Do not conclude that a topic is bad based on only one underperforming video.
12. Do not confuse correlation with causation.
13. Low views alone do not prove a weak hook.
14. Never invent traffic sources, audience demographics, or geographic data.
15. Do not make unsupported claims about the YouTube algorithm.
16. Give practical advice specifically for YouTube Shorts.
17. Do not repeat the same generic recommendation for every video.
18. If data is unavailable, write "তথ্য পাওয়া যায়নি".
19. If supplied metrics conflict, mention the inconsistency in dataLimitations.
20. Do not describe a video as viral unless supplied data supports that conclusion.

CONFIDENCE RULES:

High:
Multiple relevant metrics support the conclusion.

Medium:
Some evidence exists, but important information is missing.

Low:
The conclusion is uncertain or based on limited evidence.

Explain the confidence level in Bengali.

Return ONLY valid JSON.
Do not use Markdown or code fences.

RETURN THIS EXACT JSON STRUCTURE:

{
  "overview": {
    "summary": "বাংলায় সামগ্রিক চ্যানেল বিশ্লেষণ",
    "performanceLevel": "Growing, Stable, or Needs Improvement",
    "totalVideosAnalyzed": 0,
    "totalViews": 0,
    "averageViews": 0,
    "keyFinding": "বাংলায় সবচেয়ে গুরুত্বপূর্ণ পর্যবেক্ষণ",
    "confidence": "High, Medium, or Low",
    "confidenceReason": "বাংলায় প্রমাণের ব্যাখ্যা"
  },
  "strengths": [
    "বাংলায় তথ্যভিত্তিক শক্তির দিক"
  ],
  "weaknesses": [
    "বাংলায় তথ্যভিত্তিক দুর্বলতার দিক"
  ],
  "topPerformers": [
    {
      "title": "Original video title",
      "views": 0,
      "reason": "বাংলায় তথ্যভিত্তিক ব্যাখ্যা",
      "confidence": "High, Medium, or Low"
    }
  ],
  "underperformers": [
    {
      "title": "Original video title",
      "views": 0,
      "possibleIssues": [
        "বাংলায় সম্ভাব্য সমস্যা"
      ],
      "evidence": "বাংলায় সংশ্লিষ্ট Metric-এর প্রমাণ",
      "confidence": "High, Medium, or Low"
    }
  ],
  "videoInsights": [
    {
      "title": "Original video title",
      "performance": "বাংলায় সংক্ষিপ্ত মূল্যায়ন",
      "strengths": [
        "বাংলায় শক্তির দিক"
      ],
      "weaknesses": [
        "বাংলায় দুর্বলতার দিক"
      ],
      "retentionInsights": [
        "বাংলায় Retention পর্যবেক্ষণ"
      ],
      "recommendations": [
        "বাংলায় কার্যকর পরামর্শ"
      ],
      "confidence": "High, Medium, or Low"
    }
  ],
  "nextVideoStrategy": {
    "recommendedApproach": "বাংলায় পরবর্তী ভিডিওর কৌশল",
    "hookAdvice": "বাংলায় Hook-এর পরামর্শ",
    "storytellingAdvice": "বাংলায় Storytelling-এর পরামর্শ",
    "editingAdvice": "বাংলায় Editing-এর পরামর্শ",
    "endingAdvice": "বাংলায় Ending ও Engagement-এর পরামর্শ"
  },
  "actionPlan": [
    {
      "priority": "High, Medium, or Low",
      "task": "বাংলায় নির্দিষ্ট করণীয়",
      "reason": "বাংলায় কেন এটি গুরুত্বপূর্ণ"
    }
  ],
  "dataLimitations": [
    "বাংলায় অনুপস্থিত তথ্য বা বিশ্লেষণের সীমাবদ্ধতা"
  ]
}

LIMITS:

- Analyze no more than 10 individual videos in videoInsights.
- Use no more than 5 top performers.
- Use no more than 5 underperformers.
- Use no more than 5 action plan items.
- Keep explanations concise but meaningful.
- Never translate original video titles.
- Do not fabricate missing information.
`;

    // ------------------------------
    // USER PROMPT
    // ------------------------------

    const userPrompt = `
Analyze this YouTube channel using the following real database data.

CHANNEL DATA:

${JSON.stringify(channelData, null, 2)}

VIDEO PERFORMANCE DATA:

${JSON.stringify(preparedVideos, null, 2)}

Important:
Write all explanations in Bengali.
Preserve original video titles and channel names.
Keep technical analytics terminology in English.
Return the complete JSON analysis now.
`;

    // ------------------------------
    // GEMINI API
    // ------------------------------

    const geminiResult = await callGemini(
      systemInstruction,
      userPrompt,
      geminiKey
    );

    const analysis = extractJSON(
      geminiResult.generatedText
    );

    // ------------------------------
    // FINAL RESPONSE
    // ------------------------------

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
    console.error(
      "AI analysis error:",
      error
    );

    const message =
      error.message ||
      "An unexpected error occurred during AI analysis.";

    const isTemporary =
      message.includes("503") ||
      message.includes("429") ||
      message.includes("overloaded") ||
      message.includes("high demand") ||
      message.includes("temporarily unavailable");

    return Response.json(
      {
        success: false,

        error: isTemporary
          ? "Gemini সার্ভার বর্তমানে ব্যস্ত। একাধিকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।"
          : message,
      },
      {
        status: isTemporary ? 503 : 500,
      }
    );
  }
}
