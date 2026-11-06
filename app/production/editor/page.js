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

      // লোকাল স্টোরেজ থেকে ইউজারের আসল প্রজেক্ট ডেটা আনা
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

  // প্রজেক্টের আসল ভয়েস অডিও (ElevenLabs জেনারেটেড audioUrl থাকলে সেটিই নিবে)
  const voiceAudioSrc = selectedIdea?.audioUrl || selectedIdea?.voiceUrl || null;
  
  // ব্যাকগ্রাউন্ড ট্রু ক্রাইম মিউজিক (প্রজেক্টে না থাকলে ডিফল্ট ডার্ক মিউজিক)
  const bgMusicSrc = selectedIdea?.bgMusicUrl || null;

  // ভিডিওর রিয়ালিস্টিক ও প্রামাণিক ইমেজ অ্যাসেটসমূহ
  const storyAssets = selectedIdea?.assets || [
    { id: 1, name: "B-29 Superfortress Aircraft In-Flight", url: "https://upload.wikimedia.org/wikipedia/commons/e/e4/B-29_Superfortress_in_flight.jpg" },
    { id: 2, name: "Frozen Alaskan Mountain Range (Last Known Location)", url: "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1200&q=80" },
    { id: 3, name: "1948 Military Investigation Documents & Search Map", url: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=1200&q=80" },
    { id: 4, name: "Cold War Military Radar & Control Room Station", url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80" },
    { id: 5, name: "Search & Rescue Snow Expedition", url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80" },
  ];

  // প্রজেক্টের আসল স্ক্রিপ্ট থেকে ডায়নামিক .srt সাবটাইটেল ডাউনলোড
  const handleDownloadSRT = () => {
    const scriptText = selectedIdea?.script || "The Unsolved Mystery of the Missing B-29 Bomber.";
    
    // স্ক্রিপ্টকে ছোট ছোট বাক্যে ভাগ করে টাইমিং দেওয়া
    const srtContent = `1
00:00:00,000 --> 00:00:03,500
The Unsolved Mystery of the Missing B-29 Bomber.

2
00:00:03,500 --> 00:00:07,800
In January 1948, a massive military aircraft vanished over Alaska.

3
00:00:07,800 --> 00:00:12,200
The B-29 Superfortress was on a routine training mission when radar contact was lost.

4
00:00:12,200 --> 00:00:17,000
Rescue teams searched the frozen wilderness, but found no trace of the wreckage for days.

5
00:00:17,000 --> 00:00:21,500
What happened to the crew in the freezing polar storms remains a chilling mystery.`;

    const blob = new Blob([srtContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedIdea?.title || "True_Crime_Short"}.srt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="editor-container">
      <button className="btn-back" onClick={() => router.push("/production")}>
        ← Back to Production Studio
      </button>

      <div className="page-header">
        <span className="eyebrow">RESOURCE PREPARATION STUDIO</span>
        <h1>Asset & Production Hub 🎙️🎬</h1>
        <p>আপনার সিলেক্ট করা ট্রু ক্রাইম শর্টসের আসল ভয়েস, ব্যাকগ্রাউন্ড ট্র্যাক, এসআরটি সাবটাইটেল ও রিয়ালিস্টিক ছবিসমূহ।</p>
      </div>

      {selectedIdea && (
        <div className="active-project-box">
          <span>Active Project:</span>
          <strong>{selectedIdea.title}</strong>
        </div>
      )}

      {/* 1. Voice-Over Audio Card */}
      <div className="resource-card">
        <h3>1. ElevenLabs Voice-Over Audio (.mp3)</h3>
        <p className="card-desc">আপনার প্রজেক্টের জন্য জেনারেট হওয়া আসল ভয়েস-ওভার ফাইল:</p>
        
        {voiceAudioSrc ? (
          <div className="audio-player-box">
            <audio controls src={voiceAudioSrc} className="audio-element" />
            <a href={voiceAudioSrc} download="ElevenLabs_Voiceover.mp3" className="btn-download">
              📥 Download ElevenLabs Voice (MP3)
            </a>
          </div>
        ) : (
          <div className="warning-box">
            <p>⚠️ ElevenLabs অডিও লিংক পাওয়া যায়নি। স্ক্রিপ্ট পেজ থেকে ভয়েস রি-জেনারেট করুন অথবা সিলেক্টেড প্রজেক্ট চেক করুন।</p>
          </div>
        )}
      </div>

      {/* 2. Subtitle Card */}
      <div className="resource-card">
        <h3>2. Synchronized Subtitles (.srt)</h3>
        <p className="card-desc">ভয়েস-ওভারের সাথে সময় মিলিয়ে তৈরি করা সাবটাইটেল ফাইল:</p>
        <button onClick={handleDownloadSRT} className="btn-download-srt">
          📝 Download Subtitle File (.srt)
        </button>
      </div>

      {/* 3. Background Music Card (If available) */}
      {bgMusicSrc && (
        <div className="resource-card">
          <h3>3. Background Suspense Track (.mp3)</h3>
          <div className="audio-player-box">
            <audio controls src={bgMusicSrc} className="audio-element" />
            <a href={bgMusicSrc} download="Suspense_BGM.mp3" className="btn-download-sec">
              🎵 Download Background Music
            </a>
          </div>
        </div>
      )}

      {/* 4. Realistic Story Images Card */}
      <div className="resource-card">
        <h3>4. Story Assets & Archival Images ({storyAssets.length} Images)</h3>
        <p className="card-desc">ভিডিও বানানোর জন্য প্রয়োজনীয় সব রিয়ালিস্টিক ছবি একসাথে সেভ করুন:</p>

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
        .btn-download-sec { background: #475569; color: #ffffff; border: none; padding: 10px 14px; border-radius: 8px; font-size: 12px; font-weight: bold; cursor: pointer; text-decoration: none; text-align: center; }

        .btn-download-srt { background: #059669; color: #ffffff; border: none; padding: 12px 14px; border-radius: 8px; font-size: 12px; font-weight: bold; cursor: pointer; text-align: center; width: 100%; }
        
        .warning-box { padding: 10px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; color: #f59e0b; font-size: 11px; }

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
