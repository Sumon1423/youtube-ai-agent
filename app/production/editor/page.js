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

  // ডেমো বা স্ক্রিপ্ট থেকে পাওয়া ছবিগুলো
  const sampleAssets = selectedIdea?.assets || [
    { id: 1, name: "Crime Scene Archival Photo 1", url: "https://picsum.photos/800/1400?random=1" },
    { id: 2, name: "Suspect Investigation Record", url: "https://picsum.photos/800/1400?random=2" },
    { id: 3, name: "Evidence Log & Location Map", url: "https://picsum.photos/800/1400?random=3" },
  ];

  return (
    <div className="editor-container">
      <button className="btn-back" onClick={() => router.push("/production")}>
        ← Back to Production Studio
      </button>

      <div className="page-header">
        <span className="eyebrow">RESOURCE PREPARATION STUDIO</span>
        <h1>Asset & Voice Collector 🎙️📸</h1>
        <p>আপনার ট্রু ক্রাইম শর্টসের জন্য ভয়েস-ওভার এবং রিয়েল ইমেজ অ্যাসেটগুলো ডাউনলোড করে ম্যানুয়ালি এডিট করুন।</p>
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
        
        {selectedIdea?.audioUrl ? (
          <div className="audio-player-box">
            <audio controls src={selectedIdea.audioUrl} className="audio-element" />
            <a href={selectedIdea.audioUrl} download={`${selectedIdea.title || 'voiceover'}.mp3`} className="btn-download">
              📥 Download Voice-Over (MP3)
            </a>
          </div>
        ) : (
          <div className="no-audio-box">
            <p>⚠️ ভয়েস-ওভার লিংক পাওয়া যায়নি। সরাসরি কাস্টম অডিও ডাউনলোড করুন:</p>
            <a href="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" download="Crime_Voiceover.mp3" className="btn-download">
              📥 Download Generated Voice-Over (MP3)
            </a>
          </div>
        )}
      </div>

      {/* Realistic Visual Assets Download Card */}
      <div className="resource-card">
        <h3>2. Realistic Story Assets & Archival Images</h3>
        <p className="card-desc">কাহিনীর সাথে সামঞ্জস্যপূর্ণ সংগৃহীত রিয়ালিস্টিক ছবিগুলো সেভ করে নিন:</p>

        <div className="assets-grid">
          {sampleAssets.map((asset, index) => (
            <div key={index} className="asset-item">
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

        .audio-player-box, .no-audio-box { display: flex; flex-direction: column; gap: 10px; margin-top: 6px; }
        .audio-element { width: 100%; height: 36px; }
        .no-audio-box p { font-size: 11px; color: #f59e0b; margin: 0; }

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
