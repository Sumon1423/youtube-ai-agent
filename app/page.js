
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const intelligence = [
  ["📡", "Channel Monitor", "Monitor channel performance."],
  ["🩺", "Video Doctor", "Analyze video performance."],
  ["🔎", "SEO Intelligence", "Review titles and descriptions."],
  ["📈", "Trend Radar", "Discover USA trends."],
  ["👥", "Audience Insights", "Understand viewer behavior."],
  ["💬", "Comment Center", "Monitor comments."],
  ["🎯", "Competitor Watch", "Track similar channels."],
  ["🧠", "Growth Intelligence", "Find growth opportunities."],
];

const production = [
  ["💡", "Video Ideas", "Discover video topics."],
  ["✍️", "Script Studio", "Create video scripts."],
  ["🖼️", "Asset Manager", "Manage video assets."],
  ["🎙️", "Voice Studio", "Generate narration."],
  ["🎬", "AI Editor", "Edit videos automatically."],
  ["▶️", "Video Preview", "Review final videos."],
  ["🚀", "Publishing", "Prepare approved videos."],
];

const tabs = [
  ["Home", "⌂"],
  ["Intelligence", "◈"],
  ["Production", "▣"],
  ["More", "•••"],
];

function Status({ value }) {
  const status = String(value || "Waiting").toLowerCase();
  let className = "waiting";

  if (["connected", "completed", "approved", "strong"].includes(status)) {
    className = "success";
  }
  if (["running", "processing", "average"].includes(status)) {
    className = "running";
  }
  if (["failed", "rejected", "weak", "high"].includes(status)) {
    className = "danger";
  }

  return <span className={`status ${className}`}>{value || "Waiting"}</span>;
}

function Section({ title, subtitle }) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <span className="section-line" />
    </div>
  );
}

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState("Home");

  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [analyticsSyncing, setAnalyticsSyncing] = useState(false);

  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState(null);
  const [aiError, setAiError] = useState("");

  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");
  const [syncResult, setSyncResult] = useState(null);
  const [analyticsResult, setAnalyticsResult] = useState(null);

  const [channels, setChannels] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [reports, setReports] = useState([]);

  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState(null);

  const [loadingData, setLoadingData] = useState(false);
  const [databaseError, setDatabaseError] = useState("");

  const [automation, setAutomation] = useState(true);
  const [notifications, setNotifications] = useState(true);

  // OAuth callback result
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

  // Authentication
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

  // Load database data
  async function loadDashboardData(userId) {
    setLoadingData(true);
    setDatabaseError("");

    const results = await Promise.all([
      supabase
        .from("channels")
        .select("id,channel_name,channel_url,connection_status,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),

      supabase
        .from("agent_jobs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),

      supabase
        .from("approvals")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),

      supabase
        .from("reports")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const loadedChannels = results[0].data || [];

    setChannels(loadedChannels);
    setJobs(results[1].data || []);
    setApprovals(results[2].data || []);
    setReports(results[3].data || []);

    setVideosLoading(true);

    if (loadedChannels.length > 0) {
      const channelIds = loadedChannels.map((channel) => channel.id);

      const videoResult = await supabase
        .from("videos")
        .select(
          "id,channel_id,youtube_video_id,title,description,views,likes,comments_count,retention,performance_data,created_at"
        )
        .in("channel_id", channelIds)
        .order("created_at", { ascending: false })
        .limit(100);

      if (videoResult.error) {
        setDatabaseError((current) =>
          [current, videoResult.error.message].filter(Boolean).join(" | ")
        );
        setVideos([]);
      } else {
        const loadedVideos = videoResult.data || [];
        setVideos(loadedVideos);

        setSelectedVideoId((current) =>
          loadedVideos.some((video) => video.id === current)
            ? current
            : loadedVideos[0]?.id || null
        );
      }
    } else {
      setVideos([]);
      setSelectedVideoId(null);
    }

    setVideosLoading(false);

    const errors = results
      .filter((result) => result.error)
      .map((result) => result.error.message);

    if (errors.length) setDatabaseError(errors.join(" | "));
    setLoadingData(false);
  }

  useEffect(() => {
    if (user) loadDashboardData(user.id);
  }, [user]);

  // Connect YouTube
  async function handleConnect() {
    if (connecting) return;

    setConnecting(true);
    setNotice("");

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session?.access_token) {
        throw new Error("Login session expired. Please log in again.");
      }

      const response = await fetch("/api/youtube/connect", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.url) {
        throw new Error(result.error || "Could not connect YouTube.");
      }

      window.location.assign(result.url);
    } catch (error) {
      setNotice(error.message);
      setNoticeType("error");
      setConnecting(false);
    }
  }

  // Sync YouTube videos
  async function handleSync() {
    if (syncing) return;

    setSyncing(true);
    setNotice("");
    setSyncResult(null);

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session?.access_token) {
        throw new Error("Login session expired. Please log in again.");
      }

      const response = await fetch("/api/youtube/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
        cache: "no-store",
      });

      const rawResponse = await response.text();
      let result;

      try {
        result = JSON.parse(rawResponse);
      } catch {
        throw new Error(
          `YouTube sync returned a non-JSON response. HTTP ${response.status}. ${rawResponse.slice(0, 250)}`
        );
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || `YouTube sync failed (HTTP ${response.status}).`
        );
      }

      setSyncResult(result);
      setNotice(`Sync completed. ${result.videosSynced || 0} videos saved.`);
      setNoticeType("success");

      await loadDashboardData(user.id);
    } catch (error) {
      setNotice(error.message || "YouTube sync failed.");
      setNoticeType("error");
    } finally {
      setSyncing(false);
    }
  }

  // Sync YouTube Analytics
  async function handleAnalyticsSync() {
    if (analyticsSyncing) return;

    setAnalyticsSyncing(true);
    setNotice("");
    setAnalyticsResult(null);

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session?.access_token) {
        throw new Error("Login session expired. Please log in again.");
      }

      const response = await fetch("/api/youtube/analytics", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
        cache: "no-store",
      });

      const rawResponse = await response.text();
      let result;

      try {
        result = JSON.parse(rawResponse);
      } catch {
        throw new Error(
          `Analytics API returned a non-JSON response. HTTP ${response.status}. ${rawResponse.slice(0, 250)}`
        );
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            `Analytics synchronization failed (HTTP ${response.status}).`
        );
      }

      setAnalyticsResult(result);
      setNotice(
        `Analytics sync completed. ${result.videosUpdated || 0} videos updated.`
      );
      setNoticeType("success");

      await loadDashboardData(user.id);
    } catch (error) {
      setNotice(error.message || "Analytics synchronization failed.");
      setNoticeType("error");
    } finally {
      setAnalyticsSyncing(false);
    }
  }

  // AI Performance Analysis
  async function handleAIAnalysis() {
    if (aiAnalyzing) return;

    setAiAnalyzing(true);
    setAiError("");
    setAiReport(null);

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session?.access_token) {
        throw new Error("Login session expired. Please log in again.");
      }

      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
        cache: "no-store",
      });

      const rawResponse = await response.text();
      let result;

      try {
        result = JSON.parse(rawResponse);
      } catch {
        throw new Error(
          `AI API returned a non-JSON response. HTTP ${response.status}. ${rawResponse.slice(0, 300)}`
        );
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || `AI analysis failed (HTTP ${response.status}).`
        );
      }

      setAiReport(result);
    } catch (error) {
      setAiError(error.message || "AI analysis failed.");
    } finally {
      setAiAnalyzing(false);
    }
  }

  // Logout
  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setNotice(error.message);
      setNoticeType("error");
      return;
    }

    router.replace("/login");
  }

  if (checking || !user) {
    return (
      <main className="loading">
        <div className="logo">C</div>
        <div className="spinner" />
        <p>Checking your session...</p>
        <style jsx global>{`
          body {
            margin: 0;
            background: #070b14;
          }
          .loading {
            min-height: 100dvh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 16px;
            color: #a9bfd8;
            font-family: Arial, sans-serif;
            background:
              radial-gradient(ellipse at 50% 35%, #12345b 0%, transparent 50%),
              #070b14;
          }
          .logo {
            width: 58px;
            height: 58px;
            display: grid;
            place-items: center;
            border-radius: 17px;
            color: white;
            font-size: 27px;
            font-weight: 900;
            background: linear-gradient(135deg, #168cff, #13d4e8);
            box-shadow: 0 0 35px #168cff66;
          }
          .spinner {
            width: 24px;
            height: 24px;
            border: 2px solid #24415f;
            border-top-color: #20c9ef;
            border-radius: 50%;
            animation: spin .8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    );
  }

  const completedJobs = jobs.filter(
    (job) => job.status?.toLowerCase() === "completed"
  ).length;

  const failedJobs = jobs.filter(
    (job) => job.status?.toLowerCase() === "failed"
  ).length;

  const pendingApprovals = approvals.filter(
    (item) => item.status?.toLowerCase() === "pending"
  ).length;

  const runningJobs = jobs.filter((job) =>
    ["running", "processing"].includes(job.status?.toLowerCase())
  ).length;

  const selectedVideo =
    videos.find((video) => video.id === selectedVideoId) || videos[0] || null;

  function getVideoAnalytics(video) {
    const root = video?.performance_data || {};
    return root.analytics || root.youtubeAnalytics || root;
  }

  function getMetric(video, ...keys) {
    const analytics = getVideoAnalytics(video);

    for (const key of keys) {
      const value = analytics?.[key] ?? video?.[key];

      if (value !== null && value !== undefined && value !== "") {
        const number = Number(value);
        if (Number.isFinite(number)) return number;
      }
    }

    return null;
  }

  function formatNumber(value) {
    return value === null ||
      value === undefined ||
      !Number.isFinite(Number(value))
      ? "—"
      : Number(value).toLocaleString();
  }

  function formatDuration(seconds) {
    if (seconds === null || !Number.isFinite(seconds)) return "—";

    const total = Math.max(0, Math.round(seconds));
    const minutes = Math.floor(total / 60);
    const remaining = total % 60;

    return minutes ? `${minutes}m ${remaining}s` : `${remaining}s`;
  }

  function getRetentionPoints(video) {
    const analytics = getVideoAnalytics(video);
    const retentionData = analytics?.audienceRetention;

    const curve =
      analytics?.retentionCurve ||
      analytics?.retentionPoints ||
      (Array.isArray(retentionData)
        ? retentionData
        : retentionData?.points || []);

    if (!Array.isArray(curve)) return [];

    return curve
      .map((point, index) => ({
        label:
          point.elapsedVideoTimeRatio ??
          point.elapsedVideoTime ??
          point.label ??
          index,
        value: Number(
          point.audienceWatchRatio ??
            point.value ??
            point.retention ??
            0
        ),
      }))
      .filter((point) => Number.isFinite(point.value));
  }

  function renderAIReport() {
    if (!aiReport?.analysis) return null;

    const analysis = aiReport.analysis;

    const overview =
      typeof analysis.overview === "object" && analysis.overview !== null
        ? analysis.overview
        : { summary: analysis.overview || "No summary available." };

    const list = (items, prefix) => {
      if (!Array.isArray(items) || items.length === 0) {
        return <p className="report-muted">No information available.</p>;
      }

      return items.map((item, index) => (
        <div className="report-item" key={`${prefix}-${index}`}>
          {typeof item === "string" ? item : JSON.stringify(item)}
        </div>
      ));
    };

    const performers = Array.isArray(analysis.topPerformers)
      ? analysis.topPerformers
      : [];

    const underperformers = Array.isArray(analysis.underperformers)
      ? analysis.underperformers
      : [];

    const insights = Array.isArray(analysis.videoInsights)
      ? analysis.videoInsights
      : [];

    const actions = Array.isArray(analysis.actionPlan)
      ? analysis.actionPlan
      : [];

    const strategy = analysis.nextVideoStrategy || {};

    return (
      <div className="performance-panel ai-report">
        <div className="performance-title">
          <div>
            <span className="eyebrow">AI PERFORMANCE INTELLIGENCE</span>
            <h3>Channel Analysis Report</h3>
          </div>
          <Status value="Completed" />
        </div>

        <p className="report-overview">
          {overview.summary || "Analysis completed."}
        </p>

        <div className="metric-grid">
          <div className="metric-tile">
            <strong>{overview.performanceLevel || "—"}</strong>
            <span>Performance Level</span>
          </div>
          <div className="metric-tile">
            <strong>{formatNumber(overview.totalViews)}</strong>
            <span>Total Views</span>
          </div>
          <div className="metric-tile">
            <strong>{formatNumber(overview.averageViews)}</strong>
            <span>Average Views</span>
          </div>
          <div className="metric-tile">
            <strong>
              {aiReport.videosAnalyzed || overview.totalVideosAnalyzed || 0}
            </strong>
            <span>Videos Analyzed</span>
          </div>
        </div>

        <Section title="Key Finding" />
        <div className="report-card">
          <p>{overview.keyFinding || "No key finding available."}</p>
        </div>

        <Section title="Overall Strengths" />
        {list(analysis.strengths || analysis.overallStrengths, "strength")}

        <Section title="Overall Weaknesses" />
        {list(analysis.weaknesses || analysis.overallWeaknesses, "weakness")}

        <Section title="Top Performers" />
        {performers.length === 0 ? (
          <p className="report-muted">No top performers identified.</p>
        ) : (
          performers.map((item, index) => (
            <div className="report-card" key={`top-${index}`}>
              <h4>{item.title || "Untitled video"}</h4>
              <p>{item.reason || "No explanation available."}</p>
              <p>Views: {formatNumber(item.views)}</p>
            </div>
          ))
        )}

        <Section title="Underperformers" />
        {underperformers.length === 0 ? (
          <p className="report-muted">No underperformers identified.</p>
        ) : (
          underperformers.map((item, index) => (
            <div className="report-card" key={`under-${index}`}>
              <h4>{item.title || "Untitled video"}</h4>
              <p>Views: {formatNumber(item.views)}</p>
              <strong>Evidence</strong>
              <p>
                {typeof item.evidence === "string"
                  ? item.evidence
                  : "No evidence available."}
              </p>
              <strong>Possible Issues</strong>
              {list(item.possibleIssues, `issue-${index}`)}
            </div>
          ))
        )}

        <Section title="Video Insights" />
        {insights.length === 0 ? (
          <p className="report-muted">
            No individual video insights available.
          </p>
        ) : (
          insights.map((item, index) => (
            <div className="report-card" key={`insight-${index}`}>
              <h4>{item.title || "Untitled video"}</h4>
              <p>{item.performance || "No performance assessment."}</p>
              <strong>Strengths</strong>
              {list(item.strengths, `video-strength-${index}`)}
              <strong>Weaknesses</strong>
              {list(item.weaknesses, `video-weakness-${index}`)}
              <strong>Retention Insights</strong>
              {list(item.retentionInsights, `retention-${index}`)}
              <strong>Recommendations</strong>
              {list(item.recommendations, `recommendation-${index}`)}
            </div>
          ))
        )}

        <Section title="Next Video Strategy" />
        <div className="report-card">
          {Object.entries(strategy).map(([key, value]) => (
            <div className="strategy-item" key={key}>
              <strong>{key.replace(/([A-Z])/g, " $1")}</strong>
              <p>
                {typeof value === "string" ? value : JSON.stringify(value)}
              </p>
            </div>
          ))}
        </div>

        <Section title="Action Plan" />
        {actions.length === 0 ? (
          <p className="report-muted">No action plan available.</p>
        ) : (
          actions.map((item, index) => (
            <div className="report-card" key={`action-${index}`}>
              <Status value={item.priority || "Normal"} />
              <h4>{item.task || "Recommended action"}</h4>
              <p>{item.reason || ""}</p>
            </div>
          ))
        )}

        <Section title="Data Limitations" />
        {list(analysis.dataLimitations, "limitation")}

        <button
          className="sync-button report-refresh"
          onClick={handleAIAnalysis}
          disabled={aiAnalyzing}
        >
          {aiAnalyzing ? "Analyzing..." : "Run Analysis Again ↻"}
        </button>
      </div>
    );
  }

  // Home dashboard
  function renderHome() {
    return (
      <>
        <div className="welcome">
          <div>
            <span className="eyebrow">YOUR AI WORKSPACE</span>
            <h1>Creator<span>OS</span></h1>
            <p>Your personal AI YouTube channel manager.</p>
          </div>
          <div className="avatar">
            {(user.email || "U").charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="hero">
          <div className="hero-orb orb-one" />
          <div className="hero-orb orb-two" />
          <div className="hero-content">
            <span className="eyebrow">✦ AI AGENT STATUS</span>
            <h2>
              {channels.length
                ? "Your YouTube channel is connected."
                : "Connect your YouTube channel."}
            </h2>
            <p>
              {channels.length
                ? "Your channel is linked to CreatorOS. Your workspace is ready for channel analysis."
                : "Authorize CreatorOS to access your YouTube channel data and start building your workspace."}
            </p>
            <button
              className="primary"
              onClick={handleConnect}
              disabled={connecting}
            >
              {connecting
                ? "Connecting..."
                : channels.length
                  ? "Reconnect YouTube"
                  : "Connect YouTube"}
              <span>→</span>
            </button>
          </div>
          <div className="hero-decoration">C</div>
        </div>

        {notice && (
          <div className={noticeType === "error" ? "error-box" : "success-box"}>
            <span>{noticeType === "error" ? "⚠" : "✓"}</span>
            {notice}
          </div>
        )}

        {channels.length > 0 && (
          <div className="sync-card">
            <div className="sync-icon">↻</div>
            <div className="sync-copy">
              <h3>Sync YouTube Data</h3>
              <p>
                Import your latest videos and available statistics into
                CreatorOS.
              </p>
            </div>
            <button
              className="sync-button"
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? "Syncing..." : "Sync Now ↻"}
            </button>
            {syncResult && (
              <div className="sync-result">
                Found: {syncResult.videosFound} · Saved:{" "}
                {syncResult.videosSynced} · Failed: {syncResult.videosFailed}
              </div>
            )}
          </div>
        )}

        {channels.length > 0 && (
          <div className="sync-card">
            <div className="sync-icon cyan">◈</div>
            <div className="sync-copy">
              <h3>Personalized YouTube Analytics</h3>
              <p>
                Import available watch time, average view duration, engagement
                and audience-retention data for your videos.
              </p>
            </div>
            <button
              className="sync-button cyan-button"
              onClick={handleAnalyticsSync}
              disabled={analyticsSyncing}
            >
              {analyticsSyncing ? "Syncing..." : "Sync Analytics ↗"}
            </button>
            {analyticsResult && (
              <div className="sync-result">
                Updated: {analyticsResult.videosUpdated || 0} · Retention
                curves: {analyticsResult.retentionCurvesSaved || 0} · Missing
                metrics: {analyticsResult.videosWithoutMetrics || 0}
              </div>
            )}
          </div>
        )}

        {channels.length > 0 && (
          <div className="sync-card ai-launch-card">
            <div className="sync-icon purple">✧</div>
            <div className="sync-copy">
              <h3>AI Video Doctor</h3>
              <p>
                Analyze your channel's actual performance, discover weaknesses
                and get a practical growth strategy.
              </p>
            </div>
            <button
              className="sync-button ai-button"
              onClick={handleAIAnalysis}
              disabled={aiAnalyzing || videos.length === 0}
            >
              {aiAnalyzing ? "AI Analyzing..." : "Run AI Analysis ✨"}
            </button>
            {aiAnalyzing && (
              <div className="ai-loading">
                <div className="spinner" />
                <span>
                  AI is studying your video performance. Please wait...
                </span>
              </div>
            )}
            {aiError && <div className="error-box">{aiError}</div>}
          </div>
        )}

        {renderAIReport()}

        <Section
          title="Video Performance"
          subtitle="Real metrics imported from your YouTube Analytics account"
        />

        {videosLoading ? (
          <div className="empty">
            <div className="spinner" />
            Loading video analytics...
          </div>
        ) : videos.length === 0 ? (
          <div className="empty">
            <span className="empty-icon">▤</span>
            <strong>No synced videos found</strong>
            <p>Run Sync Now first, then Sync Analytics.</p>
          </div>
        ) : (
          <>
            <div className="video-list">
              {videos.map((video) => {
                const averagePercentage = getMetric(
                  video,
                  "averageViewPercentage"
                );

                return (
                  <button
                    className={`video-row ${
                      selectedVideo?.id === video.id ? "selected" : ""
                    }`}
                    key={video.id}
                    onClick={() => setSelectedVideoId(video.id)}
                  >
                    <span className="video-thumb">▶</span>
                    <span className="video-row-main">
                      <strong>{video.title || "Untitled video"}</strong>
                      <small>
                        {formatNumber(Number(video.views || 0))} views ·{" "}
                        {averagePercentage === null
                          ? "No retention %"
                          : `${averagePercentage.toFixed(1)}% avg viewed`}
                      </small>
                    </span>
                    <span className="video-row-arrow">›</span>
                  </button>
                );
              })}
            </div>

            {selectedVideo &&
              (() => {
                const avgDuration = getMetric(
                  selectedVideo,
                  "averageViewDurationSeconds",
                  "averageViewDuration"
                );
                const avgPercentage = getMetric(
                  selectedVideo,
                  "averageViewPercentage"
                );
                const watchMinutes = getMetric(
                  selectedVideo,
                  "watchTimeMinutes",
                  "estimatedMinutesWatched"
                );
                const likes =
                  getMetric(selectedVideo, "likes") ??
                  Number(selectedVideo.likes || 0);
                const comments =
                  getMetric(selectedVideo, "comments") ??
                  Number(selectedVideo.comments_count || 0);
                const shares = getMetric(selectedVideo, "shares");
                const subscribersGained = getMetric(
                  selectedVideo,
                  "subscribersGained"
                );
                const retentionPoints = getRetentionPoints(selectedVideo);
                const maxRetention = Math.max(
                  1,
                  ...retentionPoints.map((point) => point.value)
                );

                return (
                  <div className="performance-panel">
                    <div className="performance-title">
                      <div>
                        <span className="eyebrow">SELECTED VIDEO</span>
                        <h3>{selectedVideo.title || "Untitled video"}</h3>
                      </div>
                      {selectedVideo.youtube_video_id && (
                        <a
                          className="youtube-link"
                          href={`https://www.youtube.com/watch?v=${selectedVideo.youtube_video_id}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View on YouTube ↗
                        </a>
                      )}
                    </div>

                    <div className="metric-grid">
                      <div className="metric-tile">
                        <strong>
                          {formatNumber(Number(selectedVideo.views || 0))}
                        </strong>
                        <span>Views</span>
                      </div>
                      <div className="metric-tile">
                        <strong>{formatDuration(avgDuration)}</strong>
                        <span>Avg. View Duration</span>
                      </div>
                      <div className="metric-tile">
                        <strong>
                          {avgPercentage === null
                            ? "—"
                            : `${avgPercentage.toFixed(1)}%`}
                        </strong>
                        <span>Avg. View Percentage</span>
                      </div>
                      <div className="metric-tile">
                        <strong>
                          {watchMinutes === null
                            ? "—"
                            : `${formatNumber(watchMinutes)} min`}
                        </strong>
                        <span>Watch Time</span>
                      </div>
                      <div className="metric-tile">
                        <strong>{formatNumber(likes)}</strong>
                        <span>Likes</span>
                      </div>
                      <div className="metric-tile">
                        <strong>{formatNumber(comments)}</strong>
                        <span>Comments</span>
                      </div>
                      <div className="metric-tile">
                        <strong>{formatNumber(shares)}</strong>
                        <span>Shares</span>
                      </div>
                      <div className="metric-tile">
                        <strong>{formatNumber(subscribersGained)}</strong>
                        <span>Subscribers Gained</span>
                      </div>
                    </div>

                    <div className="retention-block">
                      <div className="retention-heading">
                        <h4>Audience Retention Curve</h4>
                        <span>
                          {retentionPoints.length
                            ? `${retentionPoints.length} data points`
                            : "No curve available"}
                        </span>
                      </div>

                      {retentionPoints.length ? (
                        <div
                          className="retention-chart"
                          role="img"
                          aria-label="Audience retention curve"
                        >
                          {retentionPoints.map((point, index) => (
                            <div
                              className="retention-column"
                              key={`${point.label}-${index}`}
                            >
                              <div className="retention-bar-wrap">
                                <div
                                  className="retention-bar"
                                  style={{
                                    height: `${Math.max(
                                      3,
                                      (point.value / maxRetention) * 100
                                    )}%`,
                                  }}
                                />
                              </div>
                              {index %
                                Math.max(
                                  1,
                                  Math.ceil(retentionPoints.length / 6)
                                ) ===
                                0 && (
                                <small>
                                  {typeof point.label === "number"
                                    ? `${Math.round(point.label * 100)}%`
                                    : point.label}
                                </small>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="chart-empty">
                          Retention data is not available for this video yet.
                        </p>
                      )}
                      <p className="chart-note">
                        Average View Percentage is not the same as Viewed vs.
                        Swiped Away.
                      </p>
                    </div>
                  </div>
                );
              })()}
          </>
        )}

        {databaseError && <div className="error-box">{databaseError}</div>}
        {loadingData && <p className="muted">Loading database information...</p>}

        <Section
          title="Workspace Overview"
          subtitle="Your agent's operational status"
        />

        <div className="stats">
          <div className="stat">
            <span className="stat-icon red">!</span>
            <strong>{failedJobs}</strong>
            <p>Failed Tasks</p>
          </div>
          <div className="stat">
            <span className="stat-icon green">✓</span>
            <strong>{completedJobs}</strong>
            <p>Completed Tasks</p>
          </div>
          <div className="stat">
            <span className="stat-icon blue">◷</span>
            <strong>{pendingApprovals}</strong>
            <p>Pending Approvals</p>
          </div>
          <div className="stat">
            <span className="stat-icon cyan">◉</span>
            <strong className="stat-status">
              {runningJobs > 0 ? "Running" : "Inactive"}
            </strong>
            <p>Agent Status</p>
          </div>
        </div>

        <Section title="Connected Channels" />
        {channels.length === 0 ? (
          <div className="empty">No YouTube channel connected.</div>
        ) : (
          <div className="list-card">
            {channels.map((channel) => (
              <div className="list-item" key={channel.id}>
                <div className="list-item-icon">▶</div>
                <div className="list-item-copy">
                  <strong>{channel.channel_name || "YouTube Channel"}</strong>
                  <p>{channel.channel_url}</p>
                </div>
                <Status value={channel.connection_status} />
              </div>
            ))}
          </div>
        )}

        <Section title="Agent Activity" />
        {jobs.length === 0 ? (
          <div className="empty">No agent activity yet.</div>
        ) : (
          <div className="list-card">
            {jobs.map((job) => (
              <div className="list-item" key={job.id}>
                <div className="list-item-icon">⚙</div>
                <div className="list-item-copy">
                  <strong>{job.task_type}</strong>
                  <p>{job.error_message || "Agent task"}</p>
                </div>
                <Status value={job.status} />
              </div>
            ))}
          </div>
        )}

        <Section title="Recent Reports" />
        {reports.length === 0 ? (
          <div className="empty">No reports available.</div>
        ) : (
          <div className="list-card">
            {reports.map((report) => (
              <div className="list-item" key={report.id}>
                <div className="list-item-icon">▤</div>
                <div className="list-item-copy">
                  <strong>{report.report_type || "Agent Report"}</strong>
                  <p>
                    {report.created_at
                      ? new Date(report.created_at).toLocaleString()
                      : ""}
                  </p>
                </div>
                <Status value="Completed" />
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  // Intelligence tab
  function renderIntelligence() {
    return (
      <>
        <div className="page-heading">
          <span className="eyebrow">AI CONTROL CENTER</span>
          <h1>Intelligence</h1>
          <p>Your channel research and analysis hub.</p>
        </div>

        <div className="intro-card">
          <span className="intro-icon">◈</span>
          <div>
            <strong>Channel Intelligence</strong>
            <p>
              Tools for understanding your content, audience and channel
              performance.
            </p>
          </div>
        </div>

        <Section title="Intelligence Modules" />
        <div className="module-grid">
          {intelligence.map(([icon, title, desc], index) => (
            <button
              className="module"
              key={title}
              onClick={() => {
                if (title === "Video Doctor") {
                  setActiveTab("Home");
                  if (videos.length > 0) handleAIAnalysis();
                } else {
                  alert(`${title}: AI service is not connected yet.`);
                }
              }}
            >
              <span className="module-icon">{icon}</span>
              <span className="module-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3>{title}</h3>
              <p>{desc}</p>
              <span className="module-footer">
                {title === "Video Doctor" ? "Available" : "Coming soon"}
                <span>↗</span>
              </span>
            </button>
          ))}
        </div>

        <Section title="Channel Protection" />
        <div className="empty">
          <span className="empty-icon">🛡️</span>
          <strong>Channel protection is not connected yet</strong>
          <p>Channel health monitoring will be available in a future update.</p>
        </div>
      </>
    );
  }

  // Production tab
  function renderProduction() {
    return (
      <>
        <div className="page-heading">
          <span className="eyebrow">CONTENT WORKFLOW</span>
          <h1>Production</h1>
          <p>From research to final publishing.</p>
        </div>

        <div className="intro-card">
          <span className="intro-icon cyan">✦</span>
          <div>
            <strong>Production Studio</strong>
            <p>
              Your planned content creation workflow, organized in one place.
            </p>
          </div>
        </div>

        <Section title="Production Studio" />
        <div className="module-grid">
          {production.map(([icon, title, desc], index) => (
            <button
              className="module"
              key={title}
              onClick={() =>
                alert(`${title}: Service is not connected yet.`)
              }
            >
              <span className="module-icon">{icon}</span>
              <span className="module-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3>{title}</h3>
              <p>{desc}</p>
              <span className="module-footer">
                Coming soon <span>↗</span>
              </span>
            </button>
          ))}
        </div>

        <Section
          title="Approval Center"
          subtitle="Review actions waiting for your approval"
        />

        {approvals.length === 0 ? (
          <div className="empty">
            <span className="empty-icon">✓</span>
            <strong>No approvals yet</strong>
            <p>Pending approval requests will appear here.</p>
          </div>
        ) : (
          <div className="list-card">
            {approvals.map((item) => (
              <div className="list-item" key={item.id}>
                <div className="list-item-icon">✦</div>
                <div className="list-item-copy">
                  <strong>{item.action_type}</strong>
                  <p>
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString()
                      : ""}
                  </p>
                </div>
                <Status value={item.status} />
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  // More tab
  function renderMore() {
    return (
      <>
        <div className="page-heading">
          <span className="eyebrow">WORKSPACE SETTINGS</span>
          <h1>More</h1>
          <p>Manage your account and preferences.</p>
        </div>

        <Section title="Account" />
        <div className="account-card">
          <div className="account-avatar">
            {(user.email || "U").charAt(0).toUpperCase()}
          </div>
          <div className="account-info">
            <strong>{user.email}</strong>
            <p>Supabase authenticated account</p>
            <Status value="Connected" />
          </div>
        </div>

        <Section title="Automation Controls" />
        <div className="list-card">
          <div className="setting">
            <div>
              <strong>Automation Preference</strong>
              <p>Allow safe background analysis.</p>
            </div>
            <button
              className={`toggle ${automation ? "active" : ""}`}
              aria-label="Toggle automation preference"
              aria-pressed={automation}
              onClick={() => setAutomation(!automation)}
            >
              <span />
            </button>
          </div>
          <div className="setting">
            <div>
              <strong>Notifications</strong>
              <p>Show task and approval alerts.</p>
            </div>
            <button
              className={`toggle ${notifications ? "active" : ""}`}
              aria-label="Toggle notifications"
              aria-pressed={notifications}
              onClick={() => setNotifications(!notifications)}
            >
              <span />
            </button>
          </div>
          <p className="settings-note">
            These are currently interface preferences only. They are not saved
            to your account or connected to background automation.
          </p>
        </div>

        <Section title="Agent Settings" />
        <div className="list-card">
          <div className="list-item">
            <strong>Target Audience</strong>
            <span>United States</span>
          </div>
          <div className="list-item">
            <strong>Content Format</strong>
            <span>YouTube Shorts · 9:16</span>
          </div>
          <div className="list-item">
            <strong>Approval Policy</strong>
            <span>Manual before publishing</span>
          </div>
        </div>

        <button className="logout" onClick={handleLogout}>
          <span>↪</span> Logout
        </button>

        <p className="version">CreatorOS · Version 1.3</p>
      </>
    );
  }

  return (
    <main className="app">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />

      <header className="topbar">
        <div className="brand">
          <div className="brand-logo">C</div>
          <div>
            <strong>CreatorOS</strong>
            <span>AI YOUTUBE WORKSPACE</span>
          </div>
        </div>

        <div className="top-user">
          <span className="online-dot" />
          <span>Workspace</span>
          <div className="top-avatar">
            {(user.email || "U").charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <div className="content">
        {activeTab === "Home" && renderHome()}
        {activeTab === "Intelligence" && renderIntelligence()}
        {activeTab === "Production" && renderProduction()}
        {activeTab === "More" && renderMore()}
      </div>

      <nav className="bottom-nav">
        {tabs.map(([name, icon]) => (
          <button
            key={name}
            className={activeTab === name ? "nav active" : "nav"}
            onClick={() => setActiveTab(name)}
          >
            <span className="nav-icon">{icon}</span>
            <span>{name}</span>
          </button>
        ))}
      </nav>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        :root {
          color-scheme: dark;
          --bg: #070b14;
          --panel: rgba(15, 27, 44, 0.66);
          --panel-strong: rgba(17, 34, 55, 0.82);
          --border: rgba(112, 165, 220, 0.16);
          --border-bright: rgba(61, 165, 255, 0.34);
          --text: #edf6ff;
          --muted: #8da2bb;
          --blue: #3298ff;
          --cyan: #25d8e8;
        }

        html {
          background: var(--bg);
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: var(--bg);
          color: var(--text);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        button {
          font: inherit;
        }

        button:focus-visible,
        a:focus-visible {
          outline: 2px solid var(--cyan);
          outline-offset: 3px;
        }

        .app {
          position: relative;
          isolation: isolate;
          min-height: 100dvh;
          overflow: hidden;
          padding-bottom: calc(94px + env(safe-area-inset-bottom));
          background:
            radial-gradient(
              ellipse at 50% -15%,
              rgba(20, 91, 158, 0.28),
              transparent 48%
            ),
            linear-gradient(180deg, #080e19 0%, #070b14 48%, #080d17 100%);
        }

        .ambient {
          position: fixed;
          z-index: -1;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
          opacity: 0.14;
        }

        .ambient-a {
          top: 18%;
          left: -220px;
          background: #087dff;
        }

        .ambient-b {
          top: 58%;
          right: -240px;
          background: #00d9e8;
          opacity: 0.09;
        }

        .loading {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 16px;
          color: #a9bfd8;
          background:
            radial-gradient(ellipse at 50% 35%, #12345b 0%, transparent 50%),
            #070b14;
        }

        .logo,
        .brand-logo {
          display: grid;
          place-items: center;
          color: white;
          font-weight: 900;
          background: linear-gradient(135deg, #168cff, #13d4e8);
          box-shadow: 0 0 28px rgba(22, 140, 255, 0.32);
        }

        .logo {
          width: 58px;
          height: 58px;
          border-radius: 17px;
          font-size: 27px;
        }

        .spinner {
          width: 23px;
          height: 23px;
          border: 2px solid rgba(82, 144, 201, 0.22);
          border-top-color: var(--cyan);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          flex-shrink: 0;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .topbar {
          height: 68px;
          padding: 0 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(113, 164, 218, 0.13);
          background: rgba(7, 13, 23, 0.76);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          position: sticky;
          top: 0;
          z-index: 30;
        }

        .brand,
        .top-user {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .brand-logo {
          width: 38px;
          height: 38px;
          border-radius: 13px;
          font-size: 20px;
        }

        .brand strong {
          display: block;
          font-size: 14px;
          letter-spacing: 0.2px;
        }

        .brand span {
          display: block;
          color: #748ba7;
          font-size: 8px;
          letter-spacing: 1.35px;
          margin-top: 4px;
        }

        .top-user {
          color: #9aadc4;
          font-size: 10px;
        }

        .online-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #45dfaa;
          box-shadow: 0 0 10px rgba(69, 223, 170, 0.7);
        }

        .top-avatar {
          width: 29px;
          height: 29px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(77, 169, 255, 0.3);
          border-radius: 50%;
          color: #b9e1ff;
          background: rgba(35, 115, 190, 0.2);
          font-size: 11px;
          font-weight: 700;
        }

        .content {
          position: relative;
          max-width: 820px;
          margin: 0 auto;
          padding: 26px 18px 35px;
        }

        .welcome {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 23px;
        }

        .eyebrow {
          color: #52b5ff;
          font-size: 9px;
          letter-spacing: 1.7px;
          font-weight: 800;
        }

        .welcome h1 {
          font-size: 31px;
          letter-spacing: -1.2px;
          margin: 7px 0 5px;
        }

        .welcome h1 span {
          color: #42a9ff;
          text-shadow: 0 0 22px rgba(42, 155, 255, 0.4);
        }

        .welcome p,
        .page-heading p {
          margin: 0;
          color: var(--muted);
          font-size: 12px;
          line-height: 1.7;
        }

        .avatar {
          width: 45px;
          height: 45px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(65, 172, 255, 0.35);
          border-radius: 15px;
          color: #c5e9ff;
          font-weight: 800;
          background: linear-gradient(
            145deg,
            rgba(42, 145, 232, 0.27),
            rgba(22, 213, 228, 0.12)
          );
          box-shadow: 0 0 25px rgba(30, 137, 255, 0.12);
        }

        .hero {
          position: relative;
          overflow: hidden;
          isolation: isolate;
          min-height: 220px;
          display: flex;
          align-items: center;
          padding: 26px 23px;
          margin-bottom: 18px;
          border: 1px solid rgba(67, 163, 255, 0.32);
          border-radius: 21px;
          background:
            linear-gradient(
              115deg,
              rgba(18, 52, 88, 0.91),
              rgba(12, 28, 49, 0.78) 58%,
              rgba(11, 39, 58, 0.8)
            );
          box-shadow:
            0 18px 55px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.07),
            0 0 35px rgba(22, 128, 255, 0.08);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 490px;
        }

        .hero h2 {
          max-width: 440px;
          font-size: clamp(19px, 4vw, 25px);
          line-height: 1.35;
          letter-spacing: -0.5px;
          margin: 13px 0 8px;
        }

        .hero p {
          max-width: 440px;
          color: #aec4dc;
          font-size: 11px;
          line-height: 1.75;
          margin: 0 0 18px;
        }

        .hero-orb {
          position: absolute;
          z-index: -1;
          border-radius: 50%;
          filter: blur(2px);
          pointer-events: none;
        }

        .orb-one {
          width: 210px;
          height: 210px;
          top: -100px;
          right: -25px;
          border: 1px solid rgba(79, 180, 255, 0.22);
          box-shadow:
            0 0 50px rgba(39, 150, 255, 0.16),
            inset 0 0 45px rgba(39, 150, 255, 0.1);
        }

        .orb-two {
          width: 145px;
          height: 145px;
          right: 25px;
          bottom: -105px;
          background: rgba(0, 205, 225, 0.13);
          filter: blur(35px);
        }

        .hero-decoration {
          position: absolute;
          right: 27px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(106, 190, 255, 0.08);
          font-size: 170px;
          font-weight: 900;
          line-height: 1;
          pointer-events: none;
        }

        .primary,
        .sync-button {
          position: relative;
          z-index: 2;
          border: 1px solid rgba(124, 203, 255, 0.26);
          border-radius: 10px;
          padding: 11px 15px;
          color: white;
          background: linear-gradient(110deg, #2186ed, #1766c7);
          box-shadow: 0 5px 20px rgba(20, 120, 240, 0.2);
          font-size: 11px;
          font-weight: 750;
          cursor: pointer;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            filter 0.2s ease;
        }

        .primary {
          display: inline-flex;
          align-items: center;
          gap: 13px;
          padding: 12px 16px;
        }

        .primary span {
          font-size: 16px;
        }

        .primary:hover,
        .sync-button:hover {
          transform: translateY(-1px);
          filter: brightness(1.12);
          box-shadow: 0 7px 25px rgba(20, 140, 255, 0.3);
        }

        .primary:disabled,
        .sync-button:disabled {
          opacity: 0.55;
          cursor: wait;
          transform: none;
        }

        .success-box,
        .error-box {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 11px;
          line-height: 1.6;
          margin: 13px 0;
          overflow-wrap: anywhere;
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
        }

        .success-box {
          color: #7ce8b7;
          background: rgba(15, 76, 53, 0.25);
          border: 1px solid rgba(62, 211, 147, 0.25);
        }

        .error-box {
          color: #ff9ca9;
          background: rgba(91, 27, 42, 0.3);
          border: 1px solid rgba(255, 111, 137, 0.25);
        }

        .sync-card,
        .performance-panel,
        .stat,
        .list-card,
        .empty,
        .module,
        .intro-card,
        .account-card {
          border: 1px solid var(--border);
          background: var(--panel);
          box-shadow:
            0 12px 32px rgba(0, 0, 0, 0.13),
            inset 0 1px 0 rgba(255, 255, 255, 0.035);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        .sync-card {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 13px;
          padding: 16px;
          margin: 15px 0;
          border-radius: 16px;
          transition: border-color 0.2s ease;
        }

        .sync-card:hover {
          border-color: rgba(70, 164, 255, 0.3);
        }

        .sync-icon {
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(57, 157, 255, 0.25);
          border-radius: 12px;
          color: #79c5ff;
          background: rgba(40, 130, 230, 0.13);
          font-size: 20px;
        }

        .sync-icon.cyan {
          color: #62e4ed;
          border-color: rgba(37, 216, 232, 0.24);
          background: rgba(37, 216, 232, 0.1);
        }

        .sync-icon.purple {
          color: #c0a5ff;
          border-color: rgba(161, 122, 255, 0.25);
          background: rgba(134, 91, 220, 0.12);
        }

        .sync-copy {
          min-width: 0;
        }

        .sync-card h3 {
          font-size: 12px;
          margin: 0;
        }

        .sync-card p {
          color: #91a8c2;
          font-size: 10px;
          line-height: 1.6;
          margin: 5px 0 0;
        }

        .sync-button {
          white-space: nowrap;
          padding: 10px 13px;
        }

        .cyan-button {
          background: linear-gradient(110deg, #087f9e, #0873c8);
          box-shadow: 0 5px 20px rgba(0, 194, 221, 0.12);
        }

        .ai-launch-card {
          border-color: rgba(136, 126, 255, 0.24);
          background: linear-gradient(
            120deg,
            rgba(42, 45, 90, 0.3),
            rgba(15, 28, 49, 0.76)
          );
        }

        .ai-button {
          background: linear-gradient(110deg, #347fe9, #7458dc);
        }

        .sync-result {
          grid-column: 2 / -1;
          color: #77e4b5;
          font-size: 10px;
          line-height: 1.5;
        }

        .ai-loading {
          grid-column: 2 / -1;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #91caff;
          font-size: 10px;
          line-height: 1.5;
        }

        .ai-loading .spinner {
          width: 17px;
          height: 17px;
        }

        .section-heading {
          display: flex;
          align-items: center;
          gap: 15px;
          margin: 29px 0 14px;
        }

        .section-heading h2 {
          font-size: 14px;
          letter-spacing: -0.2px;
          margin: 0;
        }

        .section-heading p {
          color: #7f94ad;
          font-size: 10px;
          line-height: 1.5;
          margin: 5px 0 0;
        }

        .section-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(
            90deg,
            rgba(63, 157, 255, 0.22),
            transparent
          );
        }

        .ai-report {
          margin-top: 18px;
          padding: 17px;
        }

        .report-overview {
          color: #c0d2e6;
          font-size: 11px;
          line-height: 1.8;
          margin: 14px 0;
        }

        .report-card {
          padding: 14px;
          margin: 10px 0;
          border: 1px solid rgba(107, 160, 213, 0.14);
          border-radius: 12px;
          background: rgba(6, 16, 29, 0.55);
        }

        .report-card h4 {
          font-size: 12px;
          line-height: 1.5;
          margin: 0 0 9px;
        }

        .report-card p,
        .report-card strong {
          font-size: 10px;
          line-height: 1.75;
        }

        .report-card p {
          color: #a0b4ca;
          margin: 5px 0;
          overflow-wrap: anywhere;
        }

        .report-card strong {
          display: block;
          color: #69c5ff;
          margin-top: 10px;
        }

        .report-item {
          padding: 11px 12px;
          margin: 7px 0;
          border: 1px solid rgba(103, 160, 215, 0.1);
          border-radius: 9px;
          background: rgba(10, 24, 40, 0.7);
          color: #b9cadd;
          font-size: 10px;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        .report-muted {
          color: #8298b1;
          font-size: 10px;
        }

        .strategy-item {
          padding-bottom: 10px;
          margin-bottom: 10px;
          border-bottom: 1px solid rgba(112, 165, 220, 0.13);
        }

        .strategy-item:last-child {
          border-bottom: 0;
          margin-bottom: 0;
        }

        .report-refresh {
          margin-top: 12px;
        }

        .video-list {
          overflow: hidden;
          border: 1px solid var(--border);
          border-radius: 15px;
          background: rgba(12, 23, 38, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .video-row {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 14px;
          border: 0;
          border-bottom: 1px solid rgba(112, 165, 220, 0.11);
          background: transparent;
          color: var(--text);
          text-align: left;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .video-row:last-child {
          border-bottom: 0;
        }

        .video-row:hover,
        .video-row.selected {
          background: rgba(36, 118, 192, 0.15);
        }

        .video-row.selected {
          box-shadow: inset 3px 0 0 #37b6ff;
        }

        .video-thumb {
          width: 38px;
          height: 38px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border: 1px solid rgba(71, 168, 255, 0.2);
          border-radius: 10px;
          color: #79c9ff;
          background: rgba(37, 128, 220, 0.13);
          font-size: 13px;
        }

        .video-row-main {
          min-width: 0;
          flex: 1;
          display: grid;
          gap: 5px;
        }

        .video-row strong {
          font-size: 10px;
          line-height: 1.5;
        }

        .video-row small {
          color: #839bb5;
          font-size: 9px;
        }

        .video-row-arrow {
          color: #62bcff;
          font-size: 22px;
        }

        .performance-panel {
          margin-top: 13px;
          padding: 17px;
          border-color: rgba(57, 151, 237, 0.24);
          border-radius: 17px;
          background: linear-gradient(
            145deg,
            rgba(18, 42, 68, 0.76),
            rgba(10, 21, 36, 0.78)
          );
        }

        .performance-title {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }

        .performance-title h3 {
          font-size: 13px;
          line-height: 1.6;
          margin: 7px 0 0;
          overflow-wrap: anywhere;
        }

        .youtube-link {
          color: #79c5ff;
          font-size: 10px;
          text-decoration: none;
          white-space: nowrap;
        }

        .youtube-link:hover {
          color: #b1e5ff;
        }

        .metric-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 9px;
          margin-top: 16px;
        }

        .metric-tile {
          min-width: 0;
          padding: 13px;
          border: 1px solid rgba(115, 167, 218, 0.13);
          border-radius: 11px;
          background: rgba(6, 17, 31, 0.58);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.025);
        }

        .metric-tile strong {
          display: block;
          font-size: 16px;
          letter-spacing: -0.3px;
          overflow-wrap: anywhere;
        }

        .metric-tile span {
          display: block;
          color: #879db7;
          font-size: 9px;
          margin-top: 6px;
        }

        .retention-block {
          margin-top: 21px;
          padding-top: 16px;
          border-top: 1px solid rgba(112, 165, 220, 0.13);
        }

        .retention-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .retention-heading h4 {
          margin: 0;
          font-size: 11px;
        }

        .retention-heading span {
          color: #849bb5;
          font-size: 8px;
        }

        .retention-chart {
          height: 145px;
          display: flex;
          align-items: stretch;
          gap: 3px;
          padding: 12px 3px 0;
          border-bottom: 1px solid rgba(112, 165, 220, 0.2);
        }

        .retention-column {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: center;
        }

        .retention-bar-wrap {
          height: 112px;
          width: 100%;
          display: flex;
          align-items: flex-end;
        }

        .retention-bar {
          width: 100%;
          min-height: 3px;
          border-radius: 4px 4px 0 0;
          background: linear-gradient(180deg, #47d8ed, #2586f0 75%, #2163bd);
          box-shadow: 0 0 12px rgba(48, 169, 255, 0.2);
        }

        .retention-column small {
          height: 13px;
          margin-top: 4px;
          color: #8198b3;
          font-size: 7px;
          white-space: nowrap;
        }

        .chart-empty,
        .chart-note {
          color: #8ba0b9;
          font-size: 9px;
          line-height: 1.6;
        }

        .chart-note {
          margin: 10px 0 0;
          color: #d4b77d;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .stat {
          position: relative;
          min-height: 112px;
          padding: 15px;
          border-radius: 14px;
        }

        .stat strong {
          display: block;
          margin-top: 10px;
          font-size: 23px;
          letter-spacing: -0.6px;
        }

        .stat strong.stat-status {
          font-size: 16px;
          margin-top: 14px;
        }

        .stat p {
          color: #849ab4;
          font-size: 10px;
          margin: 6px 0 0;
        }

        .stat-icon {
          width: 26px;
          height: 26px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 800;
        }

        .stat-icon.red {
          color: #ff9ca8;
          background: rgba(255, 90, 115, 0.13);
        }

        .stat-icon.green {
          color: #6de1ad;
          background: rgba(54, 207, 139, 0.13);
        }

        .stat-icon.blue {
          color: #83c8ff;
          background: rgba(48, 148, 255, 0.14);
        }

        .stat-icon.cyan {
          color: #67e3eb;
          background: rgba(36, 214, 226, 0.12);
        }

        .list-card {
          padding: 0 14px;
          border-radius: 14px;
        }

        .list-item {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 14px 0;
          border-bottom: 1px solid rgba(112, 165, 220, 0.12);
        }

        .list-item:last-child {
          border-bottom: 0;
        }

        .list-item-icon {
          width: 32px;
          height: 32px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 10px;
          color: #7fcaff;
          background: rgba(39, 129, 219, 0.13);
          font-size: 13px;
        }

        .list-item-copy {
          min-width: 0;
          flex: 1;
        }

        .list-item strong {
          display: block;
          font-size: 11px;
          overflow-wrap: anywhere;
        }

        .list-item p {
          color: #879db6;
          font-size: 9px;
          line-height: 1.5;
          margin: 5px 0 0;
          overflow-wrap: anywhere;
        }

        .list-item > span:not(.status) {
          color: #a9bdd2;
          font-size: 10px;
          text-align: right;
        }

        .status {
          display: inline-block;
          flex-shrink: 0;
          white-space: nowrap;
          border: 1px solid transparent;
          border-radius: 30px;
          padding: 5px 9px;
          font-size: 8px;
          font-weight: 750;
          background: rgba(117, 137, 162, 0.12);
          color: #a5b6c9;
        }

        .status.success {
          border-color: rgba(72, 218, 157, 0.17);
          background: rgba(31, 148, 99, 0.13);
          color: #6ce1ad;
        }

        .status.running {
          border-color: rgba(71, 165, 255, 0.18);
          background: rgba(35, 128, 220, 0.14);
          color: #82c7ff;
        }

        .status.waiting {
          border-color: rgba(154, 166, 184, 0.12);
          background: rgba(129, 145, 166, 0.1);
          color: #aab7c8;
        }

        .status.danger {
          border-color: rgba(255, 117, 139, 0.17);
          background: rgba(184, 52, 78, 0.14);
          color: #ff9aa9;
        }

        .empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 24px 17px;
          border-radius: 14px;
          color: #91a5bd;
          font-size: 11px;
          text-align: center;
          line-height: 1.6;
        }

        .empty .spinner {
          margin-bottom: 5px;
        }

        .empty strong {
          color: #c6d8eb;
          font-size: 11px;
        }

        .empty p {
          margin: 0;
          color: #849ab4;
          font-size: 10px;
        }

        .empty-icon {
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          margin-bottom: 3px;
          border-radius: 12px;
          color: #7fcaff;
          background: rgba(42, 135, 220, 0.12);
          font-size: 18px;
        }

        .muted {
          color: #80c5ff;
          font-size: 11px;
        }

        .page-heading {
          margin: 5px 0 23px;
        }

        .page-heading h1 {
          font-size: 29px;
          letter-spacing: -0.8px;
          margin: 8px 0 6px;
        }

        .intro-card {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 15px;
          border-radius: 14px;
        }

        .intro-icon {
          width: 39px;
          height: 39px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border: 1px solid rgba(66, 164, 255, 0.22);
          border-radius: 12px;
          color: #8bcfff;
          background: rgba(42, 130, 220, 0.12);
          font-size: 19px;
        }

        .intro-icon.cyan {
          color: #6be3eb;
          border-color: rgba(37, 216, 232, 0.2);
          background: rgba(37, 216, 232, 0.1);
        }

        .intro-card strong {
          font-size: 11px;
        }

        .intro-card p {
          color: #8da3bc;
          font-size: 10px;
          line-height: 1.6;
          margin: 5px 0 0;
        }

        .module-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 11px;
        }

        .module {
          position: relative;
          min-width: 0;
          min-height: 166px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
          padding: 14px;
          border-radius: 14px;
          color: var(--text);
          cursor: pointer;
          overflow: hidden;
          transition:
            transform 0.2s ease,
            border-color 0.2s ease,
            background 0.2s ease;
        }

        .module:hover {
          transform: translateY(-2px);
          border-color: rgba(63, 169, 255, 0.36);
          background: rgba(20, 44, 70, 0.8);
        }

        .module-icon {
          width: 37px;
          height: 37px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(76, 164, 255, 0.18);
          border-radius: 11px;
          background: rgba(40, 126, 211, 0.13);
          font-size: 19px;
        }

        .module-number {
          position: absolute;
          top: 17px;
          right: 14px;
          color: rgba(139, 175, 212, 0.32);
          font-size: 9px;
          letter-spacing: 1px;
        }

        .module h3 {
          font-size: 11px;
          margin: 12px 0 5px;
        }

        .module p {
          color: #8ca1b9;
          font-size: 9px;
          line-height: 1.55;
          margin: 0 0 12px;
        }

        .module-footer {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
          padding-top: 9px;
          border-top: 1px solid rgba(112, 165, 220, 0.11);
          color: #6e9ec8;
          font-size: 8px;
        }

        .module-footer span {
          font-size: 13px;
        }

        .account-card {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 16px;
          border-radius: 14px;
        }

        .account-avatar {
          width: 43px;
          height: 43px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border: 1px solid rgba(66, 164, 255, 0.28);
          border-radius: 14px;
          color: #c2e8ff;
          background: rgba(40, 126, 211, 0.17);
          font-size: 17px;
          font-weight: 800;
        }

        .account-info {
          min-width: 0;
          flex: 1;
        }

        .account-info strong {
          display: block;
          font-size: 11px;
          overflow-wrap: anywhere;
        }

        .account-info p {
          color: #839ab4;
          font-size: 9px;
          margin: 5px 0 8px;
        }

        .setting {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 15px 0;
          border-bottom: 1px solid rgba(112, 165, 220, 0.12);
        }

        .setting:last-of-type {
          border-bottom: 0;
        }

        .setting strong {
          font-size: 11px;
        }

        .setting p {
          color: #879db6;
          font-size: 9px;
          line-height: 1.5;
          margin: 5px 0 0;
        }

        .settings-note {
          margin: 0 -1px;
          padding: 10px 0 13px;
          color: #8297b0;
          font-size: 9px;
          line-height: 1.6;
        }

        .toggle {
          width: 43px;
          height: 25px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          padding: 3px;
          border: 1px solid rgba(150, 170, 195, 0.15);
          border-radius: 30px;
          background: #263449;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .toggle span {
          width: 17px;
          height: 17px;
          border-radius: 50%;
          background: #aab9ca;
          transition:
            transform 0.2s ease,
            background 0.2s ease;
        }

        .toggle.active {
          background: #147bc5;
          border-color: rgba(63, 178, 255, 0.35);
          box-shadow: 0 0 13px rgba(35, 146, 255, 0.2);
        }

        .toggle.active span {
          transform: translateX(17px);
          background: white;
        }

        .logout {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          margin-top: 25px;
          padding: 13px;
          border: 1px solid rgba(255, 105, 130, 0.23);
          border-radius: 12px;
          color: #ff9baa;
          background: rgba(106, 30, 48, 0.2);
          font-size: 11px;
          font-weight: 750;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .logout:hover {
          background: rgba(140, 37, 58, 0.3);
        }

        .version {
          color: #596e86;
          text-align: center;
          font-size: 9px;
          margin-top: 18px;
        }

        .bottom-nav {
          position: fixed;
          z-index: 40;
          left: 0;
          right: 0;
          bottom: 0;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          padding: 9px 8px calc(9px + env(safe-area-inset-bottom));
          border-top: 1px solid rgba(113, 164, 218, 0.17);
          background: rgba(7, 13, 23, 0.82);
          box-shadow: 0 -10px 35px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }

        .nav {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          border: 0;
          border-radius: 11px;
          background: transparent;
          color: #788ca5;
          font-size: 9px;
          padding: 6px 0;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .nav-icon {
          font-size: 20px;
          line-height: 1.1;
        }

        .nav.active {
          color: #70c7ff;
          background: linear-gradient(
            180deg,
            rgba(41, 135, 220, 0.14),
            rgba(41, 135, 220, 0.025)
          );
          text-shadow: 0 0 13px rgba(55, 170, 255, 0.35);
        }

        .nav.active::before {
          content: "";
          position: absolute;
          top: -9px;
          left: 30%;
          right: 30%;
          height: 2px;
          border-radius: 5px;
          background: linear-gradient(90deg, #318dff, #32e0e8);
          box-shadow: 0 0 12px rgba(43, 178, 255, 0.7);
        }

        @media (min-width: 600px) {
          .content {
            padding: 32px 24px 45px;
          }

          .stats {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }

          .module-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .metric-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }

          .hero {
            min-height: 235px;
            padding: 32px;
          }
        }

        @media (max-width: 430px) {
          .content {
            padding-left: 14px;
            padding-right: 14px;
          }

          .topbar {
            padding: 0 14px;
          }

          .top-user > span:not(.online-dot) {
            display: none;
          }

          .sync-card {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .sync-card > .sync-button {
            grid-column: 2;
            justify-self: start;
          }

          .sync-result,
          .ai-loading {
            grid-column: 1 / -1;
          }

          .hero {
            padding: 22px 18px;
          }

          .hero-decoration {
            right: -12px;
            font-size: 135px;
          }

          .module {
            min-height: 172px;
            padding: 12px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            scroll-behavior: auto !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
}
