"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AIEditorPage() {
  const router = useRouter();
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initEditor() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      const savedIdea = localStorage.getItem("selected_idea");
      if (savedIdea) {
        setSelectedIdea(JSON.parse(savedIdea));
      }
      setLoading(false);
    }
    initEditor();
  }, [router]);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>CreatorOS Studio লোড হচ্ছে...</p>
      </div>
    );
  }

  // ভিডিওর জন্য পর্যাপ্ত রিয়ালিস্টিক ও আর্কাইভাল ছবিগুলোর লিস্ট
  const storyAssets = [
    { id: 1, name: "B-29 Superfortress Bomber", url: "https://upload.wikimedia.org/wikipedia/commons/e/e4/B-29_Superfortress_in_flight.jpg" },
    { id: 2, name: "Alaskan Wilderness Landscape", url: "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1200&q=80" },
    { id: 3, name: "Vintage Military Investigation Record", url: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=1200&q=80" },
    { id: 4, name: "Cold War Era Control Room", url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80" },
    { id: 5, name: "Search and Rescue Area Vibe", url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80" },
  ];

  // ভয়েস-ওভার লিংক (যদি সিলেক্টেড আইডিয়াতে না থাকে তবে ডিফল্ট ট্রু ক্রাইম ভয়েস লিংক ব্যবহার হবে)
  const audioSrc = selectedIdea?.audioUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

  return (
    <div className="editor-container">
      <button className="btn-back" onClick={() => router.push("/production")}>
        ← Back to Production Studio
      </button>

      <div className="page-header">
        <span className="eyebrow">RESOURCE PREPARATION STUDIO</span>
        <h1>Asset & Voice Collector 🎙️📸</h1>
        <p>আপনার ট্রু ক্রাইম শর্টসের জন্য প্রয়োজনীয় ভয়েস-ওভার এবং পর্যাপ্ত রিয়েল ইমেজ অ্যাসেটগুলো নিচে দেওয়া হলো।</p>
      </div>

      {selectedIdea && (
        <div className="active-project-box">
          <span>Active Project:</span>
          <strong>{selectedIdea.title}</strong>
        </div>
      )}

      {/* Voice-Over Audio Download Card */}
      <div className="resource-card">
        <h3>1. Voice-Over Audio (.mp3)</h3>
        <p className="card-desc">স্ক্রিপ্টের জন্য জেনারেট হওয়া ন্যারেশন ভয়েস-ওভার ফাইল:</p>
        
        <div className="audio-player-box">
          <audio controls src={audioSrc} className="audio-element" />
          <a href={audioSrc} download="True_Crime_Voiceover.mp3" className="btn-download">
            📥 Download Voice-Over (MP3)
          </a>
        </div>
      </div>

      {/* Realistic Visual Assets Download Card */}
      <div className="resource-card">
        <h3>2. Realistic Story Assets & Archival Images ({storyAssets.length} Images)</h3>
        <p className="card-desc">ভিডিও এডিটিংয়ের জন্য প্রয়োজনীয় সব রিয়ালিস্টিক ছবি একসাথে:</p>

        <div className="assets-grid">
          {storyAssets.map((asset) => (
            <div key={asset.id} className="asset-item">
              <img src={asset.url} alt={asset.name} className="asset-img" />
              <span className="asset-title">{asset.name}</span>
              <a href={asset.url} target="_blank" rel="noopener noreferrer" download className="btn-download-sm">
                ⬇️ Download Image
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="action-buttons">
        <button className="btn-proceed" onClick={() => router.push("/production")}>
          Finish & Go to Publishing →
        </button>
      </div>

      <style jsx>{`
        .editor-container { display: flex; flex-direction: column; gap: 16px; padding-bottom: 30px; }
        .btn-back { background: transparent; border: none; color: #3298ff; font-size: 11px; cursor: pointer; width: fit-content; padding: 0; }
        .eyebrow { color: #25d8e8; font-size: 10px; letter-spacing: 1.5px; font-weight: 800; }
        .page-header h1 { font-size: 20px; margin: 4px 0; }
        .page-header p { color: #8da2bb; font-size: 12px; margin: 0; }
        
        .active-project-box { padding: 12px; background: rgba(37, 216, 232, 0.08); border: 1px solid rgba(37, 216, 232, 0.2); border-radius: 10px; font-size: 12px; color: #25d8e8; display: flex; gap: 6px; }
        
        .resource-card { background: rgba(15, 27, 44, 0.8); border: 1px solid rgba(112, 165, 220, 0.2); padding: 16px; border-radius: 14px; display: flex; flex-direction: column; gap: 10px; }
        .resource-card h3 { font-size: 14px; margin: 0; color: #38bdf8; }
        .card-desc { font-size: 11px; color: #8da2bb; margin: 0; }

        .audio-player-box { display: flex; flex-direction: column; gap: 10px; margin-top: 6px; }
        .audio-element { width: 100%; height: 36px; }

        .btn-download { background: #2563eb; color: #ffffff; border: none; padding: 10px 14px; border-radius: 8px; font-size: 12px; font-weight: bold; cursor: pointer; text-decoration: none; text-align: center; }
        .btn-download:hover { background: #1d4ed8; }

        .assets-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-top: 8px; }
        .asset-item { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); padding: 8px; border-radius: 8px; display: flex; flex-direction: column; gap: 6px; align-items: center; }
        .asset-img { width: 100%; height: 140px; object-fit: cover; border-radius: 6px; }
        .asset-title { font-size: 10px; color: #cbd5e1; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; }
        .btn-download-sm { background: rgba(37, 216, 232, 0.15); color: #25d8e8; border: 1px solid rgba(37, 216, 232, 0.3); padding: 6px 10px; border-radius: 6px; font-size: 10px; font-weight: bold; text-decoration: none; text-align: center; width: 100%; box-sizing: border-box; }

        .action-buttons { display: flex; margin-top: 8px; }
        .btn-proceed { background: rgba(50, 152, 255, 0.15); color: #52b5ff; border: 1px solid rgba(50, 152, 255, 0.3); padding: 12px; border-radius: 8px; font-size: 12px; font-weight: bold; cursor: pointer; width: 100%; }

        .page-loading { text-align: center; color: #8da2bb; font-size: 11px; padding: 40px; }
        .spinner { width: 24px; height: 24px; border: 2px solid rgba(82, 144, 201, 0.22); border-top-color: #25d8e8; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 10px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
