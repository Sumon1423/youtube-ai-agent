import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, channelId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // 1. Log Start in Agent Jobs
    const { data: jobData, error: jobErr } = await supabase
      .from("agent_jobs")
      .insert({
        user_id: userId,
        task_type: "Channel Analytics Sync",
        status: "RUNNING",
        payload: { channelId },
      })
      .select()
      .single();

    if (jobErr) {
      console.error("Job insertion error:", jobErr);
    }

    // 2. Fetch User Channels
    const { data: channels, error: channelErr } = await supabase
      .from("channels")
      .select("*")
      .eq("user_id", userId);

    if (channelErr || !channels || channels.length === 0) {
      if (jobData) {
        await supabase
          .from("agent_jobs")
          .update({
            status: "FAILED",
            error_message: "No connected channels found for this user.",
          })
          .eq("id", jobData.id);
      }
      return NextResponse.json(
        { error: "No channels found to sync." },
        { status: 404 }
      );
    }

    // 3. Update Sync Timestamp on Channels
    for (const channel of channels) {
      await supabase
        .from("channels")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", channel.id);
    }

    // 4. Update Agent Job Status to Completed
    if (jobData) {
      await supabase
        .from("agent_jobs")
        .update({
          status: "COMPLETED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobData.id);
    }

    return NextResponse.json({
      success: true,
      message: "Channel data synced successfully.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
