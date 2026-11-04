"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function ScriptStudioPage() {
  const router = useRouter();
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [scriptContent, setScriptContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [consoleLogs, setConsoleLogs] = useState([]);

  // রোমাঞ্চকর ও কুল টার্মিনাল লগস
  const hackerLogs = [
    "Establishing secure socket to Gemini AI Core...",
    "Injecting US True Crime narrative parameters...",
    "Optimizing retention hooks for first 3 seconds...",
    "Synthesizing high-tension cinematic B-Roll cues...",
    "Finalizing script structure & compiling output..."
  ];

  useEffect(() => {
    async function initScriptStudio() {
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
          setScriptContent(parsed.script);
        }
      }
      setLoading(false);
    }
    initScriptStudio();
  }, [router]);

  // রিয়েল-টাইম টার্মিনাল লগ প্রিন্টিং এফেক্ট
  useEffect(() => {
    let timer;
    if (generating) {
      setConsoleLogs([]);
      let index = 0;
      timer = setInterval(() => {
        if (index < hackerLogs.length) {
          setConsoleLogs((prev) => [...prev, hackerLogs[index]]);
          index++;
        }
      }, 600);
    }
    return () => clearInterval(timer);
  }, [generating]);

  const handleGenerateGeminiScript = async () => {
    if (!selectedIdea) {
      alert("No active idea selected! Please select an idea first.");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: selectedIdea.title })
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textError = await res.text();
        throw new Error(`Server returned non-JSON response (${res.status}). Please check API route path.`);
      }

      const data = await res.json();
      if (data.success) {
        setScriptContent(data.script);
        const updatedIdea = { ...selectedIdea, script: data.script };
        localStorage.setItem("selected_idea", JSON.stringify(updatedIdea));
      } else {
        alert("Error generating script: " + data.error);
      }
    } catch (err) {
      alert("Network / API Error: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Loading Script Studio...</p>
      </div>
    );
  }

  return (
    <div className="script-container">
      <button className="btn-back" onClick={() => router.push("/production")}>
        ← Back to Production Studio
      </button>

      <div className="page-header">
        <span className="eyebrow">GEMINI AI SCRIPT ENGINE</span>
        <h1>Script Studio ✍️</h1>
        <p>Generate high-retention US True Crime scripts powered by Google Gemini AI.</p>
      </div>

      {selectedIdea && (
        <div className="active-idea-card">
          <span>Selected Topic:</span>
          <strong>{selectedIdea.title}</strong>
        </div>
      )}

      <button className="btn-generate" onClick={handleGenerateGeminiScript} disabled={generating}>
        {generating ? "AI Engine Running..." : "🤖 Generate Script with Gemini AI"}
      </button>

      {/* আকর্ষণীয় সাইবারপাঙ্ক টার্মিনাল লগ ভিউ */}
      {generating && (
        <div className="terminal-box">
          <div className="terminal-header">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
            <span className="terminal-title">ai-core-stream@creatoros:~</span>
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

      {scriptContent && !generating && (
        <div className="script-output-box">
          <h3>Generated Script & Visual Cues:</h3>
          <textarea 
            value={scriptContent} 
            onChange={(e) => setScriptContent(e.target.value)}
            rows={12}
            className="script-textarea"
          />
          <div className="action-buttons">
            <button className="btn-proceed" onClick={() => router.push("/production/voice")}>
              Proceed to Voice Studio →
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .script-container { display: flex; flex-direction: column; gap: 16px; padding-bottom: 30px; }
        .btn-back { background: transparent; border: none; color: #3298ff; font-size: 11px; cursor: pointer; width: fit-content; padding: 0; }
        .eyebrow { color: #52b5ff; font-size: 10px; letter-spacing: 1.5px; font-weight: 800; }
        .page-header h1 { font-size: 24px; margin: 4px 0; }
        .page-header p { color: #8da2bb; font-size: 12px; margin: 0; }
        .active-idea-card { padding: 12px; background: rgba(37, 216, 232, 0.08); border: 1px solid rgba(37, 216, 232, 0.2); border-radius: 10px; font-size: 11px; display: flex; flex-direction: column; gap: 2px; color: #25d8e8; }
        .btn-generate { background: #25d8e8; color: #07111e; border: none; padding: 12px; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 12px; transition: opacity 0.2s; }
        .btn-generate:disabled { opacity: 0.6; cursor: not-allowed; }
        
        /* টার্মিনাল স্টাইল বক্স ডিজাইন */
        .terminal-box { background: #030812; border: 1px solid rgba(37, 216, 232, 0.4); border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.5); font-family: monospace; }
        .terminal-header { background: #0b162c; padding: 8px 12px; display: flex; align-items: center; gap: 6px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .dot { width: 9px; height: 9px; border-radius: 50%; }
        .red { background: #ff5f56; }
        .yellow { background: #ffbd2e; }
        .green { background: #27c93f; }
        .terminal-title { font-size: 10px; color: #8da2bb; margin-left: 6px; }
        .terminal-body { padding: 12px; display: flex; flex-direction: column; gap: 6px; min-height: 100px; }
        .terminal-line { font-size: 11px; color: #45dfaa; display: flex; gap: 6px; animation: fadeIn 0.3s ease-in-out; }
        .prompt-symbol { color: #25d8e8; font-weight: bold; }
        .cursor-blink { font-size: 12px; color: #25d8e8; animation: blink 1s infinite; width: fit-content; }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }

        .script-output-box { display: flex; flex-direction: column; gap: 10px; background: rgba(15, 27, 44, 0.7); border: 1px solid rgba(112, 165, 220, 0.16); padding: 16px; border-radius: 12px; }
        .script-output-box h3 { font-size: 13px; color: #45dfaa; margin: 0; }
        .script-textarea { width: 100%; background: #07111e; color: #fff; border: 1px solid rgba(112, 165, 220, 0.3); border-radius: 8px; padding: 12px; font-size: 12px; font-family: monospace; resize: vertical; }
        .action-buttons { display: flex; justify-content: flex-end; margin-top: 4px; }
        .btn-proceed { background: rgba(50, 152, 255, 0.2); color: #52b5ff; border: 1px solid rgba(50, 152, 255, 0.4); padding: 8px 14px; border-radius: 8px; font-size: 11px; font-weight: bold; cursor: pointer; }
        .page-loading { text-align: center; color: #8da2bb; font-size: 11px; padding: 30px; }
        .spinner { width: 24px; height: 24px; border: 2px solid rgba(82, 144, 201, 0.22); border-top-color: #25d8e8; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 10px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
