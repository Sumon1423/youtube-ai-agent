"use client";

import { useRouter } from "next/navigation";

const intelligenceModules = [
  { icon: "📡", title: "Channel Monitor", desc: "Track changes in views, subscribers, and overall channel health." },
  { icon: "🩺", title: "Video Doctor", desc: "Diagnose individual video performance and identify weak hooks." },
  { icon: "🔎", title: "SEO Intelligence", desc: "Review titles, descriptions, and keywords for US audience reach." },
  { icon: "📈", title: "Trend Radar", desc: "Discover emerging topics and verified trends in the US." },
  { icon: "👥", title: "Audience Insights", desc: "Understand viewer retention, geography, and engagement patterns." },
  { icon: "💬", title: "Comment Center", desc: "Analyze audience feedback and recurring questions." },
  { icon: "🎯", title: "Competitor Watch", desc: "Monitor relevant competing YouTube Shorts channels." },
  { icon: "🧠", title: "Growth Intelligence", desc: "Turn analytics into an actionable growth strategy and weekly reports." },
];

export default function IntelligencePage() {
  const router = useRouter();

  return (
    <div className="intelligence-container">
      <div className="page-header">
        <span className="eyebrow">AI CONTROL CENTER</span>
        <h1>Intelligence Hub</h1>
        <p>Channel research, diagnostics, and AI growth strategies.</p>
      </div>

      <div className="intro-card">
        <span className="intro-icon">◈</span>
        <div>
          <strong>Autonomous Channel Intelligence</strong>
          <p>Select a module below to inspect your channel performance or run AI diagnostics.</p>
        </div>
      </div>

      <div className="module-grid">
        {intelligenceModules.map((mod, index) => (
          <div
            key={mod.title}
            className="module-card"
            onClick={() => {
              onClick={() => {
  if (mod.title === "Video Doctor") {
    router.push("/intelligence/video-doctor");
  } else if (mod.title === "Channel Monitor") {
    router.push("/intelligence/channel-monitor");
  } else {
    alert(`${mod.title}: Module is configured for future updates.`);
  }
}}

              } else if (mod.title === "Channel Monitor") {
                router.push("/");
              } else {
                alert(`${mod.title}: Module is configured for future updates.`);
              }
            }}
          >
            <div className="module-top">
              <span className="module-icon">{mod.icon}</span>
              <span className="module-num">{String(index + 1).padStart(2, "0")}</span>
            </div>
            <h3>{mod.title}</h3>
            <p>{mod.desc}</p>
            <span className="module-action">Explore ↗</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .intelligence-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .page-header {
          margin-bottom: 4px;
        }

        .eyebrow {
          color: #52b5ff;
          font-size: 10px;
          letter-spacing: 1.5px;
          font-weight: 800;
        }

        .page-header h1 {
          font-size: 26px;
          margin: 4px 0;
          letter-spacing: -0.5px;
        }

        .page-header p {
          color: #8da2bb;
          font-size: 12px;
          margin: 0;
        }

        .intro-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          background: rgba(15, 27, 44, 0.75);
          border: 1px solid rgba(112, 165, 220, 0.16);
          border-radius: 14px;
        }

        .intro-icon {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          background: rgba(37, 216, 232, 0.1);
          color: #25d8e8;
          border-radius: 10px;
          font-size: 18px;
          flex-shrink: 0;
        }

        .intro-card strong {
          font-size: 12px;
          display: block;
          margin-bottom: 3px;
        }

        .intro-card p {
          margin: 0;
          font-size: 11px;
          color: #8da2bb;
          line-height: 1.4;
        }

        .module-grid {
          display: grid;
          grid-grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 12px;
        }

        .module-card {
          display: flex;
          flex-direction: column;
          padding: 16px;
          background: rgba(15, 27, 44, 0.7);
          border: 1px solid rgba(112, 165, 220, 0.16);
          border-radius: 14px;
          cursor: pointer;
          transition: border-color 0.2s, transform 0.2s;
        }

        .module-card:hover {
          border-color: rgba(37, 216, 232, 0.4);
          transform: translateY(-2px);
        }

        .module-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .module-icon {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          background: rgba(50, 152, 255, 0.12);
          color: #3298ff;
          border-radius: 10px;
          font-size: 16px;
        }

        .module-num {
          font-size: 10px;
          color: #8da2bb;
          font-weight: 700;
        }

        .module-card h3 {
          margin: 0 0 6px;
          font-size: 13px;
        }

        .module-card p {
          margin: 0 0 16px;
          font-size: 11px;
          color: #8da2bb;
          line-height: 1.5;
          flex: 1;
        }

        .module-action {
          font-size: 10px;
          color: #3298ff;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
