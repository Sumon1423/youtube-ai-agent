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
    throw new Error("Could not refresh Google access token.");
  }

  return data.access_token;
}

async function youtubeRequest(url, accessToken) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("YouTube API error:", data.error?.message);
    throw new Error(
      data.error?.message || "YouTube API request failed."
    );
  }

  return data;
}

export async function POST(request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
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

    // Authenticate the logged-in user.
    const authorization = request.headers.get("authorization");

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

    // Create server-side database client.
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

    // Find the user's connected YouTube channel.
    const { data: channel, error: channelError } = await admin
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

    // Decrypt the saved refresh token.
    const refreshToken = decryptToken(
      channel.refresh_token_encrypted
    );

    // Get a fresh Google access token.
    const googleAccessToken =
      await refreshGoogleToken(refreshToken);

    // Verify the connected YouTube channel.
    const channelData = await youtubeRequest(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&mine=true",
      googleAccessToken
    );

    const youtubeChannel = channelData.items?.find(
      (item) => item.id === channel.channel_id
    );

    if (!youtubeChannel) {
      throw new Error(
        "The connected YouTube channel could not be accessed."
      );
    }

    const uploadsPlaylist =
      youtubeChannel.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylist) {
      throw new Error("Uploads playlist was not found.");
    }

    // Fetch the latest uploaded videos.
    let playlistItems = [];
    let pageToken = "";

    for (let page = 0; page < 2; page++) {
      let url =
        "https://www.googleapis.com/youtube/v3/playlistItems" +
        `?part=snippet,contentDetails&playlistId=${uploadsPlaylist}` +
        "&maxResults=50";

      if (pageToken) {
        url += `&pageToken=${encodeURIComponent(pageToken)}`;
      }

      const playlistData = await youtubeRequest(
        url,
        googleAccessToken
      );

      playlistItems.push(...(playlistData.items || []));

      pageToken = playlistData.nextPageToken;

      if (!pageToken) break;
    }

    const videoIds = [
      ...new Set(
        playlistItems
          .map((item) => item.contentDetails?.videoId)
          .filter(Boolean)
      ),
    ];

    if (videoIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No uploaded videos were found.",
        synced: 0,
      });
    }

    // Fetch video statistics in batches of 50.
    let videos = [];

    for (let i = 0; i < videoIds.length; i += 50) {
      const batch = videoIds.slice(i, i + 50);

      const videoData = await youtubeRequest(
        "https://www.googleapis.com/youtube/v3/videos" +
          `?part=snippet,statistics,contentDetails&id=${batch.join(",")}`,
        googleAccessToken
      );

      videos.push(...(videoData.items || []));
    }

    // Save videos to Supabase.
    let synced = 0;
    let failed = 0;

    for (const video of videos) {
      const videoRecord = {
        channel_id: channel.id,
        youtube_video_id: video.id,
        title: video.snippet?.title || "Untitled",
        description: video.snippet?.description || "",
        views: Number(video.statistics?.viewCount || 0),
        likes: Number(video.statistics?.likeCount || 0),
        comments_count: Number(
          video.statistics?.commentCount || 0
        ),
        performance_data: {
          publishedAt: video.snippet?.publishedAt || null,
          thumbnails: video.snippet?.thumbnails || {},
          tags: video.snippet?.tags || [],
          categoryId: video.snippet?.categoryId || null,
          duration: video.contentDetails?.duration || null,
          privacyStatus:
            video.status?.privacyStatus || null,
          syncedAt: new Date().toISOString(),
        },
      };

      // Check whether this video already exists.
      const { data: existing, error: lookupError } =
        await admin
          .from("videos")
          .select("id")
          .eq("channel_id", channel.id)
          .eq("youtube_video_id", video.id)
          .maybeSingle();

      if (lookupError) {
        failed++;
        continue;
      }

      let saveResult;

      if (existing) {
        saveResult = await admin
          .from("videos")
          .update(videoRecord)
          .eq("id", existing.id);
      } else {
        saveResult = await admin
          .from("videos")
          .insert(videoRecord);
      }

      if (saveResult.error) {
        console.error(
          "Video save failed:",
          saveResult.error.message
        );
        failed++;
      } else {
        synced++;
      }
    }

    // Record the sync operation.
    await admin.from("audit_logs").insert({
      user_id: userId,
      action: "youtube_video_sync",
      details: {
        channel_id: channel.channel_id,
        videos_found: videos.length,
        videos_synced: synced,
        videos_failed: failed,
      },
    });

    return NextResponse.json({
      success: true,
      message: "YouTube video synchronization completed.",
      channel: channel.channel_name,
      videosFound: videos.length,
      videosSynced: synced,
      videosFailed: failed,
    });

  } catch (error) {
    console.error("YouTube sync error:", error.message);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "YouTube synchronization failed.",
      },
      { status: 500 }
    );
  }
}
