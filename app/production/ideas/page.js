"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function VideoIdeasPage() {
  const router = useRouter();
  const [ideas, setIdeas] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchIdeas() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/login");
        return;
      }
      setLoading(false);
    }
    fetchIdeas();
  }, [router]);

  const generateNewIdeas = () => {
    setGenerating(true);
    setTimeout(() => {
      const newGeneratedIdeas = [
        {
          id: Date.now() + 1,
          title: "The Unsolved Mystery of the Missing B-29 Bomber",
          hook: "In 1948, an American bomber disappeared without a trace, leaving behind a creepy radio message...",
          targetAudience: "US True Crime & History Enthusiasts",
          estLength: "45-55s",
          reason: "Top performing historical true crime topic with high US retention potential."
        },
        {
          id: Date.now() + 2,
          title: "Why This 19th Century Trial Shocked America",
          hook: "A courtroom sketch revealed something in the defendant's pocket that changed the entire verdict...",
          targetAudience: "US Historical Mystery Audience",
          estLength: "50-60s",
          reason: "Leverages strong visual hooks and curiosity gaps for Shorts algorithm."
        }
      ];
      setIdeas(newGeneratedIdeas);
      setGenerating(false);
    }, 1500);
  };

  const handleSelectIdea = (idea) => {
    localStorage.setItem("selected_idea", JSON.stringify(idea));
    router.push("/production/script");
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Video Ideas Studio লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="ideas-container">
      <button className="btn-back" onClick={() => router.push("/production")}>
        ← Back to Production Studio
      </button>

      <div className="page-header">
        <span className="eyebrow">AI CONCEPT GENERATOR</span>
        <h1>Video Ideas 💡</h1>
        <p>AI-driven high-converting video concepts for US Shorts Audience.</p>
      </div>

      <button className="btn-generate" onClick={generateNewIdeas} disabled={generating}>
        {generating ? "AI Generating Concepts..." : "✨ Generate AI Video Ideas"}
      </button>

      {ideas.length === 0 && !generating ? (
        <div className="empty-state">
          <p>উপরের বাটনে ক্লিক করে চ্যানেল এনালাইসিসভিত্তিক নতুন Video Ideas জেনারেট করুন।</p>
        </div>
      ) : (
        <div className="ideas-grid">
          {ideas.map((idea) => (
            <div key={idea.id} className="idea-card">
              <span className="badge">US Audience Target</span>
              <h3>{idea.title}</h3>
              <p className="hook-text"><strong>Hook:</strong> "{idea.hook}"</p>
              <div className="meta-info">
                <span>⏱️ {idea.estLength}</span>
                <span>🎯 {idea.targetAudience}</span>
              </div>
              <p className="reason-text">💡 <em>{idea.reason}</em></p>
              <button className="btn-select" onClick={() => handleSelectIdea(idea)}>
                Generate Script & Storyboard →
              </button>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .ideas-container { display: flex; flex-direction: column; gap: 16px; }
        .btn-back { background: transparent; border: none; color: #3298ff; font-size: 11px; cursor: pointer; width: fit-content; padding: 0; }
        .eyebrow { color: #52b5ff; font-size: 10px; letter-spacing: 1.5px; font-weight: 800; }
        .page-header h1 { font-size: 24px; margin: 4px 0; }
        .page-header p { color: #8da2bb; font-size: 12px; margin: 0; }
        .btn-generate { background: #25d8e8; color: #07111e; border: none; padding: 12px; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 12px; }
        .ideas-grid { display: flex; flex-direction: column; gap: 12px; }
        .idea-card { padding: 16px; background: rgba(15, 27, 44, 0.7); border: 1px solid rgba(112, 165, 220, 0.16); border-radius: 14px; display: flex; flex-direction: column; gap: 8px; }
        .badge { background: rgba(37, 216, 232, 0.15); color: #25d8e8; padding: 3px 8px; border-radius: 6px; font-size: 9px; font-weight: bold; width: fit-content; }
        .idea-card h3 { margin: 0; font-size: 14px; color: #edf6ff; }
        .hook-text { font-size: 11px; color: #aab7c8; margin: 0; }
        .meta-info { display: flex; gap: 16px; font-size: 10px; color: #8da2bb; }
        .reason-text { font-size: 10px; color: #52b5ff; margin: 0; }
        .btn-select { background: rgba(50, 152, 255, 0.2); color: #52b5ff; border: 1px solid rgba(50, 152, 255, 0.4); padding: 8px; border-radius: 8px; font-size: 11px; cursor: pointer; margin-top: 6px; font-weight: bold; }
        .empty-state { text-align: center; color: #8da2bb; font-size: 11px; padding: 30px; background: rgba(15, 27, 44, 0.4); border-radius: 12px; border: 1px dashed rgba(112, 165, 220, 0.2); }
        .spinner { width: 24px; height: 24px; border: 2px solid rgba(82, 144, 201, 0.22); border-top-color: #25d8e8; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 10px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
