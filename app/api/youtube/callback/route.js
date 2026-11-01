
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

export const runtime = "nodejs";

const SITE_URL = "https://youtube-ai-agent-iota.vercel.app";

function redirectWithError(message) {
  const url = new URL("/", SITE_URL);
  url.searchParams.set("youtube_error", message);
  return NextResponse.redirect(url);
}

function encryptToken(token) {
  const key = process.env.TOKEN_ENCRYPTION_KEY;

  if (!key || !/^[a-f0-9]{64}$/i.test(key)) {
    throw new Error("Invalid encryption configuration.");
  }

  const keyBuffer = Buffer.from(key, "hex");
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    keyBuffer,
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return JSON.stringify({
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
    data: encrypted.toString("hex"),
  });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const googleError = searchParams.get("error");

    if (googleError) {
      return redirectWithError("Google authorization was cancelled.");
    }

    if (!code || !state || state.length > 256) {
      return redirectWithError("Invalid authorization response.");
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (
      !supabaseUrl ||
      !secretKey ||
      !clientId ||
      !clientSecret ||
      !redirectUri ||
      !process.env.TOKEN_ENCRYPTION_KEY
    ) {
      throw new Error("Server configuration is incomplete.");
    }

    const supabase = createClient(
      supabaseUrl,
      secretKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // Verify and consume the one-time OAuth state.
    const stateHash = crypto
      .createHash("sha256")
      .update(state)
      .digest("hex");

    const { data: stateRecord, error: stateError } =
      await supabase
        .from("oauth_states")
        .delete()
        .eq("state_hash", stateHash)
        .gt("expires_at", new Date().toISOString())
        .select("user_id")
        .maybeSingle();

    if (stateError || !stateRecord?.user_id) {
      return redirectWithError("Authorization session expired. Try again.");
    }

    // Exchange authorization code for Google tokens.
    const tokenResponse = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
        cache: "no-store",
      }
    );

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok || !tokens.access_token) {
      console.error("Google token exchange failed:", tokens.error);
      return redirectWithError("Google token exchange failed.");
    }

    // Get Google account information.
    const profileResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
        cache: "no-store",
      }
    );

    const profile = await profileResponse.json();

    if (!profileResponse.ok) {
      return redirectWithError("Could not read Google account.");
    }

    // Find the authorized YouTube channel.
    const channelResponse = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
        cache: "no-store",
      }
    );

    const channelData = await channelResponse.json();

    if (!channelResponse.ok || !channelData.items?.length) {
      console.error("YouTube channel lookup failed:", channelData.error);
      return redirectWithError("No accessible YouTube channel was found.");
    }

    const channel = channelData.items[0];
    const channelId = channel.id;
    const channelName = channel.snippet.title;

    // Find an existing connection, if any.
    const { data: existing, error: lookupError } = await supabase
      .from("channels")
      .select("id, refresh_token_encrypted")
      .eq("user_id", stateRecord.user_id)
      .eq("channel_id", channelId)
      .maybeSingle();

    if (lookupError) {
      throw new Error("Could not check existing channel.");
    }

    // Keep an existing refresh token if Google does not return a new one.
    const refreshToken =
      tokens.refresh_token ||
      (existing?.refresh_token_encrypted
        ? null
        : null);

    if (refreshToken) {
      // New refresh token is encrypted before database storage.
    } else if (!existing?.refresh_token_encrypted) {
      return redirectWithError(
        "Google did not provide offline access. Please reconnect and approve access."
      );
    }

    const encryptedToken = refreshToken
      ? encryptToken(refreshToken)
      : existing.refresh_token_encrypted;

    const channelRecord = {
      user_id: stateRecord.user_id,
      channel_id: channelId,
      channel_name: channelName,
      channel_url: `https://www.youtube.com/channel/${channelId}`,
      google_email: profile.email || null,
      refresh_token_encrypted: encryptedToken,
      token_updated_at: refreshToken ? new Date().toISOString() : undefined,
      connected_at: new Date().toISOString(),
      connection_status: "connected",
    };

    let saveResult;

    if (existing) {
      saveResult = await supabase
        .from("channels")
        .update(channelRecord)
        .eq("id", existing.id);
    } else {
      saveResult = await supabase
        .from("channels")
        .insert(channelRecord);
    }

    if (saveResult.error) {
      console.error("Channel save failed:", saveResult.error.message);
      throw new Error("Could not save channel connection.");
    }

    return NextResponse.redirect(
      new URL("/?youtube=connected", SITE_URL)
    );

  } catch (error) {
    console.error("YouTube callback error:", error.message);
    return redirectWithError("YouTube connection failed. Please try again.");
  }
}
