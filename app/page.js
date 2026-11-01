
"use client";

import { useState } from "react";

const nav = [
  ["Overview", "◫"],
  ["Analytics", "▥"],
  ["AI Agent", "✳"],
  ["Video Ideas", "✦"],
  ["Scripts", "▤"],
  ["Assets", "▧"],
  ["Voice Studio", "♫"],
  ["AI Editor", "✂"],
  ["Preview", "▷"],
  ["Publishing", "↑"],
];

const workflow = [
  ["01", "Research & Ideas", "Find topics from trends and channel data", "Waiting"],
  ["02", "Script Generation", "Create a story and engaging hook", "Waiting"],
  ["03", "Asset Collection", "Gather images, clips and visual elements", "Waiting"],
  ["04", "Voice Generation", "Generate narration from approved script", "Waiting"],
  ["05", "AI Editing", "Choose style, captions, zooms and sound effects", "Waiting"],
  ["06", "Final Review", "Preview and approve the finished video", "Approval"],
  ["07", "Publishing", "Upload and publish to YouTube", "Waiting"],
];

export default function Home() {
  const [active, setActive] = useState("Overview");

  return (
    <main className="shell">
      <style jsx global>{`
        * { box-sizing: border-box; }
        body {
          margin: 0;
          background: #080d14;
          color: #edf3fc;
          font-family: Arial, Helvetica, sans-serif;
        }
        button { font: inherit; }
        .shell { min-height: 100vh; display: flex; }
        .sidebar {
          width: 248px; flex-shrink: 0; background: #0c131e;
          border-right: 1px solid #1d2a3a; padding: 24px 15px;
          display: flex; flex-direction: column;
        }
        .brand { font-size: 19px; font-weight: 800; padding: 4px 10px; }
        .brand b { color: #3995ff; }
        .brand-sub { color: #72849a; font-size: 10px; letter-spacing: 1.5px;
          padding: 5px 10px 30px; }
        .nav-label { color: #63758b; font-size: 10px; letter-spacing: 1.4px;
          padding: 0 10px 10px; }
        .nav-btn {
          display: flex; align-items: center; gap: 12px; width: 100%;
          padding: 11px 12px; border: 0; border-radius: 8px;
          color: #9aabc0; background: transparent; text-align: left;
          font-size: 13px; margin-bottom: 3px; cursor: pointer;
        }
        .nav-btn:hover { background: #152236; color: #fff; }
        .nav-btn.active {
          color: #70b5ff; background: #142b46;
          box-shadow: inset 2px 0 #3995ff;
        }
        .nav-icon { width: 20px; font-size: 16px; text-align: center; }
        .side-bottom { margin-top: auto; border-top: 1px solid #1d2a3a;
          padding: 18px 9px 0; }
        .user-row { display: flex; gap: 10px; align-items: center; }
        .avatar { width: 34px; height: 34px; border-radius: 10px;
          background: #173c65; color: #8fc5ff; display: grid;
          place-items: center; font-weight: bold; }
        .user-name { font-size: 12px; font-weight: bold; }
        .user-sub { font-size: 10px; color: #71839a; margin-top: 4px; }
        .main { flex: 1; min-width: 0; padding: 27px 30px 45px; }
        .topbar { display: flex; justify-content: space-between;
          align-items: center; gap: 15px; margin-bottom: 27px; }
        h1 { margin: 0; font-size: 25px; letter-spacing: -.5px; }
        .subtitle { color: #8292a7; font-size: 12px; margin-top: 7px; }
        .top-actions { display: flex; gap: 10px; align-items: center; }
        .connection { color: #f0c36b; background: #292318;
          border: 1px solid #554323; border-radius: 20px;
          padding: 8px 12px; font-size: 11px; }
        .icon-btn { width: 36px; height: 36px; border: 1px solid #26364a;
          color: #b5c5d8; background: #101b2a; border-radius: 9px; }
        .welcome {
          background: linear-gradient(110deg, #102746, #102035 65%, #111b2b);
          border: 1px solid #23476c; border-radius: 14px;
          padding: 22px 23px; margin-bottom: 20px;
          display: flex; justify-content: space-between; align-items: center;
          gap: 15px; overflow: hidden;
        }
        .welcome h2 { font-size: 18px; margin: 0 0 8px; }
        .welcome p { color: #9db5d0; font-size: 12px; margin: 0; line-height: 1.6; }
        .primary {
          background: #2788ed; border: 0; border-radius: 8px;
          color: white; padding: 11px 15px; font-size: 12px;
          font-weight: bold; cursor: pointer; white-space: nowrap;
        }
        .primary:hover { background: #409aff; }
        .stats { display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 13px; margin-bottom: 22px; }
        .card { background: #101a28; border: 1px solid #202f42;
          border-radius: 12px; padding: 17px; min-width: 0; }
        .stat-top { display: flex; justify-content: space-between;
          align-items: center; color: #94a5ba; font-size: 11px; }
        .stat-icon { color: #6bb3ff; background: #162d49;
          border-radius: 8px; width: 30px; height: 30px;
          display: grid; place-items: center; font-size: 15px; }
        .stat-value { font-size: 24px; font-weight: 750; margin-top: 13px; }
        .stat-note { color: #71849a; font-size: 10px; margin-top: 5px; }
        .section-head { display: flex; justify-content: space-between;
          align-items: center; margin: 25px 0 13px; gap: 10px; }
        .section-head h2 { font-size: 15px; margin: 0; }
        .small-link { color: #69adfa; font-size: 11px; background: none;
          border: 0; cursor: pointer; }
        .content-grid { display: grid; grid-template-columns: 1.45fr 1fr;
          gap: 14px; }
        .panel { background: #101a28; border: 1px solid #202f42;
          border-radius: 12px; padding: 18px; min-width: 0; }
        .panel-title { font-size: 13px; font-weight: bold; margin: 0 0 5px; }
        .panel-sub { color: #71849a; font-size: 10px; }
        .empty-chart { height: 155px; display: flex; flex-direction: column;
          align-items: center; justify-content: center; color: #71849a;
          font-size: 11px; gap: 8px; text-align: center; }
        .chart-icon { font-size: 25px; color: #438fda; }
        .agent-status { display: flex; gap: 11px; align-items: center;
          padding: 13px; border-radius: 9px; background: #14243a;
          margin-top: 15px; }
        .pulse { width: 9px; height: 9px; background: #e9b95c;
          border-radius: 50%; }
        .agent-text { font-size: 12px; font-weight: bold; }
        .agent-sub { color: #8497ad; font-size: 10px; margin-top: 4px; }
        .workflow { margin-top: 15px; }
        .workflow-row { display: flex; align-items: center; gap: 12px;
          padding: 13px 0; border-bottom: 1px solid #1e2c3d; }
        .workflow-row:last-child { border: 0; }
        .step-no { width: 29px; height: 29px; display: grid;
          place-items: center; border: 1px solid #2b4058;
          border-radius: 8px; color: #83bfff; font-size: 10px; }
        .step-info { flex: 1; min-width: 0; }
        .step-title { font-size: 11px; font-weight: bold; }
        .step-desc { color: #7d90a7; font-size: 10px; margin-top: 4px; }
        .step-status { font-size: 9px; color: #91a3b8;
          background: #1b2939; border-radius: 5px; padding: 5px 7px; }
        .approval { color: #f1c36d; background: #332a19; }
        .mobile-nav { display: none; }
        .page-panel { background: #101a28; border: 1px solid #202f42;
          border-radius: 12px; padding: 22px; min-height: 250px; }
        .page-panel p { color: #8292a7; font-size: 12px; line-height: 1.7; }
        @media(max-width: 1000px) {
          .sidebar { width: 210px; }
          .main { padding: 23px 20px; }
          .stats { grid-template-columns: repeat(2, 1fr); }
          .content-grid { grid-template-columns: 1fr; }
        }
        @media(max-width: 650px) {
          .shell { display: block; padding-bottom: 68px; }
          .sidebar { display: none; }
          .main { padding: 20px 14px; }
          .topbar { align-items: flex-start; }
          h1 { font-size: 21px; }
          .connection { font-size: 9px; padding: 7px 8px; }
          .icon-btn { display: none; }
          .welcome { padding: 17px; align-items: flex-start; flex-direction: column; }
          .welcome h2 { font-size: 16px; }
          .stats { gap: 9px; }
          .card { padding: 13px; }
          .stat-value { font-size: 21px; }
          .panel { padding: 14px; }
          .mobile-nav {
            display: flex; position: fixed; z-index: 10; bottom: 0;
            left: 0; right: 0; overflow-x: auto; gap: 4px;
            background: #0c131e; border-top: 1px solid #26364a;
            padding: 8px 7px max(8px, env(safe-area-inset-bottom));
          }
          .mobile-nav button {
            flex: 0 0 auto; min-width: 57px; border: 0;
            color: #91a3b8; background: transparent; border-radius: 8px;
            padding: 7px 8px; font-size: 9px;
          }
          .mobile-nav button.active { color: #77baff; background: #172d47; }
          .mobile-nav span { display: block; font-size: 16px; margin-bottom: 4px; }
        }
      `}</style>

      <aside className="sidebar">
        <div className="brand">◈ <b>Creator</b>OS</div>
        <div className="brand-sub">AI YOUTUBE WORKSPACE</div>
        <div className="nav-label">WORKSPACE</div>
        {nav.map(([name, icon]) => (
          <button key={name}
            className={`nav-btn ${active === name ? "active" : ""}`}
            onClick={() => setActive(name)}>
            <span className="nav-icon">{icon}</span>{name}
          </button>
        ))}
        <div className="side-bottom">
          <div className="user-row">
            <div className="avatar">S</div>
            <div>
              <div className="user-name">My Workspace</div>
              <div className="user-sub">Channel not connected</div>
            </div>
          </div>
        </div>
      </aside>

      <section className="main">
        <header className="topbar">
          <div>
            <h1>{active}</h1>
            <div className="subtitle">Manage your YouTube channel with AI</div>
          </div>
          <div className="top-actions">
            <div className="connection">● YouTube not connected</div>
            <button className="icon-btn" title="Notifications">♧</button>
          </div>
        </header>

        <nav className="mobile-nav">
          {nav.map(([name, icon]) => (
            <button key={name}
              className={active === name ? "active" : ""}
              onClick={() => setActive(name)}>
              <span>{icon}</span>{name}
            </button>
          ))}
        </nav>

        {active === "Overview" ? (
          <>
            <div className="welcome">
              <div>
                <h2>Your AI content studio is ready to set up.</h2>
                <p>Connect your channel later. First, let's build your production workflow.</p>
              </div>
              <button className="primary" onClick={() => setActive("AI Agent")}>
                Explore AI Agent →
              </button>
            </div>

            <div className="stats">
              {[
                ["Total Views", "—", "Connect YouTube to view data", "◉"],
                ["Subscribers", "—", "Channel analytics unavailable", "♙"],
                ["Published Videos", "—", "Waiting for channel data", "▷"],
                ["Agent Status", "Setup", "Integrations not connected", "✳"],
              ].map(([label, value, note, icon]) => (
                <div className="card" key={label}>
                  <div className="stat-top">
                    {label}<span className="stat-icon">{icon}</span>
                  </div>
                  <div className="stat-value">{value}</div>
                  <div className="stat-note">{note}</div>
                </div>
              ))}
            </div>

            <div className="content-grid">
              <div className="panel">
                <div className="panel-title">Channel Performance</div>
                <div className="panel-sub">Your views and audience growth</div>
                <div className="empty-chart">
                  <div className="chart-icon">▥</div>
                  <strong>No channel data yet</strong>
                  Connect your YouTube channel to see real analytics here.
                </div>
              </div>
              <div className="panel">
                <div className="panel-title">AI Agent Control Center</div>
                <div className="panel-sub">Your automated production assistant</div>
                <div className="agent-status">
                  <span className="pulse"></span>
                  <div>
                    <div className="agent-text">Agent setup pending</div>
                    <div className="agent-sub">Waiting for integrations</div>
                  </div>
                </div>
                <div className="workflow">
                  <div className="step-title">Next: Configure the workflow</div>
                  <div className="step-desc">We'll connect the AI services and channel access in later steps.</div>
                </div>
              </div>
            </div>

            <div className="section-head">
              <h2>Video Production Pipeline</h2>
              <button className="small-link" onClick={() => setActive("AI Agent")}>View workflow →</button>
            </div>
            <div className="panel">
              {workflow.map(([no, title, desc, status]) => (
                <div className="workflow-row" key={no}>
                  <div className="step-no">{no}</div>
                  <div className="step-info">
                    <div className="step-title">{title}</div>
                    <div className="step-desc">{desc}</div>
                  </div>
                  <span className={`step-status ${status === "Approval" ? "approval" : ""}`}>
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="page-panel">
            <h2>{active}</h2>
            <p>
              This workspace section is ready for its implementation.
              Its real AI services and YouTube integrations will be connected
              in the next development steps.
            </p>
            <span className="step-status">UNDER DEVELOPMENT</span>
          </div>
        )}
      </section>
    </main>
  );
}
