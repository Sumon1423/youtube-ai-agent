"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const productionModules = [
  { icon: "💡", title: "Video Ideas", desc: "Discover high-converting video topics and angles." },
  { icon: "✍️", title: "Script Studio", desc: "Create viral short-form hooks and structured scripts." },
  { icon: "🖼️", title: "Asset Manager", desc: "Manage video assets, b-roll, and visual elements." },
  { icon: "🎙️", title: "Voice Studio", desc: "Generate realistic narration audio profiles." },
  { icon: "🎬", title: "AI Editor", desc: "Assemble and edit videos automatically." },
  { icon: "🚀", title: "Publishing", description: "Prepare and schedule approved videos for launch." },
];

export default function ProductionPage() {
  const router = useRouter();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchApprovals() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      const { data } = await supabase
        .from("approvals")
        .select("*")
        .eq("user_id", sessionData.session.user.id)
        .order("created_at", { ascending: false });

      setApprovals(data || []);
      setLoading(false);
    }

    fetchApprovals();
  }, [router]);

  return (
    <div className="production-container">
      <div className="page-header">
        <span className="eyebrow">CONTENT WORKFLOW</span>
        <h1>Production Studio</h1>
        <p>From automated script research to final video publishing.</p>
      </div>

      <div className="intro-card">
        <span className="intro-icon">▣</span>
        <div>
          <strong>Autonomous Production Pipeline</strong>
          <p>Manage your AI-generated media assets, scripts, and pending approvals.</p>
        </div>
      </div>

      <div className="module-grid">
        {productionModules.map((mod, index) => (
          <div
            key={mod.title}
            className="module-card"
            onClick={() => {
              if (mod.title === "Video Ideas") {
                router.push("/production/ideas");
              } else if (mod.title === "Script Studio") {
                router.push("/production/script");
              } else {
                alert(`${mod.title}: Module will connect in the next backend step.`);
              }
            }}
          >
            <div className="module-top">
              <span className="module-icon">{mod.icon}</span>
              <span className="module-num">{String(index + 1).padStart(2, "0")}</span>
            </div>
            <h3>{mod.title}</h3>
            <p>{mod.desc || mod.description}</p>
            <span className="module-action">Configure ↗</span>
          </div>
        ))}
      </div>

      <div className="section-header" style={{ marginTop: "24px" }}>
        <h2>Pending Approvals</h2>
      </div>

      {loading ? (
        <p className="muted">Loading approvals...</p>
      ) : approvals.length === 0 ? (
        <div className="empty-state">
          <p>No pending approval requests. Your automated tasks are clear.</p>
        </div>
      ) : (
        <div className="approval-list">
          {approvals.map((item) => (
            <div key={item.id} className="approval-item">
              <div>
                <strong>{item.action_type}</strong>
                <small>{new Date(item.created_at).toLocaleString()}</small>
              </div>
              <span className={`status-badge ${item.status?.toLowerCase()}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .production-container { display: flex; flex-direction: column; gap: 16px; }
        .page-header { margin-bottom: 4px; }
        .eyebrow { color: #52b5ff; font-size: 10px; letter-spacing: 1.5px; font-weight: 800; }
        .page-header h1 { font-size: 26px; margin: 4px 0; letter-spacing: -0.5px; }
        .page-header p { color: #8da2bb; font-size: 12px; margin: 0; }
        .intro-card { display: flex; align-items: center; gap: 14px; padding: 16px; background: rgba(15, 27, 44, 0.75); border: 1px solid rgba(112, 165, 220, 0.16); border-radius: 14px; }
        .intro-icon { width: 40px; height: 40px; display: grid; place-items: center; background: rgba(50, 152, 255, 0.1); color: #3298ff; border-radius: 10px; font-size: 18px; flex-shrink: 0; }
        .intro-card strong { font-size: 12px; display: block; margin-bottom: 3px; }
        .intro-card p { margin: 0; font-size: 11px; color: #8da2bb; line-height: 1.4; }
        .module-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
        .module-card { display: flex; flex-direction: column; padding: 16px; background: rgba(15, 27, 44, 0.7); border: 1px solid rgba(112, 165, 220, 0.16); border-radius: 14px; cursor: pointer; transition: border-color 0.2s, transform 0.2s; }
        .module-card:hover { border-color: rgba(50, 152, 255, 0.4); transform: translateY(-2px); }
        .module-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .module-icon { width: 36px; height: 36px; display: grid; place-items: center; background: rgba(37, 216, 232, 0.1); color: #25d8e8; border-radius: 10px; font-size: 16px; }
        .module-num { font-size: 10px; color: #8da2bb; font-weight: 700; }
        .module-card h3 { margin: 0 0 6px; font-size: 13px; }
        .module-card p { margin: 0 0 16px; font-size: 11px; color: #8da2bb; line-height: 1.5; flex: 1; }
        .module-action { font-size: 10px; color: #25d8e8; font-weight: 600; }
        .section-header h2 { font-size: 14px; margin: 0; }
        .empty-state { padding: 20px; text-align: center; background: rgba(15, 27, 44, 0.4); border: 1px dashed rgba(112, 165, 220, 0.2); border-radius: 12px; color: #8da2bb; font-size: 11px; }
        .approval-list { display: flex; flex-direction: column; gap: 8px; }
        .approval-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(15, 27, 44, 0.65); border: 1px solid rgba(112, 165, 220, 0.16); border-radius: 10px; }
        .approval-item strong { display: block; font-size: 11px; margin-bottom: 2px; }
        .approval-item small { color: #8da2bb; font-size: 9px; }
        .status-badge { padding: 3px 8px; border-radius: 10px; font-size: 9px; font-weight: 700; background: rgba(255, 193, 7, 0.15); color: #ffc107; }
        .muted { color: #8da2bb; font-size: 11px; }
      `}</style>
    </div>
  );
}
