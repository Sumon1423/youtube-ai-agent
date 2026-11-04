"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Player } from "@remotion/player";
import { TrueCrimeScene } from "../../../remotion/TrueCrimeScene";
import { supabase } from "../../../lib/supabase";

export default function AIEditorPage() {
  const router = useRouter();
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
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
        const parsed = JSON.parse(savedIdea);
        setSelectedIdea(parsed);
        if (parsed.audioUrl) {
          setAudioUrl(parsed.audioUrl);
        }
      }
      setLoading(false);
    }
    initEditor();
  }, [router]);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>AI Editor লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <button className="btn-back" onClick={() => router.push("/production")}>
        ← Back to Production Studio
      </button>

      <div className="page-header">
        <span className="eyebrow">TRUE CRIME RENDERING ENGINE</span>
        <h1>AI Editor & Live Preview 🎬</h1>
        <p>Preview your compiled US True Crime script, background atmosphere, and voice-over in real-time.</p>
      </div>

      {selectedIdea && (
        <div className="active-project-box">
          <span>Active Production Project:</span>
          <strong>{selectedIdea.title}</strong>
        </div>
      )}

      {/* Remotion Live Player Container */}
      <div className="player-wrapper">
        <div className="player-container">
          <Player
            component={TrueCrimeScene}
            inputProps={{
              scriptText: selectedIdea?.script || "In 1948, a top-secret bomber vanished without a trace...",
              audioUrl: audioUrl || selectedIdea?.audioUrl || ""
            }}
            durationInFrames={1800}
            fps={30}
            compositionWidth={1080}
            compositionHeight={1920}
            style={{
              width: "100%",
              maxWidth: "280px",
              aspectRatio: "9/16",
              borderRadius: "12px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.7)"
            }}
            controls
            autoPlay
            loop
          />
        </div>
        <p className="player-hint">👆 Play/Pause your 60-second vertical True Crime short directly.</p>
      </div>

      <div className="action-buttons">
        <button className="btn-download" onClick={() => alert("Remotion Player থেকে ভিডিও ফ্রেম রেন্ডার ও ডাউনলোড প্রসেস শুরু হচ্ছে!")}>
          📥 Download Final Video (.mp4)
        </button>
        <button className="btn-proceed" onClick={() => router.push("/production")}>
          Proceed to Publishing →
        </button>
      </div>

      <style jsx>{`
        .editor-container { display: flex; flex-direction: column; gap: 16px; padding-bottom: 30px; }
        .btn-back { background: transparent; border: none; color: #3298ff; font-size: 11px; cursor: pointer; width: fit-content; padding: 0; }
        .eyebrow { color: #52b5ff; font-size: 10px; letter-spacing: 1.5px; font-weight: 800; }
        .page-header h1 { font-size: 24px; margin: 4px 0; }
        .page-header p { color: #8da2bb; font-size: 12px; margin: 0; }
        .active-project-box { padding: 10px 14px; background: rgba(37, 216, 232, 0.08); border: 1px solid rgba(37, 216, 232, 0.2); border-radius: 10px; font-size: 11px; display: flex; flex-direction: column; gap: 2px; color: #25d8e8; }
        
        .player-wrapper { display: flex; flex-direction: column; align-items: center; background: rgba(15, 27, 44, 0.7); border: 1px solid rgba(112, 165, 220, 0.16); padding: 20px; border-radius: 12px; gap: 10px; }
        .player-container { display: flex; justify-content: center; width: 100%; }
        .player-hint { font-size: 11px; color: #8da2bb; margin: 0; text-align: center; }

        .action-buttons { display: flex; gap: 10px; margin-top: 4px; }
        .btn-download { background: rgba(69, 223, 170, 0.2); color: #45dfaa; border: 1px solid rgba(69, 223, 170, 0.4); padding: 10px 14px; border-radius: 8px; font-size: 11px; font-weight: bold; cursor: pointer; flex: 1; text-align: center; }
        .btn-proceed { background: rgba(50, 152, 255, 0.2); color: #52b5ff; border: 1px solid rgba(50, 152, 255, 0.4); padding: 10px 14px; border-radius: 8px; font-size: 11px; font-weight: bold; cursor: pointer; flex: 1; text-align: center; }

        .page-loading { text-align: center; color: #8da2bb; font-size: 11px; padding: 30px; }
        .spinner { width: 24px; height: 24px; border: 2px solid rgba(82, 144, 201, 0.22); border-top-color: #25d8e8; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 10px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
