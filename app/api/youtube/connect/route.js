
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const secretKey = process.env.SUPABASE_SECRET_KEY;

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (
      !supabaseUrl ||
      !publishableKey ||
      !secretKey ||
      !clientId ||
      !redirectUri
    ) {
      return NextResponse.json(
        { error: "Server configuration is incomplete." },
        { status: 500 }
      );
    }

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

    const { data, error } =
      await authClient.auth.getUser(accessToken);

    if (error || !data?.user) {
      return NextResponse.json(
        { error: "Invalid login session." },
        { status: 401 }
      );
    }

    const adminClient = createClient(
      supabaseUrl,
      secretKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const state = crypto.randomBytes(32).toString("hex");

    const stateHash = crypto
      .createHash("sha256")
      .update(state)
      .digest("hex");

    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    ).toISOString();

    const { error: insertError } = await adminClient
      .from("oauth_states")
      .insert({
        user_id: data.user.id,
        state_hash: stateHash,
        expires_at: expiresAt,
      });

    if (insertError) {
      return NextResponse.json(
        { error: "Could not create OAuth session." },
        { status: 500 }
      );
    }

    const googleUrl = new URL(
      "https://accounts.google.com/o/oauth2/v2/auth"
    );

    googleUrl.searchParams.set("client_id", clientId);
    googleUrl.searchParams.set("redirect_uri", redirectUri);
    googleUrl.searchParams.set("response_type", "code");

    googleUrl.searchParams.set(
      "scope",
      [
        "openid",
        "email",
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/yt-analytics.readonly",
      ].join(" ")
    );

    googleUrl.searchParams.set("access_type", "offline");
    googleUrl.searchParams.set("prompt", "consent");
    googleUrl.searchParams.set(
      "include_granted_scopes",
      "true"
    );
    googleUrl.searchParams.set("state", state);

    return NextResponse.json({
      url: googleUrl.toString(),
    });
  } catch (error) {
    console.error("YouTube connect error:", error);

    return NextResponse.json(
      { error: "Could not start YouTube connection." },
      { status: 500 }
    );
  }
}
