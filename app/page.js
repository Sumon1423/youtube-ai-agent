
"use client";

import { useState } from "react";

const sections = {
  Home: ["Overview", "Your AI workspace at a glance"],
  Intelligence: ["AI Intelligence Center", "Monitor, analyze and improve your channel"],
  Production: ["Video Production", "Create your next YouTube Short"],
  More: ["More Tools", "Manage your AI workspace"],
};

const intelligence = [
  ["◉", "Channel Monitor", "Detect channel issues and important changes"],
  ["▥", "Video Doctor", "Find why videos underperform"],
  ["✦", "Trend Intelligence", "Discover trending topics and opportunities"],
  ["⌕", "SEO Intelligence", "Audit titles, descriptions and tags"],
  ["♙", "Audience Insights", "Understand retention and viewer behavior"],
  ["☏", "Comment Center", "Monitor comments and prepare replies"],
  ["◎", "Competitor Watch", "Study similar channels and their content"],
  ["↗", "Growth Intelligence", "Find opportunities to improve your channel"],
];

const production = [
  ["✦", "Video Ideas", "Discover topics for your next Short"],
  ["▤", "Script Studio", "Write engaging video scripts"],
  ["▧", "Asset Manager", "Organize images, clips and visual assets"],
  ["♫", "Voice Studio", "Generate narration"],
  ["✂", "AI Video Editor", "Create and edit your video"],
  ["▷", "Video Preview", "Review your finished video"],
  ["↑", "Publishing", "Prepare and publish approved videos"],
];

const activities = [
  ["Channel Analysis", "Check recent video performance", "Waiting"],
  ["Trend Research", "Find relevant USA mystery topics", "Waiting"],
  ["Video Diagnosis", "Analyze retention and engagement", "Waiting"],
  ["SEO Audit", "Review titles and descriptions", "Waiting"],
];

export default function Home() {
  const [tab, setTab] = useState("Home");
  const [page, setPage] = useState("");
  const [auto, setAuto] = useState(true);

  const openPage = (name) => {
    setPage(name);
  };

  const backHome = () => setPage("");

  const Card = ({ icon, title, desc, onClick }) => (
    <button className="tool-card" onClick={onClick}>
      <span className="tool-icon">{icon}</span>
      <span className="tool-title">{title}</span>
      <span className="tool-desc">{desc}</span>
      <span className="tool-arrow">›</span>
    </button>
  );

  return (
    <main className="app">
      <style jsx global>{`
        * { box-sizing: border-box; }
        html, body {
          margin: 0;
          padding: 0;
          background: #080d15;
          color: #edf4ff;
          font-family: Arial, Helvetica, sans-serif;
        }
        button { font: inherit; }
        .app {
          width: 100%;
          max-width: 520px;
          min-height: 100dvh;
          margin: auto;
          padding-bottom: 88px;
          background: #080d15;
        }
        .header {
          padding: 20px 19px 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #1a293a;
          background: #0c1420;
        }
        .brand {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -.6px;
        }
        .brand span { color: #399aff; }
        .brand-sub {
          font-size: 9px;
          color: #71869f;
          letter-spacing: 1.5px;
          margin-top: 4px;
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 9px;
        }
        .connection {
          font-size: 9px;
          color: #f0c36d;
          border: 1px solid #554426;
          background: #2b2418;
          padding: 7px 9px;
          border-radius: 20px;
        }
        .avatar {
          width: 33px;
          height: 33px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #173b65;
          color: #9dccff;
          font-weight: 800;
        }
        .content { padding: 19px 16px 25px; }
        .page-heading {
          font-size: 22px;
          font-weight: 750;
          letter-spacing: -.5px;
          margin: 0;
        }
        .page-sub {
          color: #8294aa;
          font-size: 11px;
          line-height: 1.6;
          margin-top: 6px;
        }
        .hero {
          margin-top: 18px;
          border: 1px solid #24558a;
          border-radius: 15px;
          padding: 19px;
          background: linear-gradient(135deg,#12345a,#101d31 75%);
        }
        .hero-label {
          font-size: 9px;
          color: #91c5ff;
          letter-spacing: 1.4px;
          font-weight: bold;
        }
        .hero-title {
          font-size: 19px;
          line-height: 1.35;
          font-weight: 750;
          margin-top: 10px;
        }
        .hero-text {
          color: #a4bad3;
          font-size: 11px;
          line-height: 1.7;
          margin-top: 8px;
        }
        .button-primary {
          border: 0;
          border-radius: 8px;
          background: #2789ef;
          color: white;
          font-size: 11px;
          font-weight: bold;
          padding: 11px 14px;
          margin-top: 15px;
        }
        .section-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 23px 0 12px;
        }
        .section-title {
          font-size: 14px;
          font-weight: 750;
        }
        .section-note {
          color: #71849a;
          font-size: 9px;
        }
        .status-card {
          border: 1px solid #24364c;
          border-radius: 13px;
          padding: 15px;
          background: #101a29;
        }
        .status-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .status-name {
          font-size: 12px;
          font-weight: bold;
        }
        .status-pill {
          color: #f0c36d;
          background: #302719;
          padding: 6px 8px;
          border-radius: 6px;
          font-size: 9px;
        }
        .status-desc {
          font-size: 10px;
          color: #8193aa;
          margin-top: 7px;
          line-height: 1.6;
        }
        .stat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 11px;
        }
        .stat {
          padding: 14px;
          border: 1px solid #223349;
          border-radius: 11px;
          background: #101a29;
        }
        .stat-label {
          font-size: 10px;
          color: #91a2b7;
        }
        .stat-value {
          font-size: 20px;
          font-weight: 750;
          margin-top: 10px;
        }
        .stat-sub {
          font-size: 9px;
          color: #71849a;
          margin-top: 5px;
        }
        .blue { color: #69b3ff; }
        .tool-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .tool-card {
          min-width: 0;
          position: relative;
          text-align: left;
          padding: 14px 12px;
          background: #101a29;
          border: 1px solid #24364c;
          border-radius: 12px;
          color: #edf4ff;
          min-height: 126px;
        }
        .tool-card:active { background: #172943; }
        .tool-icon {
          display: grid;
          place-items: center;
          width: 31px;
          height: 31px;
          border-radius: 9px;
          color: #7bbcff;
          background: #183452;
          font-size: 16px;
          margin-bottom: 12px;
        }
        .tool-title {
          display: block;
          font-size: 11px;
          font-weight: 750;
          padding-right: 8px;
        }
        .tool-desc {
          display: block;
          color: #8294aa;
          font-size: 9px;
          line-height: 1.6;
          margin-top: 6px;
        }
        .tool-arrow {
          position: absolute;
          right: 11px;
          top: 16px;
          color: #6483a4;
          font-size: 18px;
        }
        .activity-item {
          display: flex;
          gap: 11px;
          padding: 13px 0;
          border-bottom: 1px solid #1e2d40;
        }
        .activity-item:last-child { border: 0; }
        .activity-dot {
          width: 9px;
          height: 9px;
          margin-top: 4px;
          border-radius: 50%;
          background: #4b9fff;
          flex-shrink: 0;
        }
        .activity-name { font-size: 11px; font-weight: bold; }
        .activity-desc {
          font-size: 9px;
          color: #8193aa;
          margin-top: 5px;
          line-height: 1.5;
        }
        .activity-status {
          margin-left: auto;
          color: #f0c36d;
          font-size: 9px;
          white-space: nowrap;
        }
        .notice {
          padding: 13px;
          border-radius: 10px;
          border: 1px solid #34445b;
          background: #141f30;
          color: #9aadc4;
          font-size: 10px;
          line-height: 1.7;
          margin-top: 15px;
        }
        .back {
          background: none;
          border: 0;
          color: #75baff;
          font-size: 11px;
          padding: 0;
          margin-bottom: 18px;
        }
        .detail-panel {
          background: #101a29;
          border: 1px solid #24364c;
          border-radius: 13px;
          padding: 17px;
          margin-top: 17px;
        }
        .detail-panel h3 {
          font-size: 14px;
          margin: 0 0 9px;
        }
        .detail-panel p {
          color: #8ea0b5;
          font-size: 11px;
          line-height: 1.8;
        }
        .setting-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid #24364c;
        }
        .setting-row:last-child { border: 0; }
        .setting-name { font-size: 11px; font-weight: bold; }
        .setting-desc {
          color: #8294aa;
          font-size: 9px;
          margin-top: 5px;
        }
        .toggle {
          border: 0;
          width: 39px;
          height: 22px;
          border-radius: 20px;
          background: #35465c;
          padding: 3px;
          flex-shrink: 0;
        }
        .toggle.on { background: #247fe0; }
        .toggle-dot {
          display: block;
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 50%;
          transition: transform .15s;
        }
        .toggle.on .toggle-dot { transform: translateX(17px); }
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 520px;
          display: grid;
          grid-template-columns: repeat(4,1fr);
          padding: 9px 5px max(9px,env(safe-area-inset-bottom));
          background: #0c1420;
          border-top: 1px solid #24364c;
          z-index: 20;
        }
        .bottom-nav button {
          border: 0;
          background: none;
          color: #788da7;
          font-size: 9px;
          padding: 5px 2px;
        }
        .bottom-nav button.active { color: #72baff; }
        .bottom-icon {
          display: block;
          font-size: 19px;
          margin-bottom: 5px;
        }
        @media(min-width: 700px) {
          .app { border-left: 1px solid #1b2a3b; border-right: 1px solid #1b2a3b; }
        }
      `}</style>

      <header className="header">
        <div>
          <div className="brand">◈ Creator<span>OS</span></div>
          <div className="brand-sub">AI YOUTUBE WORKSPACE</div>
        </div>
        <div className="header-right">
          <div className="connection">● Not connected</div>
          <div className="avatar">S</div>
        </div>
      </header>

      <div className="content">
        {page ? (
          <>
            <button className="back" onClick={backHome}>← Back</button>
            <h1 className="page-heading">{page}</h1>
            <div className="page-sub">Your AI workspace module</div>
            <div className="detail-panel">
              <h3>{page}</h3>
              <p>
                This module is included in the planned CreatorOS workflow.
                Its real integrations and automation will be implemented
                in the next development stages.
              </p>
              <span className="status-pill">UNDER DEVELOPMENT</span>
            </div>
          </>
        ) : (
          <>
            <h1 className="page-heading">{sections[tab][0]}</h1>
            <div className="page-sub">{sections[tab][1]}</div>

            {tab === "Home" && (
              <>
                <div className="hero">
                  <div className="hero-label">YOUR AUTONOMOUS AI WORKSPACE</div>
                  <div className="hero-title">
                    Your channel. Your AI. Your control.
                  </div>
                  <div className="hero-text">
                    Monitor your channel, discover opportunities and
                    manage your entire Shorts production workflow.
                  </div>
                  <button className="button-primary"
                    onClick={() => setTab("Intelligence")}>
                    Open Intelligence Center →
                  </button>
                </div>

                <div className="section-head">
                  <div className="section-title">Agent Overview</div>
                  <div className="section-note">Setup stage</div>
                </div>

                <div className="status-card">
                  <div className="status-top">
                    <div className="status-name">✳ AI Agent Status</div>
                    <span className="status-pill">Setup pending</span>
                  </div>
                  <div className="status-desc">
                    YouTube and AI services are not connected yet.
                    Real monitoring will begin after integration.
                  </div>
                </div>

                <div className="stat-grid">
                  <div className="stat">
                    <div className="stat-label">Issues Detected</div>
                    <div className="stat-value blue">—</div>
                    <div className="stat-sub">Awaiting channel data</div>
                  </div>
                  <div className="stat">
                    <div className="stat-label">Tasks Completed</div>
                    <div className="stat-value blue">—</div>
                    <div className="stat-sub">No agent activity yet</div>
                  </div>
                  <div className="stat">
                    <div className="stat-label">Pending Approvals</div>
                    <div className="stat-value blue">—</div>
                    <div className="stat-sub">Nothing submitted yet</div>
                  </div>
                  <div className="stat">
                    <div className="stat-label">Automation</div>
                    <div className="stat-value blue">OFF</div>
                    <div className="stat-sub">Not connected</div>
                  </div>
                </div>

                <div className="section-head">
                  <div className="section-title">Recent Agent Activity</div>
                  <button className="section-note"
                    onClick={() => setPage("Agent Activity")}>
                    View all →
                  </button>
                </div>

                <div className="status-card">
                  {activities.slice(0,3).map((item) => (
                    <div className="activity-item" key={item[0]}>
                      <span className="activity-dot"></span>
                      <div>
                        <div className="activity-name">{item[0]}</div>
                        <div className="activity-desc">{item[1]}</div>
                      </div>
                      <span className="activity-status">{item[2]}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === "Intelligence" && (
              <>
                <div className="notice">
                  ✳ Intelligence Center: AI analysis and monitoring
                  will become active after YouTube and AI integrations.
                  No sample results are presented as real data.
                </div>
                <div className="section-head">
                  <div className="section-title">Intelligence Modules</div>
                  <div className="section-note">8 modules</div>
                </div>
                <div className="tool-list">
                  {intelligence.map(([icon,title,desc]) => (
                    <Card key={title} icon={icon} title={title}
                      desc={desc} onClick={() => openPage(title)} />
                  ))}
                </div>
                <div className="section-head">
                  <div className="section-title">Agent Activity</div>
                  <button className="section-note"
                    onClick={() => openPage("Agent Activity")}>View all →</button>
                </div>
                <div className="status-card">
                  {activities.map((item) => (
                    <div className="activity-item" key={item[0]}>
                      <span className="activity-dot"></span>
                      <div>
                        <div className="activity-name">{item[0]}</div>
                        <div className="activity-desc">{item[1]}</div>
                      </div>
                      <span className="activity-status">{item[2]}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === "Production" && (
              <>
                <div className="notice">
                  Your complete Shorts production pipeline.
                  AI-generated content will require review before publishing.
                </div>
                <div className="section-head">
                  <div className="section-title">Production Tools</div>
                  <div className="section-note">7 modules</div>
                </div>
                <div className="tool-list">
                  {production.map(([icon,title,desc]) => (
                    <Card key={title} icon={icon} title={title}
                      desc={desc} onClick={() => openPage(title)} />
                  ))}
                </div>
              </>
            )}

            {tab === "More" && (
              <>
                <div className="section-head">
                  <div className="section-title">Workspace Controls</div>
                </div>
                <div className="detail-panel">
                  {[
                    ["Approval Center","Review important AI actions"],
                    ["Automation Settings","Control automatic actions"],
                    ["Agent Settings","Configure your AI agent"],
                    ["Task History","Review previous agent activity"],
                    ["Connected Services","Manage YouTube and AI integrations"],
                  ].map(([name,desc]) => (
                    <div className="setting-row" key={name}
                      onClick={() => openPage(name)}>
                      <div>
                        <div className="setting-name">{name}</div>
                        <div className="setting-desc">{desc}</div>
                      </div>
                      <span className="blue">›</span>
                    </div>
                  ))}
                </div>

                <div className="section-head">
                  <div className="section-title">Automation Preference</div>
                </div>
                <div className="detail-panel">
                  <div className="setting-row">
                    <div>
                      <div className="setting-name">Autonomous Mode</div>
                      <div className="setting-desc">
                        Preference only. Automation is not connected yet.
                      </div>
                    </div>
                    <button
                      className={`toggle ${auto ? "on" : ""}`}
                      onClick={() => setAuto(!auto)}
                      aria-label="Toggle autonomous mode"
                    >
                      <span className="toggle-dot"></span>
                    </button>
                  </div>
                  <div className="setting-desc">
                    Publishing, replies and important channel changes
                    will still follow their approval rules.
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <nav className="bottom-nav">
        {[
          ["Home","⌂"],
          ["Intelligence","✳"],
          ["Production","▣"],
          ["More","•••"],
        ].map(([name,icon]) => (
          <button key={name}
            className={tab === name && !page ? "active" : ""}
            onClick={() => { setTab(name); setPage(""); }}>
            <span className="bottom-icon">{icon}</span>
            {name}
          </button>
        ))}
      </nav>
    </main>
  );
}
