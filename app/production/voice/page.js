"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function VoiceStudioPage() {
  const router = useRouter();
  const [selectedVoice, setSelectedVoice] = useState("Marcus (Deep True Crime Narrator)");
  const [generating, setGenerating] = useState(false);
  const [audioResult, setAudioResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const voices = [
    { id: 1, name: "Marcus (Deep True Crime Narrator)", accent: "American (US)", tone: "Gritty, Suspenseful" },
    { id: 2, name: "Elena (Documentary Lead)", accent: "American (US)", tone: "Calm, Authoritative" },
    { id: 3, name: "Arthur (Historical Archives)", accent: "British / US Blend", tone: "Analytical, Mysterious" }
  ];

  useEffect(() => {
    async function checkAuth() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/login");
        return;
      }
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  const handleGenerateVoice = () => {
    setGenerating(true);
    setAudioResult(null);

    setTimeout(() => {
      setAudioResult({
        fileName: "narration_output_v1.mp3",
        duration: "0:48",
        voiceUsed: selectedVoice,
        status: "Rendered Successfully"
      });
      setGenerating(false);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Voice Studio লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="voice-container">
      <button className="btn-back" onClick={() => router.push("/production")}>
        ← Back to Production Studio
      </button>

      <div className="page-header">
        <span className="eyebrow">AI NAR_RATION ENGINE</span>
        <h1>Voice Studio 🎙️</h1>
        <p>Generate realistic American English voiceover profiles for your Shorts.</p>
      </div>

      <div className="voice-selection-box">
        <h3>Select AI Voice Profile</h3>
        <div className="voices-grid">
          {voices.map((v) => (
            <div
              key={v.id}
              className={`voice-card ${selectedVoice === v.name ? "active" : ""}`}
              onClick={() => setSelectedVoice(v.name)}
            >
              <strong>{v.name}</strong>
              <span>Accent: {v.accent}</span>
              <span className="tone">Tone: {v.tone}</span>
            </div>
          ))}
        </div>
      </div>

      <button className="btn-generate" onClick={handleGenerateVoice} disabled={generating}>
        {generating ? "Synthesizing Audio..." : "🎙️ Generate Voiceover Audio"}
      </button>

      {audioResult && (
        <div className="audio-result-card">
          <h3>Generated Audio Track</h3>
          <div className="audio-details">
            <p><strong>File:</strong> {audioResult.fileName}</p>
            <p><strong>Duration:</strong> {audioResult.duration}</p>
            <p><strong>Voice Profile:</strong> {audioResult.voiceUsed}</p>
            <span className="badge-success">{audioResult.status}</span>
          </div>
        </div>
      )}

      <style jsx>{`
        .voice-container { display: flex; flex-direction: column; gap: 16px; }
        .btn-back { background: transparent; border: none; color: #3298ff; font-size: 11px; cursor: pointer; width: fit-content; padding: 0; }
        .eyebrow { color: #52b5ff; font-size: 10px; letter-spacing: 1.5px; font-weight: 800; }
        .page-header h1 { font-size: 24px; margin: 4px 0; }
        .page-header p { color: #8da2bb; font-size: 12px; margin: 0; }
        .voice-selection-box { display: flex; flex-direction: column; gap: 8px; }
        .voice-selection-box h3 { font-size: 13px; color: #25d8e8; margin: 0; }
        .voices-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; }
        .voice-card { padding: 12px; background: rgba(15, 27, 44, 0.7); border: 1px solid rgba(112, 165, 220, 0.16); border-radius: 10px; cursor: pointer; display: flex; flex-direction: column; gap: 3px; }
        .voice-card:hover, .voice-card.active { border-color: #25d8e8; background: rgba(37, 216, 232, 0.08); }
        .voice-card strong { font-size: 11px; color: #edf6ff; }
        .voice-card span { font-size: 10px; color: #8da2bb; }
        .tone { color: #52b5ff !important; }
        .btn-generate { background: #25d8e8; color: #07111e; border: none; padding: 12px; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 12px; }
        .audio-result-card { padding: 16px; background: rgba(15, 27, 44, 0.7); border: 1px solid rgba(112, 165, 220, 0.16); border-radius: 12px; display: flex; flex-direction: column; gap: 8px; }
        .audio-result-card h3 { font-size: 13px; color: #45dfaa; margin: 0; }
        .audio-details { display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: #aab7c8; }
        .badge-success { background: rgba(69, 223, 170, 0.15); color: #45dfaa; padding: 3px 8px; border-radius: 6px; font-size: 9px; font-weight: bold; width: fit-content; margin-top: 4px; }
        .page-loading { text-align: center; color: #8da2bb; font-size: 11px; padding: 30px; }
        .spinner { width: 24px; height: 24px; border: 2px solid rgba(82, 144, 201, 0.22); border-top-color: #25d8e8; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 10px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
