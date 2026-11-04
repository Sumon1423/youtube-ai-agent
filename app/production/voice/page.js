"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function VoiceStudioPage() {
  const router = useRouter();
  const [scriptData, setScriptData] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("en-US-ChristopherNeural");
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [consoleLogs, setConsoleLogs] = useState([]);

  const voiceLogs = [
    "Connecting to Edge TTS Neural Engine...",
    "Configuring deep cinematic True Crime tone...",
    "Synthesizing high-quality natural audio...",
    "Finalizing MP3 voice-over package..."
  ];

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
        if (parsed.script) {
          setScriptData(parsed.script);
        }
      }
      setLoading(false);
    }
    initVoiceStudio();
  }, [router]);

  useEffect(() => {
    let timer;
    if (generating) {
      setConsoleLogs([]);
      let index = 0;
      timer = setInterval(() => {
        if (index < voiceLogs.length) {
          setConsoleLogs((prev) => [...prev, voiceLogs[index]]);
          index++;
        }
      }, 700);
    }
    return () => clearInterval(timer);
  }, [generating]);

  const handleGenerateVoice = async () => {
    if (!scriptData) {
      alert("No script found! Please generate a script first.");
      return;
    }

    setGenerating(true);
    setAudioUrl("");

    try {
      const res = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: scriptData, voiceId: selectedVoice })
      });

      const data = await res.json();

      if (data.success) {
        setAudioUrl(data.audio);
      } else {
        alert("Voice Generation Error: " + data.error);
      }
    } catch (err) {
      alert("Network Error: " + err.message);
    } finally {
      setGenerating(false);
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
        <span className="eyebrow">MICROSOFT EDGE NEURAL ENGINE</span>
        <h1>Voice Studio 🎙️</h1>
        <p>Convert your True Crime scripts into ultra-realistic free AI voice-overs.</p>
      </div>

      <div className="control-panel">
        <label>Select Narrator Voice:</label>
        <select 
          value={selectedVoice} 
          onChange={(e) => setSelectedVoice(e.target.value)}
          className="voice-select"
        >
          <option value="en-US-ChristopherNeural">Christopher (Deep & Suspenseful Male)</option>
          <option value="en-US-GuyNeural">Guy (Professional Narrator)</option>
          <option value="en-US-SteffanNeural">Steffan (Cinematic Dark Voice)</option>
          <option value="en-US-AriaNeural">Aria (Expressive Dynamic Voice)</option>
        </select>
      </div>

      <button className="btn-generate" onClick={handleGenerateVoice} disabled={generating}>
        {generating ? "Synthesizing Audio..." : "🔊 Generate Voice-Over with Edge TTS"}
      </button>

      {generating && (
        <div className="terminal-box">
          <div className="terminal-header">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
            <span className="terminal-title">edge-tts@creatoros:~</span>
          </div>
          <div className="terminal-body">
            {consoleLogs.map((log, idx) => (
              <div key={idx} className="terminal-line">
                <span className="prompt-symbol">&gt;</span> {log}
              </div>
            ))}
            <div className="cursor-blink">_</div>
          </div>
        </div>
      )}

      {audioUrl && !generating && (
        <div className="audio-output-box">
          <h3>Generated Voice-Over Audio:</h3>
          <audio controls src={audioUrl} className="audio-player" />
          <div className="action-buttons">
            <a href={audioUrl} download="true-crime-voiceover.mp3" className="btn-download">
              ⬇ Download MP3
            </a>
            <button className="btn-proceed" onClick={() => router.push("/production/editor")}>
              Proceed to AI Video Editor →
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
        .control-panel { display: flex; flex-direction: column; gap: 6px; background: rgba(15, 27, 44, 0.7); border: 1px solid rgba(112, 165, 220, 0.16); padding: 14px; border-radius: 10px; }
        .control-panel label { font-size: 11px; color: #8da2bb; }
        .voice-select { background: #07111e; color: #fff; border: 1px solid rgba(112, 165, 220, 0.3); border-radius: 8px; padding: 10px; font-size: 12px; }
        .btn-generate { background: #25d8e8; color: #07111e; border: none; padding: 12px; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 12px; transition: opacity 0.2s; }
        .btn-generate:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .terminal-box { background: #030812; border: 1px solid rgba(37, 216, 232, 0.4); border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.5); font-family: monospace; }
        .terminal-header { background: #0b162c; padding: 8px 12px; display: flex; align-items: center; gap: 6px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .dot { width: 9px; height: 9px; border-radius: 50%; }
        .red { background: #ff5f56; }
        .yellow { background: #ffbd2e; }
        .green { background: #27c93f; }
        .terminal-title { font-size: 10px; color: #8da2bb; margin-left: 6px; }
        .terminal-body { padding: 12px; display: flex; flex-direction: column; gap: 6px; min-height: 100px; }
        .terminal-line { font-size: 11px; color: #45dfaa; display: flex; gap: 6px; }
        .prompt-symbol { color: #25d8e8; font-weight: bold; }
        .cursor-blink { font-size: 12px; color: #25d8e8; animation: blink 1s infinite; width: fit-content; }
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }

        .audio-output-box { display: flex; flex-direction: column; gap: 12px; background: rgba(15, 27, 44, 0.7); border: 1px solid rgba(112, 165, 220, 0.16); padding: 16px; border-radius: 12px; }
        .audio-output-box h3 { font-size: 13px; color: #45dfaa; margin: 0; }
        .audio-player { width: 100%; border-radius: 8px; }
        .action-buttons { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
        .btn-download { background: rgba(37, 216, 232, 0.2); color: #25d8e8; border: 1px solid rgba(37, 216, 232, 0.4); padding: 8px 14px; border-radius: 8px; font-size: 11px; font-weight: bold; text-decoration: none; }
        .btn-proceed { background: rgba(50, 152, 255, 0.2); color: #52b5ff; border: 1px solid rgba(50, 152, 255, 0.4); padding: 8px 14px; border-radius: 8px; font-size: 11px; font-weight: bold; cursor: pointer; }
        .page-loading { text-align: center; color: #8da2bb; font-size: 11px; padding: 30px; }
        .spinner { width: 24px; height: 24px; border: 2px solid rgba(82, 144, 201, 0.22); border-top-color: #25d8e8; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 10px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
