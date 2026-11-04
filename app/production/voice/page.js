"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function VoiceStudioPage() {
  const router = useRouter();
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [scriptText, setScriptText] = useState("");
  const [generatingVoice, setGeneratingVoice] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initVoiceStudio() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      const savedIdea = localStorage.getItem("selected_idea");
      if (savedIdea) {
        const parsed = JSON.parse(savedIdea);
        setSelectedIdea(parsed);
        if (parsed.script) {
          setScriptText(parsed.script);
        }
        if (parsed.audioUrl) {
          setAudioUrl(parsed.audioUrl);
        }
      }
      setLoading(false);
    }
    initVoiceStudio();
  }, [router]);

  const handleGenerateCartesiaVoice = async () => {
    if (!scriptText) {
      alert("No script found! Please generate a script in Script Studio first.");
      return;
    }

    setGeneratingVoice(true);
    try {
      const res = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: scriptText })
      });

      const data = await res.json();
      if (data.success) {
        setAudioUrl(data.audioUrl);
        const updatedIdea = { ...selectedIdea, script: scriptText, audioUrl: data.audioUrl };
        localStorage.setItem("selected_idea", JSON.stringify(updatedIdea));
      } else {
        alert("Error generating Cartesia voiceover: " + data.error);
      }
    } catch (err) {
      alert("Network error: " + err.message);
    } finally {
      setGeneratingVoice(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Loading Voice Studio...</p>
      </div>
    );
  }

  return (
    <div className="voice-container">
      <button className="btn-back" onClick={() => router.push("/production/script")}>
        ← Back to Script Studio
      </button>

      <div className="page-header">
        <span className="eyebrow">CARTESIA AI VOICE ENGINE</span>
        <h1>Voice Studio 🎙️</h1>
        <p>Synthesize ultra-realistic deep true-crime narration using Cartesia AI Sonic.</p>
      </div>

      {selectedIdea && (
        <div className="active-idea-card">
          <span>Active Project:</span>
          <strong>{selectedIdea.title}</strong>
        </div>
      )}

      <div className="input-section">
        <label>Script to Synthesize:</label>
        <textarea 
          value={scriptText} 
          onChange={(e) => setScriptText(e.target.value)}
          rows={8}
          className="script-textarea"
        />
      </div>

      <button className="btn-generate" onClick={handleGenerateCartesiaVoice} disabled={generatingVoice}>
        {generatingVoice ? "Cartesia AI is synthesizing narration..." : "🔊 Generate Cartesia AI Voiceover"}
      </button>

      {audioUrl && (
        <div className="audio-output-box">
          <h3>Cartesia Narration Audio Ready 🎉</h3>
          <audio controls src={audioUrl} style={{ width: "100%", marginTop: "8px" }} />
          
          <div className="action-buttons">
            <button className="btn-proceed" onClick={() => router.push("/production/editor")}>
              Proceed to AI Editor →
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .voice-container { display: flex; flex-direction: column; gap: 16px; padding-bottom: 30px; }
        .btn-back { background: transparent; border: none; color: #3298ff; font-size: 11px; cursor: pointer; width: fit-content; padding: 0; }
        .eyebrow { color: #52b5ff; font-size: 10px; letter-spacing: 1.5px; font-weight: 800; }
        .page-header h1 { font-size: 24px; margin: 4px 0; }
        .page-header p { color: #8da2bb; font-size: 12px; margin: 0; }
        .active-idea-card { padding: 12px; background: rgba(37, 216, 232, 0.08); border: 1px solid rgba(37, 216, 232, 0.2); border-radius: 10px; font-size: 11px; display: flex; flex-direction: column; gap: 2px; color: #25d8e8; }
        .input-section { display: flex; flex-direction: column; gap: 6px; }
        .input-section label { font-size: 11px; color: #8da2bb; font-weight: bold; }
        .script-textarea { width: 100%; background: #07111e; color: #fff; border: 1px solid rgba(112, 165, 220, 0.3); border-radius: 8px; padding: 12px; font-size: 12px; font-family: monospace; resize: vertical; }
        .btn-generate { background: #25d8e8; color: #07111e; border: none; padding: 12px; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 12px; }
        .audio-output-box { display: flex; flex-direction: column; gap: 10px; background: rgba(15, 27, 44, 0.7); border: 1px solid rgba(112, 165, 220, 0.16); padding: 16px; border-radius: 12px; }
        .audio-output-box h3 { font-size: 13px; color: #45dfaa; margin: 0; }
        .action-buttons { display: flex; justify-content: flex-end; margin-top: 4px; }
        .btn-proceed { background: rgba(50, 152, 255, 0.2); color: #52b5ff; border: 1px solid rgba(50, 152, 255, 0.4); padding: 8px 14px; border-radius: 8px; font-size: 11px; font-weight: bold; cursor: pointer; }
        .page-loading { text-align: center; color: #8da2bb; font-size: 11px; padding: 30px; }
        .spinner { width: 24px; height: 24px; border: 2px solid rgba(82, 144, 201, 0.22); border-top-color: #25d8e8; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 10px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
