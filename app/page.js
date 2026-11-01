
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const intelligence = [
  { icon: "📡", title: "Channel Monitor", desc: "Monitor channel performance and detect changes." },
  { icon: "🩺", title: "Video Doctor", desc: "Find reasons behind low-performing videos." },
  { icon: "🔎", title: "SEO Intelligence", desc: "Review titles, descriptions and keywords." },
  { icon: "📈", title: "Trend Radar", desc: "Discover trending topics for USA viewers." },
  { icon: "👥", title: "Audience Insights", desc: "Understand viewer behavior and interests." },
  { icon: "💬", title: "Comment Center", desc: "Monitor comments and prepare replies." },
  { icon: "🎯", title: "Competitor Watch", desc: "Track similar channels and content." },
  { icon: "🧠", title: "Growth Intelligence", desc: "Build strategies using channel data." },
];

const production = [
  { icon: "💡", title: "Video Ideas", desc: "AI-selected video topics and concepts." },
  { icon: "✍️", title: "Script Studio", desc: "Create and review video scripts." },
  { icon: "🖼️", title: "Asset Manager", desc: "Manage images, clips and visual assets." },
  { icon: "🎙️", title: "Voice Studio", desc: "Generate narration for your videos." },
  { icon: "🎬", title: "AI Editor", desc: "Captions, transitions, zooms and SFX." },
  { icon: "▶️", title: "Video Preview", desc: "Review the final video before publishing." },
  { icon: "🚀", title: "Publishing", desc: "Prepare and publish approved videos." },
];

const tabs = [
  { id: "Home", icon: "⌂", label: "Home" },
  { id: "Intelligence", icon: "◈", label: "Intelligence" },
  { id: "Production", icon: "▣", label: "Production" },
  { id: "More", icon: "•••", label: "More" },
];

function Status({ children }) {
  const value = String(children || "Waiting").toLowerCase();

  let type = "waiting";
  if (["completed", "approved", "connected"].includes(value)) type = "success";
  if (["running", "processing"].includes(value)) type = "running";
  if (["failed", "rejected"].includes(value)) type = "danger";

  return <span className={`status ${type}`}>{children || "Waiting"}</span>;
}

function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <span className="section-action">{action}</span>}
    </div>
  );
}

function ModuleCard({ icon, title, desc, status, onClick }) {
  return (
    <button className="module-card" onClick={onClick}>
      <div className="module-top">
        <span className="module-icon">{icon}</span>
        {status && <Status>{status}</Status>}
      </div>
      <h3>{title}</h3>
      <p>{desc}</p>
      <div className="module-arrow">Explore <span>↗</span></div>
    </button>
  );
}

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState("Home");

  const [automation, setAutomation] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const [dbJobs, setDbJobs] = useState([]);
  const [dbApprovals, setDbApprovals] = useState([]);
  const [dbReports, setDbReports] = useState([]);
  const [dbChannels, setDbChannels] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState("");

  // Authentication check
  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error || !data.session) {
        router.replace("/login");
        return;
      }

      setUser(data.session.user);
      setChecking(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
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

  // Load user's database information
  useEffect(() => {
    if (!user) return;

    let mounted = true;

    async function loadDashboardData() {
      setDbLoading(true);
      setDbError("");

      const results = await Promise.all([
        supabase
          .from("agent_jobs")
          .select("id,task_type,status,task_details,result,error_message,created_at,completed_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),

        supabase
          .from("approvals")
          .select("id,action_type,status,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),

        supabase
          .from("reports")
          .select("id,report_type,report_data,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),

        supabase
          .from("channels")
          .select("id,channel_name,channel_url,connection_status,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      if (!mounted) return;

      const errors = results
        .filter((result) => result.error)
        .map((result) => result.error.message);

      setDbJobs(results[0].data || []);
      setDbApprovals(results[1].data || []);
      setDbReports(results[2].data || []);
      setDbChannels(results[3].data || []);

      if (errors.length) {
        setDbError(errors.join(" | "));
      }

      setDbLoading(false);
    }

    loadDashboardData();

    return () => {
      mounted = false;
    };
  }, [user]);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      setLoggingOut(false);
      return;
    }

    router.replace("/login");
  }

  if (checking || !user) {
    return (
      <main className="loading-screen">
        <div className="loading-logo">C</div>
        <div className="loading-spinner" />
        <p>Checking your session...</p>
      </main>
    );
  }

  // Database statistics
  const completedJobs = dbJobs.filter(
    (job) => job.status?.toLowerCase() === "completed"
  ).length;

  const failedJobs = dbJobs.filter(
    (job) => job.status?.toLowerCase() === "failed"
  ).length;

  const pendingApprovals = dbApprovals.filter(
    (item) => item.status?.toLowerCase() === "pending"
  ).length;

  const runningJobs = dbJobs.filter(
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
          <div className="profile-icon">
            {(user.email || "U").charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="hero-card">
          <div className="hero-glow" />
          <div className="hero-content">
            <div className="agent-label">
              <span className="pulse-dot" />
              AI AGENT STATUS
            </div>
            <h2>Your agent is ready<br />for configuration.</h2>
            <p>
              Connect your YouTube channel to begin intelligent
              monitoring and automated content production.
            </p>
            <button
              className="primary-button"
              onClick={() => setActiveTab("More")}
            >
              Configure Agent <span>→</span>
            </button>
          </div>
          <div className="robot-art">🤖</div>
        </div>

        {dbError && (
          <div className="database-error">
            <strong>Database Error</strong>
            <p>{dbError}</p>
          </div>
        )}

        {dbLoading && (
          <p className="database-message">Loading database information...</p>
        )}

        <SectionTitle
          title="Workspace Overview"
          subtitle="Your agent's operational status"
        />

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">⚠️</span>
            <strong>{failedJobs}</strong>
            <p>Failed Tasks</p>
          </div>
          <div className="stat-card">
            <span className="stat-icon">✓</span>
            <strong>{completedJobs}</strong>
            <p>Completed Tasks</p>
          </div>
          <div className="stat-card">
            <span className="stat-icon">⌛</span>
            <strong>{pendingApprovals}</strong>
            <p>Pending Approvals</p>
          </div>
          <div className="stat-card">
            <span className="stat-icon">◉</span>
            <strong className="small-stat">
              {runningJobs > 0 ? "Running" : "Inactive"}
            </strong>
            <p>Agent Status</p>
          </div>
        </div>

        <SectionTitle
          title="Connected Channels"
          subtitle="Channels saved in your account"
        />

        {dbChannels.length === 0 ? (
          <div className="empty-card">
            <span>📺</span>
            <strong>No YouTube channel connected</strong>
            <p>Your channel information will appear here after connection.</p>
          </div>
        ) : (
          <div className="activity-card">
            {dbChannels.map((channel) => (
              <div className="activity-item" key={channel.id}>
                <div className="activity-icon">📺</div>
                <div className="activity-info">
                  <strong>{channel.channel_name || "YouTube Channel"}</strong>
                  <p>{channel.channel_url || "Channel URL unavailable"}</p>
                </div>
                <Status>{channel.connection_status || "Waiting"}</Status>
              </div>
            ))}
          </div>
        )}

        <SectionTitle
          title="Agent Activity"
          subtitle="Latest tasks from your database"
        />

        {dbJobs.length === 0 ? (
          <div className="empty-card">
            <span>🤖</span>
            <strong>No agent activity yet</strong>
            <p>New tasks will appear here when the agent starts working.</p>
          </div>
        ) : (
          <div className="activity-card">
            {dbJobs.map((job) => (
              <div className="activity-item" key={job.id}>
                <div className="activity-icon">⚙️</div>
                <div className="activity-info">
                  <strong>{job.task_type}</strong>
                  <p>
                    {job.error_message ||
                      job.task_details?.description ||
                      "Agent task"}
                  </p>
                  <span>
                    {job.created_at
                      ? new Date(job.created_at).toLocaleString()
                      : "Date unavailable"}
                  </span>
                </div>
                <Status>{job.status || "Waiting"}</Status>
              </div>
            ))}
          </div>
        )}

        <SectionTitle
          title="Recent Reports"
          subtitle="Reports saved by your agent"
        />

        {dbReports.length === 0 ? (
          <div className="empty-card">
            <span>📊</span>
            <strong>No reports available</strong>
            <p>Generated reports will appear here.</p>
          </div>
        ) : (
          <div className="activity-card">
            {dbReports.map((report) => (
              <div className="activity-item" key={report.id}>
                <div className="activity-icon">📄</div>
                <div className="activity-info">
                  <strong>{report.report_type || "Agent Report"}</strong>
                  <p>
                    {report.created_at
                      ? new Date(report.created_at).toLocaleString()
                      : "Date unavailable"}
                  </p>
                </div>
                <Status>Completed</Status>
              </div>
            ))}
          </div>
        )}

        <div className="notice-card">
          <span>ℹ️</span>
          <div>
            <strong>Integration status</strong>
            <p>
              Dashboard is connected to Supabase. YouTube API and AI
              automation services still need to be configured.
            </p>
          </div>
        </div>
      </>
    );
  }

  function renderIntelligence() {
    return (
      <>
        <div className="page-heading">
          <span className="eyebrow">AI CONTROL CENTER</span>
          <h1>Intelligence</h1>
          <p>Your channel's research and analysis hub.</p>
        </div>

        <div className="intelligence-banner">
          <div className="banner-icon">🧠</div>
          <div>
            <strong>AI Intelligence Center</strong>
            <p>
              Monitor, analyze and discover opportunities using your channel data.
            </p>
          </div>
        </div>

        <SectionTitle
          title="Intelligence Modules"
          subtitle="Your AI analysis tools"
        />

        <div className="module-grid">
          {intelligence.map((item) => (
            <ModuleCard
              key={item.title}
              {...item}
              onClick={() =>
                alert(`${item.title}: AI service is not connected yet.`)
              }
            />
          ))}
        </div>

        <SectionTitle
          title="Channel Protection"
          subtitle="Keep track of channel health"
        />

        <div className="protection-card">
          <div className="protection-icon">🛡️</div>
          <div>
            <strong>Channel Health Monitor</strong>
            <p>Copyright, policy and restriction checks.</p>
            <Status>Waiting</Status>
          </div>
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
          <p>From video research to final publishing.</p>
        </div>

        <div className="production-banner">
          <span className="production-banner-icon">🎬</span>
          <div>
            <strong>AI Video Production</strong>
            <p>
              Create, edit, review and prepare your next YouTube Short.
            </p>
          </div>
        </div>

        <SectionTitle
          title="Production Studio"
          subtitle="Your content creation tools"
        />

        <div className="module-grid">
          {production.map((item) => (
            <ModuleCard
              key={item.title}
              {...item}
              onClick={() =>
                alert(`${item.title}: Production service is not connected yet.`)
              }
            />
          ))}
        </div>

        <SectionTitle title="Approval Center" />

        {dbApprovals.length === 0 ? (
          <div className="empty-card">
            <span>✓</span>
            <strong>No approvals yet</strong>
            <p>Items requiring your approval will appear here.</p>
          </div>
        ) : (
          <div className="activity-card">
            {dbApprovals.map((item) => (
              <div className="activity-item" key={item.id}>
                <div className="activity-icon">📋</div>
                <div className="activity-info">
                  <strong>{item.action_type}</strong>
                  <p>
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString()
                      : "Date unavailable"}
                  </p>
                </div>
                <Status>{item.status || "Pending"}</Status>
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
          <p>Manage your account and agent preferences.</p>
        </div>

        <SectionTitle title="Account" subtitle="Your signed-in account" />

        <div className="account-card">
          <div className="account-avatar">
            {(user.email || "U").charAt(0).toUpperCase()}
          </div>
          <div className="account-info">
            <strong>{user.email}</strong>
            <p>Supabase authenticated account</p>
            <Status>Connected</Status>
          </div>
        </div>

        <SectionTitle
          title="Automation Controls"
          subtitle="Choose how your agent should operate"
        />

        <div className="settings-card">
          <div className="setting-row">
            <div>
              <strong>Automation Preference</strong>
              <p>Allow safe background analysis and research.</p>
            </div>
            <button
              className={`toggle ${automation ? "active" : ""}`}
              onClick={() => setAutomation(!automation)}
              aria-label="Toggle automation"
            >
              <span />
            </button>
          </div>

          <div className="setting-divider" />

          <div className="setting-row">
            <div>
              <strong>Notifications</strong>
              <p>Show alerts for tasks and approvals.</p>
            </div>
            <button
              className={`toggle ${notifications ? "active" : ""}`}
              onClick={() => setNotifications(!notifications)}
              aria-label="Toggle notifications"
            >
              <span />
            </button>
          </div>
        </div>

        <SectionTitle title="Agent Settings" />

        <div className="settings-card">
          <div className="simple-setting">
            <span>🌎</span>
            <div>
              <strong>Target Audience</strong>
              <p>United States (USA)</p>
            </div>
          </div>
          <div className="setting-divider" />
          <div className="simple-setting">
            <span>📱</span>
            <div>
              <strong>Content Format</strong>
              <p>YouTube Shorts · Vertical 9:16</p>
            </div>
          </div>
          <div className="setting-divider" />
          <div className="simple-setting">
            <span>🔒</span>
            <div>
              <strong>Approval Policy</strong>
              <p>Manual approval before publishing</p>
            </div>
          </div>
        </div>

        <SectionTitle title="Database Connection" />

        <div className="settings-card database-status">
          <div className="setting-row">
            <div>
              <strong>Supabase Database</strong>
              <p>{dbLoading ? "Loading..." : dbError ? "Connection issue" : "Queries completed"}</p>
            </div>
            <Status>{dbError ? "Failed" : dbLoading ? "Running" : "Connected"}</Status>
          </div>
          {dbError && <p className="database-error">{dbError}</p>}
        </div>

        <button
          className="logout-button"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? "Logging out..." : "↪  Logout"}
        </button>

        <p className="version-text">CreatorOS · Version 1.1</p>
      </>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">C</div>
          <div>
            <strong>CreatorOS</strong>
            <span>AI YOUTUBE WORKSPACE</span>
          </div>
        </div>

        <div className="topbar-right">
          <span className="connection-dot" />
          <span className="connection-text">Account</span>
          <div className="top-avatar">
            {(user.email || "U").charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <div className="main-content">
        {activeTab === "Home" && renderHome()}
        {activeTab === "Intelligence" && renderIntelligence()}
        {activeTab === "Production" && renderProduction()}
        {activeTab === "More" && renderMore()}
      </div>

      <nav className="bottom-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? "selected" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span>{tab.label}</span>
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

        .app-shell {
          min-height: 100dvh;
          background: radial-gradient(ellipse at 50% -15%, #142b49 0%, transparent 48%), #080d15;
          padding-bottom: 100px;
        }

        .loading-screen {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 18px;
          background: #080d15;
          color: #a9b8cc;
        }

        .loading-logo, .brand-mark {
          display: grid;
          place-items: center;
          background: linear-gradient(145deg, #2789ef, #1555bd);
          color: white;
          font-weight: 900;
          border-radius: 14px;
        }

        .loading-logo { width: 58px; height: 58px; font-size: 28px; }

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #253a56;
          border-top-color: #3198ff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .topbar {
          height: 68px;
          padding: 0 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #1b2a3d;
          background: rgba(8, 13, 21, 0.92);
          position: sticky;
          top: 0;
          z-index: 10;
          backdrop-filter: blur(15px);
        }

        .brand, .topbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .brand-mark { width: 38px; height: 38px; font-size: 21px; }
        .brand strong { display: block; font-size: 15px; }
        .brand span {
          display: block;
          color: #71839a;
          font-size: 8px;
          letter-spacing: 1.1px;
          margin-top: 3px;
        }

        .connection-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #48d7a0;
          display: inline-block;
        }

        .connection-text { color: #8798ad; font-size: 11px; }

        .top-avatar, .profile-icon, .account-avatar {
          display: grid;
          place-items: center;
          background: #17365b;
          color: #83c3ff;
          border: 1px solid #28517d;
          font-weight: 700;
          border-radius: 50%;
        }

        .top-avatar { width: 32px; height: 32px; font-size: 13px; }

        .main-content {
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
          letter-spacing: 1.8px;
          font-weight: 800;
        }

        .welcome h1 {
          font-size: 30px;
          margin: 7px 0 5px;
          letter-spacing: -1px;
        }

        .welcome h1 span { color: #398ff0; }

        .welcome p, .page-heading p {
          margin: 0;
          color: #8c9bb0;
          font-size: 12px;
          line-height: 1.6;
        }

        .profile-icon { width: 43px; height: 43px; font-size: 18px; }

        .hero-card {
          position: relative;
          overflow: hidden;
          border: 1px solid #24518a;
          border-radius: 19px;
          background: linear-gradient(120deg, #102d50, #0c1a2c 72%);
          min-height: 218px;
          padding: 22px 19px;
          margin-bottom: 29px;
        }

        .hero-glow {
          position: absolute;
          width: 170px;
          height: 170px;
          right: -70px;
          top: -65px;
          border-radius: 50%;
          background: #1479e7;
          filter: blur(75px);
          opacity: 0.3;
        }

        .hero-content { position: relative; z-index: 1; max-width: 78%; }

        .agent-label {
          color: #80c2ff;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.3px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #48d7a0;
          box-shadow: 0 0 10px #48d7a0;
        }

        .hero-card h2 { font-size: 21px; line-height: 1.3; margin: 15px 0 8px; }
        .hero-card p { color: #a7bad1; font-size: 11px; line-height: 1.65; margin: 0 0 15px; }

        .robot-art {
          position: absolute;
          right: 10px;
          bottom: 24px;
          font-size: 62px;
          opacity: 0.75;
          filter: drop-shadow(0 0 20px #288df0);
        }

        .primary-button {
          border: 0;
          border-radius: 9px;
          padding: 10px 13px;
          color: white;
          background: #247ee0;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .primary-button span { margin-left: 12px; }

        .section-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 26px 0 13px;
        }

        .section-title h2 { font-size: 15px; margin: 0; }
        .section-title p { color: #77899f; font-size: 10px; margin: 5px 0 0; }
        .section-action { color: #58aaff; font-size: 10px; }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .stat-card, .activity-card, .settings-card,
        .account-card, .protection-card, .approval-card,
        .empty-card {
          background: #0e1724;
          border: 1px solid #1c2b3f;
          border-radius: 13px;
        }

        .stat-card { min-height: 104px; padding: 13px; }
        .stat-icon { display: block; font-size: 15px; margin-bottom: 7px; }
        .stat-card strong { display: block; font-size: 22px; }
        .stat-card .small-stat { font-size: 15px; margin-top: 5px; }
        .stat-card p { color: #7f90a5; font-size: 10px; margin: 5px 0 0; }

        .activity-card { padding: 0 13px; }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 0;
          border-bottom: 1px solid #1b293a;
        }

        .activity-item:last-child { border-bottom: 0; }

        .activity-icon, .module-icon {
          display: grid;
          place-items: center;
          background: #14243a;
          border: 1px solid #263d5a;
          border-radius: 10px;
          flex-shrink: 0;
        }

        .activity-icon { width: 35px; height: 35px; font-size: 15px; }
        .activity-info { flex: 1; min-width: 0; }
        .activity-info strong { font-size: 11px; }
        .activity-info p {
          color: #8b9bb0;
          font-size: 9px;
          margin: 4px 0;
          overflow-wrap: anywhere;
        }
        .activity-info > span { color: #61758e; font-size: 8px; }

        .status {
          display: inline-block;
          white-space: nowrap;
          border-radius: 20px;
          padding: 5px 7px;
          font-size: 8px;
          font-weight: 700;
          background: #222c3a;
          color: #a5b4c8;
        }

        .status.success { background: #123629; color: #5cdaa1; }
        .status.running { background: #173658; color: #75baff; }
        .status.waiting { background: #292b32; color: #a8aab4; }
        .status.danger { background: #3a1b25; color: #ff929d; }

        .notice-card {
          display: flex;
          gap: 11px;
          padding: 14px;
          margin-top: 15px;
          border: 1px solid #35405a;
          border-radius: 12px;
          background: #111b2b;
        }

        .notice-card > span { font-size: 18px; }
        .notice-card strong { font-size: 11px; }
        .notice-card p {
          color: #8e9eb3;
          font-size: 10px;
          line-height: 1.6;
          margin: 5px 0 0;
        }

        .database-message { color: #69b5ff; font-size: 11px; margin: 12px 0; }

        .database-error {
          color: #ff929d;
          background: #29161d;
          border: 1px solid #713b45;
          border-radius: 10px;
          padding: 12px;
          font-size: 11px;
          overflow-wrap: anywhere;
          margin: 12px 0;
        }

        .database-error p { margin-bottom: 0; line-height: 1.5; }

        .empty-card {
          padding: 19px;
          text-align: center;
        }

        .empty-card > span { display: block; font-size: 24px; margin-bottom: 9px; }
        .empty-card strong { font-size: 11px; }
        .empty-card p { color: #8293a9; font-size: 10px; line-height: 1.5; margin: 6px 0 0; }

        .page-heading { margin: 5px 0 22px; }
        .page-heading h1 { font-size: 28px; margin: 7px 0; letter-spacing: -0.7px; }

        .intelligence-banner, .production-banner {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 17px;
          border: 1px solid #234b79;
          border-radius: 14px;
          background: linear-gradient(110deg, #102b4b, #0e1929);
          margin-bottom: 24px;
        }

        .banner-icon, .production-banner-icon { font-size: 27px; }
        .intelligence-banner strong, .production-banner strong { font-size: 12px; }
        .intelligence-banner p, .production-banner p {
          color: #9aacc2;
          font-size: 10px;
          line-height: 1.5;
          margin: 5px 0 0;
        }

        .module-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .module-card {
          text-align: left;
          min-width: 0;
          min-height: 155px;
          padding: 13px;
          border: 1px solid #1d2d42;
          border-radius: 13px;
          background: #0e1724;
          color: #edf4ff;
          cursor: pointer;
        }

        .module-card:active { border-color: #348fe8; transform: scale(0.99); }

        .module-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4px;
        }

        .module-icon { width: 35px; height: 35px; font-size: 17px; }
        .module-card h3 { font-size: 11px; margin: 13px 0 6px; }
        .module-card p { min-height: 29px; color: #8495aa; font-size: 9px; line-height: 1.5; margin: 0; }
        .module-arrow { display: flex; justify-content: space-between; color: #55a8ff; font-size: 9px; margin-top: 12px; }

        .protection-card, .approval-card {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 15px;
          margin-top: 12px;
        }

        .protection-icon, .approval-icon {
          display: grid;
          place-items: center;
          width: 40px;
          height: 40px;
          background: #152b45;
          border-radius: 11px;
          font-size: 19px;
        }

        .protection-card strong, .approval-card strong { font-size: 11px; }
        .protection-card p, .approval-card p { color: #899bb1; font-size: 9px; margin: 5px 0 8px; }

        .account-card { display: flex; align-items: center; gap: 13px; padding: 16px; }
        .account-avatar { width: 43px; height: 43px; font-size: 18px; }
        .account-info { min-width: 0; }
        .account-info strong { font-size: 11px; overflow-wrap: anywhere; }
        .account-info p { color: #8395ab; font-size: 9px; margin: 5px 0 8px; }

        .settings-card { padding: 0 14px; }
        .setting-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 15px 0; }
        .setting-row strong, .simple-setting strong { font-size: 11px; }
        .setting-row p, .simple-setting p { color: #8596aa; font-size: 9px; line-height: 1.5; margin: 5px 0 0; }
        .setting-divider { height: 1px; background: #1e2c3e; }

        .toggle {
          width: 42px;
          height: 24px;
          border: 0;
          border-radius: 20px;
          background: #344153;
          padding: 3px;
          flex-shrink: 0;
          cursor: pointer;
        }

        .toggle span {
          display: block;
          width: 18px;
          height: 18px;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s;
        }

        .toggle.active { background: #247ee0; }
        .toggle.active span { transform: translateX(18px); }
        .simple-setting { display: flex; align-items: center; gap: 12px; padding: 14px 0; }
        .simple-setting > span { font-size: 18px; }

        .logout-button {
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

        .logout-button:disabled { opacity: 0.5; }
        .version-text { color: #53657b; text-align: center; font-size: 9px; margin: 18px 0 0; }

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
          backdrop-filter: blur(18px);
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          border: 0;
          background: transparent;
          color: #71839a;
          font-size: 9px;
          padding: 4px 0;
          cursor: pointer;
        }

        .nav-icon { font-size: 20px; line-height: 1; }
        .nav-item.selected { color: #5aabff; }
        .nav-item.selected .nav-icon { text-shadow: 0 0 15px #2789ef; }

        @media (min-width: 600px) {
          .main-content { padding-top: 30px; }
          .stats-grid { grid-template-columns: repeat(4, 1fr); }
          .module-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
      `}</style>
    </main>
  );
}
