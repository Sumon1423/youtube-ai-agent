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
  if (["connected", "completed", "approved"].includes(status)) {
    className = "success";
  }
  if (["running", "processing"].includes(status)) {
    className = "running";
  }
  if (["failed", "rejected"].includes(status)) {
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

  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");
  const [syncResult, setSyncResult] = useState(null);
  const [analyticsResult, setAnalyticsResult] = useState(null);

  const [channels, setChannels] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [reports, setReports] = useState([]);

  const [loadingData, setLoadingData] = useState(false);
  const [databaseError, setDatabaseError] = useState("");

  const [automation, setAutomation] = useState(true);
  const [notifications, setNotifications] = useState(true);

  // Check OAuth result
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

    setChannels(results[0].data || []);
    setJobs(results[1].data || []);
    setApprovals(results[2].data || []);
    setReports(results[3].data || []);

    const errors = results
      .filter((result) => result.error)
      .map((result) => result.error.message);

    if (errors.length) {
      setDatabaseError(errors.join(" | "));
    }

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
        throw new Error(result.error || `YouTube sync failed (HTTP ${response.status}).`);
      }

      setSyncResult(result);
      setNotice(
        `Sync completed. ${result.videosSynced || 0} videos saved.`
      );
      setNoticeType("success");

      await loadDashboardData(user.id);
    } catch (error) {
      setNotice(error.message || "YouTube sync failed.");
      setNoticeType("error");
    } finally {
      setSyncing(false);
    }
  }

  // Sync YouTube Analytics and audience-retention data
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
          result.error || `Analytics synchronization failed (HTTP ${response.status}).`
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

  const runningJobs = jobs.filter(
    (job) => ["running", "processing"].includes(job.status?.toLowerCase())
  ).length;

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
                      <span className="eyebrow">AI AGENT STATUS</span>
          <h2>
            {channels.length
              ? "Your YouTube channel is connected."
              : "Connect your YouTube channel."}
          </h2>
          <p>
            {channels.length
              ? "Your channel is linked to CreatorOS."
              : "Authorize CreatorOS to access your YouTube channel data."}
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
            →
          </button>
        </div>

        {notice && (
          <div className={noticeType === "error" ? "error-box" : "success-box"}>
            {notice}
          </div>
        )}

        {channels.length > 0 && (
          <div className="sync-card">
            <div>
              <h3>Sync YouTube Data</h3>
              <p>
                Import your latest videos and available statistics into CreatorOS.
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
                Found: {syncResult.videosFound} ·
                Saved: {syncResult.videosSynced} ·
                Failed: {syncResult.videosFailed}
              </div>
            )}
          </div>
        )}

        {channels.length > 0 && (
          <div className="sync-card analytics-card">
            <div>
              <h3>Personalized YouTube Analytics</h3>
              <p>
                Import available watch time, average view duration,
                engagement and audience-retention data for your videos.
              </p>
            </div>

            <button
              className="sync-button"
              onClick={handleAnalyticsSync}
              disabled={analyticsSyncing}
            >
              {analyticsSyncing ? "Analyzing..." : "Sync Analytics ↗"}
            </button>

            {analyticsResult && (
              <div className="sync-result">
                Updated: {analyticsResult.videosUpdated || 0} ·
                Retention curves: {analyticsResult.retentionCurvesSaved || 0} ·
                Missing metrics: {analyticsResult.videosWithoutMetrics || 0}
              </div>
            )}
          </div>
        )}

        {databaseError && (
          <div className="error-box">{databaseError}</div>
        )}

        {loadingData && (
          <p className="muted">Loading database information...</p>
        )}

        <Section
          title="Workspace Overview"
          subtitle="Your agent's operational status"
        />

        <div className="stats">
          <div className="stat">
            <strong>{failedJobs}</strong>
            <p>Failed Tasks</p>
          </div>
          <div className="stat">
            <strong>{completedJobs}</strong>
            <p>Completed Tasks</p>
          </div>
          <div className="stat">
            <strong>{pendingApprovals}</strong>
            <p>Pending Approvals</p>
          </div>
          <div className="stat">
            <strong>{runningJobs > 0 ? "Running" : "Inactive"}</strong>
            <p>Agent Status</p>
          </div>
        </div>

        <Section title="Connected Channels" />

        {channels.length === 0 ? (
          <div className="empty">
            No YouTube channel connected.
          </div>
        ) : (
          <div className="list-card">
            {channels.map((channel) => (
              <div className="list-item" key={channel.id}>
                <div>
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
                <div>
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
                <div>
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

  function renderIntelligence() {
    return (
      <>
        <div className="page-heading">
          <span className="eyebrow">AI CONTROL CENTER</span>
          <h1>Intelligence</h1>
          <p>Your channel research and analysis hub.</p>
        </div>

        <Section title="Intelligence Modules" />

        <div className="module-grid">
          {intelligence.map(([icon, title, desc]) => (
            <button
              className="module"
              key={title}
              onClick={() => alert(`${title}: AI service is not connected yet.`)}
            >
              <span>{icon}</span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </button>
          ))}
        </div>

        <Section title="Channel Protection" />

        <div className="empty">
          🛡️ Channel health monitoring is not connected yet.
        </div>
      </>
    );
  }

  function renderProduction() {
    return (
      <>
        <div className="page-heading">
          <span className="eyebrow">CONTENT WORKFLOW</span>
          <h1>Production</h1>
          <p>From research to final publishing.</p>
        </div>

        <Section title="Production Studio" />

        <div className="module-grid">
          {production.map(([icon, title, desc]) => (
            <button
              className="module"
              key={title}
              onClick={() => alert(`${title}: Service is not connected yet.`)}
            >
              <span>{icon}</span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </button>
          ))}
        </div>

        <Section title="Approval Center" />

        {approvals.length === 0 ? (
          <div className="empty">No approvals yet.</div>
        ) : (
          <div className="list-card">
            {approvals.map((item) => (
              <div className="list-item" key={item.id}>
                <div>
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

  function renderMore() {
    return (
      <>
        <div className="page-heading">
          <span className="eyebrow">WORKSPACE SETTINGS</span>
          <h1>More</h1>
          <p>Manage your account and preferences.</p>
        </div>

        <Section title="Account" />

        <div className="list-card account">
          <strong>{user.email}</strong>
          <p>Supabase authenticated account</p>
          <Status value="Connected" />
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
              onClick={() => setAutomation(!automation)}
            >
              ●
            </button>
          </div>

          <div className="setting">
            <div>
              <strong>Notifications</strong>
              <p>Show task and approval alerts.</p>
            </div>
            <button
              className={`toggle ${notifications ? "active" : ""}`}
              onClick={() => setNotifications(!notifications)}
            >
              ●
            </button>
          </div>
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
          Logout
        </button>

        <p className="version">CreatorOS · Version 1.2</p>
      </>
    );
  }

  return (
    <main className="app">
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
          Account
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
            <span>{icon}</span>
            {name}
          </button>
        ))}
      </nav>

      <style jsx global>{`
              * { box-sizing: border-box; }

        body {
          margin: 0;
          background: #080d15;
          color: #edf4ff;
          font-family: Arial, Helvetica, sans-serif;
        }

        button { font: inherit; }

        .app {
          min-height: 100dvh;
          padding-bottom: 90px;
          background: radial-gradient(ellipse at 50% -15%, #142b49, transparent 48%), #080d15;
        }

        .loading {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 16px;
          background: #080d15;
          color: #a9b8cc;
        }

        .logo, .brand-logo {
          display: grid;
          place-items: center;
          background: linear-gradient(145deg, #2789ef, #1555bd);
          color: white;
          font-weight: 900;
          border-radius: 13px;
        }

        .logo { width: 55px; height: 55px; font-size: 26px; }

        .spinner {
          width: 23px;
          height: 23px;
          border: 2px solid #253a56;
          border-top-color: #3198ff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .topbar {
          height: 66px;
          padding: 0 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #1b2a3d;
          background: rgba(8, 13, 21, 0.95);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .brand, .top-user {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .brand-logo { width: 37px; height: 37px; font-size: 20px; }
        .brand strong { display: block; font-size: 15px; }
        .brand span {
          display: block;
          color: #71839a;
          font-size: 8px;
          letter-spacing: 1px;
          margin-top: 3px;
        }

        .top-user { color: #8798ad; font-size: 10px; }
        .online-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #48d7a0;
        }

        .content {
          max-width: 680px;
          margin: 0 auto;
          padding: 23px 17px 30px;
        }

        .welcome {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
        }

        .eyebrow {
          color: #4ca9ff;
          font-size: 9px;
          letter-spacing: 1.7px;
          font-weight: 800;
        }

        .welcome h1 {
          font-size: 30px;
          margin: 7px 0 5px;
        }

        .welcome h1 span { color: #398ff0; }
        .welcome p, .page-heading p {
          margin: 0;
          color: #8c9bb0;
          font-size: 12px;
          line-height: 1.6;
        }

        .avatar {
          display: grid;
          place-items: center;
          width: 43px;
          height: 43px;
          border-radius: 50%;
          background: #17365b;
          color: #83c3ff;
          font-weight: 700;
        }

        .hero {
          border: 1px solid #24518a;
          border-radius: 18px;
          background: linear-gradient(120deg, #102d50, #0c1a2c);
          padding: 22px 19px;
          margin-bottom: 20px;
        }

        .hero h2 { font-size: 21px; margin: 14px 0 8px; }
        .hero p {
          color: #a7bad1;
          font-size: 11px;
          line-height: 1.6;
          margin: 0 0 15px;
        }

        .primary, .sync-button {
          border: 0;
          border-radius: 9px;
          padding: 11px 14px;
          color: white;
          background: #247ee0;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .primary:disabled, .sync-button:disabled {
          opacity: 0.55;
          cursor: wait;
        }

        .success-box, .error-box {
          border-radius: 10px;
          padding: 12px;
          font-size: 11px;
          line-height: 1.5;
          margin: 12px 0;
          overflow-wrap: anywhere;
        }

        .success-box {
          color: #70e0ad;
          background: #102b22;
          border: 1px solid #245b43;
        }

        .error-box {
          color: #ff929d;
          background: #29161d;
          border: 1px solid #713b45;
        }

        .sync-card {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 15px;
          margin: 15px 0 25px;
          border: 1px solid #24518a;
          border-radius: 13px;
          background: linear-gradient(110deg, #10243c, #0e1724);
        }

        .sync-card h3 { font-size: 12px; margin: 0; }
        .sync-card p {
          color: #8fa4bd;
          font-size: 10px;
          line-height: 1.5;
          margin: 5px 0 0;
        }

        .sync-result {
          flex-basis: 100%;
          color: #70e0ad;
          font-size: 10px;
        }

        .section-heading {
          margin: 27px 0 13px;
        }

        .section-heading h2 {
          font-size: 15px;
          margin: 0;
        }

        .section-heading p {
          color: #77899f;
          font-size: 10px;
          margin: 5px 0 0;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .stat, .list-card, .empty {
          background: #0e1724;
          border: 1px solid #1c2b3f;
          border-radius: 13px;
        }

        .stat { min-height: 94px; padding: 14px; }
        .stat strong { font-size: 22px; }
        .stat p { color: #7f90a5; font-size: 10px; margin: 7px 0 0; }

        .list-card { padding: 0 14px; }
        .list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid #1b293a;
        }

        .list-item:last-child { border-bottom: 0; }
        .list-item strong { font-size: 11px; }
        .list-item p {
          color: #8b9bb0;
          font-size: 9px;
          margin: 5px 0 0;
          overflow-wrap: anywhere;
        }

        .status {
          display: inline-block;
          white-space: nowrap;
          border-radius: 20px;
          padding: 5px 8px;
          font-size: 8px;
          font-weight: 700;
          background: #222c3a;
          color: #a5b4c8;
        }

        .status.success { background: #123629; color: #5cdaa1; }
        .status.running { background: #173658; color: #75baff; }
        .status.waiting { background: #292b32; color: #a8aab4; }
        .status.danger { background: #3a1b25; color: #ff929d; }

        .empty {
          padding: 18px;
          color: #8293a9;
          font-size: 11px;
          text-align: center;
        }

        .muted { color: #69b5ff; font-size: 11px; }

        .page-heading { margin: 5px 0 22px; }
        .page-heading h1 { font-size: 28px; margin: 7px 0; }

        .module-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .module {
          text-align: left;
          min-height: 145px;
          padding: 14px;
          border: 1px solid #1d2d42;
          border-radius: 13px;
          background: #0e1724;
          color: #edf4ff;
          cursor: pointer;
        }

        .module > span { font-size: 21px; }
        .module h3 { font-size: 11px; margin: 12px 0 6px; }
        .module p {
          color: #8495aa;
          font-size: 9px;
          line-height: 1.5;
          margin: 0;
        }

        .account { padding: 16px; }
        .account strong { font-size: 11px; overflow-wrap: anywhere; }
        .account p { color: #8395ab; font-size: 9px; }

        .setting {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid #1e2c3e;
        }

        .setting:last-child { border-bottom: 0; }
        .setting strong { font-size: 11px; }
        .setting p { color: #8596aa; font-size: 9px; margin: 5px 0 0; }

        .toggle {
          border: 0;
          border-radius: 20px;
          width: 42px;
          height: 24px;
          color: transparent;
          background: #344153;
          cursor: pointer;
        }

        .toggle.active { background: #247ee0; }

        .logout {
          width: 100%;
          margin-top: 25px;
          padding: 13px;
          border: 1px solid #713b45;
          border-radius: 11px;
          color: #ff929d;
          background: #29161d;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .version {
          color: #53657b;
          text-align: center;
          font-size: 9px;
          margin-top: 18px;
        }

        .bottom-nav {
          position: fixed;
          z-index: 20;
          left: 0;
          right: 0;
          bottom: 0;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          padding: 9px 8px calc(9px + env(safe-area-inset-bottom));
          background: rgba(10, 17, 27, 0.97);
          border-top: 1px solid #1e2d41;
        }

        .nav {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          border: 0;
          background: transparent;
          color: #71839a;
          font-size: 9px;
          padding: 4px 0;
          cursor: pointer;
        }

        .nav span { font-size: 20px; }
        .nav.active { color: #5aabff; }

        @media (min-width: 600px) {
          .content { padding-top: 30px; }
          .stats { grid-template-columns: repeat(4, 1fr); }
          .module-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
    </main>
  );
}
