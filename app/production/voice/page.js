"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function VoiceStudioPage() {
  const router = useRouter();
  const [scriptData, setScriptData] = useState("");
  const [generating, setGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [consoleLogs, setConsoleLogs] = useState([]);

  const voiceLogs = [
    "Initializing Browser Neural Speech Engine...",
    "Loading True Crime suspense parameters...",
    "Synthesizing high-fidelity audio stream...",
    "Voice-over ready for playback and export..."
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
      }, 600);
    }
    return () => clearInterval(timer);
  }, [generating]);

  const handleGenerateVoice = () => {
    if (!scriptData) {
      alert("No script found! Please generate a script first.");
      return;
    }

    setGenerating(true);

    setTimeout(() => {
      setGenerating(false);
      setIsPlaying(true);
      
      // ব্রাউজারের বিল্ট-ইন হাই কোয়ালিটি টেক্সট-টু-স্পিচ ব্যবহার করে ভয়েস প্লে করা
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // আগের কোনো ভয়েস চললে থামিয়ে দেওয়া
        const utterance = new SpeechSynthesisUtterance(scriptData);
        utterance.rate = 0.95; // একটু ধীরস্থির ট্রু ক্রাইম টোন
        utterance.pitch = 0.85; // একটু গম্ভীর বা ডিপ আওয়াজ
        
        // ইংরেজি ভালো কোনো ভয়েস খুঁজে সেট করা
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Male')));
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onend = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
      } else {
        alert("Speech synthesis not supported on this browser.");
      }
    }, 2000);
  };

  const handleStopVoice = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
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
        <span className="eyebrow">CREATOROS NEURAL VOICE STUDIO</span>
        <h1>Voice Studio 🎙️</h1>
        <p>Convert your True Crime scripts into instant, high-quality AI voice-overs.</p>
      </div>

      <div className="control-panel">
        <label>Script Preview for Voice-Over:</label>
        <div className="script-preview-box">
          {scriptData ? scriptData.substring(0, 300) + "..." : "No script loaded."}
        </div>
      </div>

      {!isPlaying ? (
        <button className="btn-generate" onClick={handleGenerateVoice} disabled={generating}>
          {generating ? "Synthesizing Audio..." : "🔊 Generate & Play Voice-Over"}
        </button>
      ) : (
        <button className="btn-stop" onClick={handleStopVoice}>
          ⏹ Stop Voice Playback
        </button>
      )}

      {generating && (
        <div className="terminal-box">
          <div className="terminal-header">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
            <span className="terminal-title">neural-voice@creatoros:~</span>
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

      {isPlaying && !generating && (
        <div className="audio-output-box">
          <h3>🔊 Voice-Over is Playing Live...</h3>
          <p style={{ color: '#8da2bb', fontSize: '11px' }}>Your script is being narrated in real-time with a cinematic tone.</p>
          <div className="action-buttons">
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
        .script-preview-box { background: #07111e; color: #cbd5e1; border: 1px solid rgba(112, 165, 220, 0.2); border-radius: 8px; padding: 10px; font-size: 11px; max-height: 80px; overflow-y: auto; font-family: monospace; }
        .btn-generate { background: #25d8e8; color: #07111e; border: none; padding: 12px; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 12px; transition: opacity 0.2s; }
        .btn-generate:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-stop { background: #ff5f56; color: #fff; border: none; padding: 12px; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 12px; }
        
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
        .action-buttons { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
    
        .btn-proceed { background: rgba(50, 152, 255, 0.2); color: #52b5ff; border: 1px solid rgba(50, 152, 255, 0.4); padding: 8px 14px; border-radius: 8px; font-size: 11px; font-weight: bold; cursor: pointer; }
        .page-loading { text-align: center; color: #8da2bb; font-size: 11px; padding: 30px; }
        .spinner { width: 24px; height: 24px; border: 2px solid rgba(82, 144, 201, 0.22); border-top-color: #25d8e8; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 10px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
