
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

export const runtime = "nodejs";

function decryptToken(encryptedValue) {
  const key = process.env.TOKEN_ENCRYPTION_KEY;

  if (!key || !/^[a-f0-9]{64}$/i.test(key)) {
    throw new Error("Invalid encryption configuration.");
  }

  const parsed = JSON.parse(encryptedValue);

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Buffer.from(key, "hex"),
    Buffer.from(parsed.iv, "hex")
  );

  decipher.setAuthTag(Buffer.from(parsed.tag, "hex"));

  return Buffer.concat([
    decipher.update(Buffer.from(parsed.data, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

async function refreshGoogleToken(refreshToken) {
  const response = await fetch(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error_description ||
      "Could not refresh Google access token."
    );
  }

  return data.access_token;
}

async function analyticsRequest(params, accessToken) {
  const url = new URL(
    "https://youtubeanalytics.googleapis.com/v2/reports"
  );

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("YouTube Analytics API error:", data);

    const message =
      data.error?.message ||
      "YouTube Analytics request failed.";

    if (
      response.status === 403 &&
      message.toLowerCase().includes("scope")
    ) {
      throw new Error(
        "Analytics permission missing. Reconnect YouTube and grant Analytics read-only access."
      );
    }

    throw new Error(message);
  }

  return data;
}

function getDateRange() {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1);

  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 364);

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function rowsToObjects(report) {
  const headers = (report.columnHeaders || []).map(
    (header) => header.name
  );

  return (report.rows || []).map((row) => {
    const result = {};

    headers.forEach((header, index) => {
      result[header] = row[index];
    });

    return result;
  });
}

async function runWithLimit(items, limit, worker) {
  const results = [];
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await worker(items[index]);
    }
  }

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    () => runWorker()
  );

  await Promise.all(workers);

  return results;
}

export async function POST(request) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const publishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const secretKey = process.env.SUPABASE_SECRET_KEY;

    if (
      !supabaseUrl ||
      !publishableKey ||
      !secretKey ||
      !process.env.GOOGLE_CLIENT_ID ||
      !process.env.GOOGLE_CLIENT_SECRET ||
      !process.env.TOKEN_ENCRYPTION_KEY
    ) {
      return NextResponse.json(
        { error: "Server configuration is incomplete." },
        { status: 500 }
      );
    }

    // Authenticate user.
    const authorization =
      request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required." },
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

    const { data: authData, error: authError } =
      await authClient.auth.getUser(accessToken);

    if (authError || !authData?.user) {
      return NextResponse.json(
        { error: "Invalid login session." },
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

    // Find connected channel.
    const { data: channel, error: channelError } =
      await admin
        .from("channels")
        .select("*")
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

    if (!channel.refresh_token_encrypted) {
      return NextResponse.json(
        { error: "YouTube refresh token is missing. Reconnect YouTube." },
        { status: 400 }
      );
    }

    // Decrypt and refresh Google token.
    const refreshToken = decryptToken(
      channel.refresh_token_encrypted
    );

    const googleAccessToken =
      await refreshGoogleToken(refreshToken);

    const { startDate, endDate } = getDateRange();

    // Load videos already synced into CreatorOS.
    const { data: videos, error: videosError } =
      await admin
        .from("videos")
        .select(
          "id, youtube_video_id, performance_data"
        )
        .eq("channel_id", channel.id)
        .order("created_at", { ascending: false })
        .limit(100);

    if (videosError) {
      throw new Error("Could not load synced videos.");
    }

    if (!videos || videos.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Sync your YouTube videos first.",
        videosAnalyzed: 0,
      });
    }

    // Get video IDs.
    const videoIds = videos
      .map((video) => video.youtube_video_id)
      .filter(Boolean);

    // Fetch video-level analytics.
    const metricsReport = await analyticsRequest(
      {
        ids: "channel==MINE",
        startDate,
        endDate,
        dimensions: "video",
        metrics:
          "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes,comments,shares,subscribersGained,subscribersLost",
        filters: `video==${videoIds.join(",")}`,
        maxResults: "200",
        sort: "-views",
      },
      googleAccessToken
    );

    const metricRows = rowsToObjects(metricsReport);

    const metricsByVideo = new Map();

    for (const row of metricRows) {
      metricsByVideo.set(row.video, {
        views: Number(row.views || 0),
        watchTimeMinutes: Number(
          row.estimatedMinutesWatched || 0
        ),
        averageViewDurationSeconds: Number(
          row.averageViewDuration || 0
        ),
        averageViewPercentage:
          row.averageViewPercentage == null
            ? null
            : Number(row.averageViewPercentage),
        likes: Number(row.likes || 0),
        comments: Number(row.comments || 0),
        shares: Number(row.shares || 0),
        subscribersGained: Number(
          row.subscribersGained || 0
        ),
        subscribersLost: Number(
          row.subscribersLost || 0
        ),
      });
    }

    // Audience retention: one video per API request.
    // First version processes the latest 10 videos.
    const retentionVideos = videos.slice(0, 10);

    const retentionResults = await runWithLimit(
      retentionVideos,
      4,
      async (video) => {
        try {
          const report = await analyticsRequest(
            {
              ids: "channel==MINE",
              startDate,
              endDate,
              dimensions: "elapsedVideoTimeRatio",
              metrics:
                "audienceWatchRatio,relativeRetentionPerformance",
              filters:
                `video==${video.youtube_video_id};audienceType==ORGANIC`,
            },
            googleAccessToken
          );

          const rows = rowsToObjects(report);

          return {
            videoId: video.youtube_video_id,
            curve: rows.map((row) => ({
              elapsedVideoTimeRatio: Number(
                row.elapsedVideoTimeRatio
              ),
              audienceWatchRatio:
                row.audienceWatchRatio == null
                  ? null
                  : Number(row.audienceWatchRatio),
              relativeRetentionPerformance:
                row.relativeRetentionPerformance == null
                  ? null
                  : Number(
                      row.relativeRetentionPerformance
                    ),
            })),
            error: null,
          };
        } catch (error) {
          console.error(
            "Retention unavailable:",
            video.youtube_video_id,
            error.message
          );

          return {
            videoId: video.youtube_video_id,
            curve: [],
            error: error.message,
          };
        }
      }
    );

    const retentionByVideo = new Map(
      retentionResults.map((result) => [
        result.videoId,
        result,
      ])
    );

    // Save analytics to existing video records.
    let videosUpdated = 0;
    let videosWithoutMetrics = 0;
    let retentionSaved = 0;
    let updateFailed = 0;

    const syncedAt = new Date().toISOString();

    for (const video of videos) {
      const metrics = metricsByVideo.get(
        video.youtube_video_id
      );

      const retention = retentionByVideo.get(
        video.youtube_video_id
      );

      if (!metrics) {
        videosWithoutMetrics++;
        continue;
      }

      const previousData =
        video.performance_data &&
        typeof video.performance_data === "object"
          ? video.performance_data
          : {};

      const analyticsData = {
        ...previousData.analytics,
        ...metrics,
        dateRange: {
          startDate,
          endDate,
        },
        syncedAt,
      };

      if (retention?.curve?.length) {
        analyticsData.audienceRetention = {
          type: "ORGANIC",
          points: retention.curve,
          pointCount: retention.curve.length,
        };

        retentionSaved++;
      }

      const updateRecord = {
        retention: metrics.averageViewPercentage,
        performance_data: {
          ...previousData,
          analytics: analyticsData,
        },
      };

      const { error: updateError } = await admin
        .from("videos")
        .update(updateRecord)
        .eq("id", video.id);

      if (updateError) {
        console.error(
          "Analytics save failed:",
          video.youtube_video_id,
          updateError.message
        );

        updateFailed++;
      } else {
        videosUpdated++;
      }
    }

    // Save audit log.
    await admin.from("audit_logs").insert({
      user_id: userId,
      action: "youtube_analytics_sync",
      details: {
        channel_id: channel.channel_id,
        date_range: {
          start_date: startDate,
          end_date: endDate,
        },
        videos_found: videos.length,
        videos_updated: videosUpdated,
        videos_without_metrics: videosWithoutMetrics,
        retention_saved: retentionSaved,
        update_failed: updateFailed,
      },
    });

    return NextResponse.json({
      success: true,
      message: "YouTube Analytics synchronization completed.",
      channel: channel.channel_name,
      dateRange: {
        startDate,
        endDate,
      },
      videosFound: videos.length,
      videosUpdated,
      videosWithoutMetrics,
      retentionVideosChecked: retentionVideos.length,
      retentionCurvesSaved: retentionSaved,
      updateFailed,
    });

  } catch (error) {
    console.error(
      "YouTube Analytics sync error:",
      error.message
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "YouTube Analytics synchronization failed.",
      },
      { status: 500 }
    );
  }
}
