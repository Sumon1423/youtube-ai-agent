"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  // Status & Dynamic Visibility States
  const [channels, setChannels] = useState([]);
  const [videos, setVideos] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [reports, setReports] = useState([]);

  // Action States
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [analyticsSyncing, setAnalyticsSyncing] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  // Feedback States
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");
  const [aiError, setAiError] = useState("");
  const [latestReport, setLatestReport] = useState(null);

  // Check URL Params for OAuth Redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("youtube");
    const error = params.get("youtube_error");

    if (connected === "connected") {
      setNotice("YouTube channel connected successfully.");
      setNoticeType("success");
    } else if (error) {
      setNotice(error);
      setNoticeType("error");
    }

    if (connected || error) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Authentication Check
  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error || !data.session) {
        router.replace("/login");
        return;
      }

      setUser(data.session.user);
      setChecking(false);
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT" || !session) {
        router.replace("/login");
        return;
      }

      setUser(session.user);
      setChecking(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  // Load Dashboard Data
  async function loadDashboardData(userId) {
    const [channelRes, jobRes, approvalRes, reportRes] = await Promise.all([
      supabase
        .from("channels")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),

      supabase
        .from("agent_jobs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("approvals")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "Pending"),

      supabase
        .from("reports")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    const loadedChannels = channelRes.data || [];
    setChannels(loadedChannels);
    setJobs(jobRes.data || []);
    setApprovals(approvalRes.data || []);

    if (reportRes.data && reportRes.data.length > 0) {
      setLatestReport(reportRes.data[0]);
    }

    // Load Recent Videos if channel exists
    if (loadedChannels.length > 0) {
      const channelIds = loadedChannels.map((c) => c.id);
      const videoRes = await supabase
        .from("videos")
        .select("*")
        .in("channel_id", channelIds)
        .order("created_at", { ascending: false })
        .limit(5);

      setVideos(videoRes.data || []);
    }
  }

  useEffect(() => {
    if (user) loadDashboardData(user.id);
  }, [user]);

  // YouTube Connect
  async function handleConnect() {
    if (connecting) return;
    setConnecting(true);
    setNotice("");

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session?.access_token) {
        throw new Error("Session expired. Please log in again.");
      }

      const res = await fetch("/api/youtube/connect", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      const result = await res.json();

      if (!res.ok || !result.url) {
        throw new Error(result.error || "Could not connect YouTube.");
      }

      window.location.assign(result.url);
    } catch (err) {
      setNotice(err.message);
      setNoticeType("error");
      setConnecting(false);
    }
  }

  // Sync YouTube Content
  async function handleSync() {
    if (syncing) return;
    setSyncing(true);
    setNotice("");

    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch("/api/youtube/sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session?.access_token}` },
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Sync failed.");
      }

      setNotice(`Sync completed. ${result.videosSynced || 0} videos updated.`);
      setNoticeType("success");
      await loadDashboardData(user.id);
    } catch (err) {
      setNotice(err.message);
      setNoticeType("error");
    } finally {
      setSyncing(false);
    }
  }

  // Run AI Performance Doctor
  async function handleAIAnalysis() {
    if (aiAnalyzing) return;
    setAiAnalyzing(true);
    setAiError("");

    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${data.session?.access_token}`,
          "Content-Type": "application/json",
        },
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "AI analysis failed.");
      }

      setNotice("AI Analysis completed successfully.");
      setNoticeType("success");
      await loadDashboardData(user.id);
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiAnalyzing(false);
    }
  }

  if (checking || !user) {
    return (
      <div className="home-loading">
        <div className="spinner" />
        <p>Loading Agent Workspace...</p>
        <style jsx>{`
          .home-loading {
            min-height: 60vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 12px;
            color: #8da2bb;
          }
          .spinner {
            width: 24px;
            height: 24px;
            border: 2px solid rgba(82, 144, 201, 0.22);
            border-top-color: #25d8e8;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const isConnected = channels.length > 0;
  const activeChannel = isConnected ? channels[0] : null;

  return (
    <div className="home-container">
      {/* Dynamic Header */}
      <section className="welcome-banner">
        <div>
          <span className="eyebrow">AGENT OVERVIEW</span>
          <h1>Creator<span>OS</span></h1>
          <p>Autonomous YouTube Shorts Channel Management System</p>
        </div>
      </section>

      {/* Global Alerts */}
      {notice && (
        <div className={`alert-box ${noticeType}`}>
          <span>{noticeType === "error" ? "⚠" : "✓"}</span>
          <p>{notice}</p>
        </div>
      )}

      {/* Dynamic Visibility Step 1: YouTube Setup (Hidden once connected) */}
      {!isConnected && (
        <section className="setup-card">
          <div className="setup-info">
            <span className="icon-badge">⚡</span>
            <div>
              <h3>Connect Your YouTube Channel</h3>
              <p>Authorize CreatorOS to access your channel data and metrics.</p>
            </div>
          </div>
          <button className="btn-primary" onClick={handleConnect} disabled={connecting}>
            {connecting ? "Connecting..." : "Connect YouTube Account"}
          </button>
        </section>
      )}

      {/* Dynamic Visibility Step 2: Agent Operations Center (Shown after connection) */}
      {isConnected && (
        <>
          <section className="status-grid">
            <div className="status-card">
              <span className="status-label">Channel Connected</span>
              <strong className="status-value">{activeChannel.channel_name || "Active Channel"}</strong>
              <span className="badge success">Connected</span>
            </div>

            <div className="status-card">
              <span className="status-label">Pending Approvals</span>
              <strong className="status-value">{approvals.length} Tasks</strong>
              <button
                className="card-link"
                onClick={() => router.push("/tasks")}
              >
                Review Tasks →
              </button>
            </div>

            <div className="status-card">
              <span className="status-label">Synced Videos</span>
              <strong className="status-value">{videos.length} Videos</strong>
              <button
                className="card-link"
                onClick={() => router.push("/performance")}
              >
                View Analytics →
              </button>
            </div>
          </section>

          {/* Quick Reusable Actions */}
          <section className="actions-bar">
            <button className="btn-action" onClick={handleSync} disabled={syncing}>
              {syncing ? "Syncing..." : "↻ Sync Channel Videos"}
            </button>
            <button className="btn-action ai-btn" onClick={handleAIAnalysis} disabled={aiAnalyzing}>
              {aiAnalyzing ? "Analyzing..." : "✨ Run AI Doctor"}
            </button>
          </section>

          {aiError && <div className="alert-box error"><span>⚠</span><p>{aiError}</p></div>}
        </>
      )}

      {/* Latest AI Strategy Summary Component */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2>AI Channel Intelligence Summary</h2>
          <button
            className="text-button"
            onClick={() => router.push("/intelligence")}
          >
            Open Intelligence Hub →
          </button>
        </div>

        {latestReport ? (
          <div className="ai-report-card">
            <div className="report-header">
              <span className="badge cyan">Latest Report</span>
              <small>{new Date(latestReport.created_at).toLocaleDateString()}</small>
            </div>
            <h3>{latestReport.report_data?.overview?.summary || "Channel Analysis Completed"}</h3>

            <div className="report-structured-grid">
              <div className="report-block">
                <h4>Measured Facts</h4>
                <p>Total Views: {latestReport.report_data?.overview?.totalViews || "—"}</p>
                <p>Performance Level: {latestReport.report_data?.overview?.performanceLevel || "Normal"}</p>
              </div>

              <div className="report-block">
                <h4>AI Findings</h4>
                <p>{latestReport.report_data?.overview?.keyFinding || "No critical issues detected."}</p>
              </div>

              <div className="report-block">
                <h4>Recommendations</h4>
                <p>{latestReport.report_data?.nextVideoStrategy?.hookStrategy || "Focus on strong opening visual hooks within 2 seconds."}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state-card">
            <p>No AI analysis generated yet. Click "Run AI Doctor" above to analyze your channel performance.</p>
          </div>
        )}
      </section>

      {/* Recent Videos Overview */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2>Recent Video Performance</h2>
          <button
            className="text-button"
            onClick={() => router.push("/performance")}
          >
            View All Videos ({videos.length}) →
          </button>
        </div>

        {videos.length === 0 ? (
          <div className="empty-state-card">
            <p>No synced videos. Click "Sync Channel Videos" above to pull your content.</p>
          </div>
        ) : (
          <div className="video-list">
            {videos.slice(0, 3).map((video) => (
              <div
                key={video.id}
                className="video-item"
                onClick={() => router.push(`/video/${video.id}`)}
              >
                <div className="thumb-placeholder">▶</div>
                <div className="video-info">
                  <strong>{video.title || "Untitled Video"}</strong>
                  <span>{Number(video.views || 0).toLocaleString()} Views</span>
                </div>
                <span className="arrow-icon">›</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <style jsx>{`
        .home-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .welcome-banner {
          margin-bottom: 4px;
        }

        .eyebrow {
          color: #52b5ff;
          font-size: 10px;
          letter-spacing: 1.5px;
          font-weight: 800;
        }

        .welcome-banner h1 {
          font-size: 28px;
          margin: 4px 0;
          letter-spacing: -0.5px;
        }

        .welcome-banner h1 span {
          color: #25d8e8;
        }

        .welcome-banner p {
          color: #8da2bb;
          font-size: 12px;
          margin: 0;
        }

        .alert-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 12px;
        }

        .alert-box.success {
          background: rgba(31, 148, 99, 0.15);
          border: 1px solid rgba(62, 211, 147, 0.3);
          color: #6ce1ad;
        }

        .alert-box.error {
          background: rgba(184, 52, 78, 0.15);
          border: 1px solid rgba(255, 117, 139, 0.3);
          color: #ff9aa9;
        }

        .alert-box p {
          margin: 0;
        }

        .setup-card {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 20px;
          background: rgba(15, 27, 44, 0.75);
          border: 1px solid rgba(112, 165, 220, 0.2);
          border-radius: 16px;
        }

        .setup-info {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .icon-badge {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          background: rgba(37, 216, 232, 0.1);
          border-radius: 10px;
          font-size: 20px;
          color: #25d8e8;
        }

        .setup-info h3 {
          margin: 0 0 4px;
          font-size: 14px;
        }

        .setup-info p {
          margin: 0;
          font-size: 11px;
          color: #8da2bb;
        }

        .btn-primary {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, #168cff, #13d4e8);
          color: white;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
        }

        .status-card {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 14px;
          background: rgba(15, 27, 44, 0.65);
          border: 1px solid rgba(112, 165, 220, 0.16);
          border-radius: 12px;
        }

        .status-label {
          font-size: 10px;
          color: #8da2bb;
        }

        .status-value {
          font-size: 16px;
          font-weight: 700;
        }

        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 9px;
          font-weight: 700;
          width: fit-content;
        }

        .badge.success {
          background: rgba(69, 223, 170, 0.15);
          color: #45dfaa;
        }

        .badge.cyan {
          background: rgba(37, 216, 232, 0.15);
          color: #25d8e8;
        }

        .card-link {
          background: transparent;
          border: none;
          padding: 0;
          color: #3298ff;
          font-size: 11px;
          text-align: left;
          cursor: pointer;
        }

        .actions-bar {
          display: flex;
          gap: 10px;
        }

        .btn-action {
          flex: 1;
          padding: 12px;
          border: 1px solid rgba(112, 165, 220, 0.2);
          border-radius: 10px;
          background: rgba(17, 34, 55, 0.8);
          color: #edf6ff;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-action.ai-btn {
          border-color: rgba(37, 216, 232, 0.3);
          background: rgba(37, 216, 232, 0.1);
          color: #25d8e8;
        }

        .dashboard-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .section-header h2 {
          font-size: 14px;
          margin: 0;
        }

        .text-button {
          background: transparent;
          border: none;
          color: #3298ff;
          font-size: 11px;
          cursor: pointer;
        }

        .ai-report-card {
          padding: 16px;
          background: rgba(15, 27, 44, 0.75);
          border: 1px solid rgba(37, 216, 232, 0.2);
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .report-header small {
          color: #8da2bb;
          font-size: 10px;
        }

        .ai-report-card h3 {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
        }

        .report-structured-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px;
        }

        .report-block {
          padding: 10px;
          background: rgba(7, 13, 23, 0.6);
          border-radius: 8px;
          border: 1px solid rgba(112, 165, 220, 0.1);
        }

        .report-block h4 {
          margin: 0 0 6px;
          font-size: 10px;
          color: #25d8e8;
          text-transform: uppercase;
        }

        .report-block p {
          margin: 0;
          font-size: 11px;
          color: #edf6ff;
          line-height: 1.4;
        }

        .empty-state-card {
          padding: 20px;
          text-align: center;
          background: rgba(15, 27, 44, 0.4);
          border: 1px dashed rgba(112, 165, 220, 0.2);
          border-radius: 12px;
          color: #8da2bb;
          font-size: 11px;
        }

        .video-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .video-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          background: rgba(15, 27, 44, 0.65);
          border: 1px solid rgba(112, 165, 220, 0.16);
          border-radius: 10px;
          cursor: pointer;
        }

        .thumb-placeholder {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          background: rgba(50, 152, 255, 0.15);
          color: #3298ff;
          border-radius: 8px;
          font-size: 12px;
        }

        .video-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .video-info strong {
          font-size: 11px;
          line-height: 1.3;
        }

        .video-info span {
          font-size: 9px;
          color: #8da2bb;
        }

        .arrow-icon {
          color: #8da2bb;
          font-size: 16px;
        }
      `}</style>
    </div>
  );
}
