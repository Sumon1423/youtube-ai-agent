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

  const handleGenerateRealScript = async () => {
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

      const data = await res.json();
      if (data.success) {
        setScriptContent(data.script);
        const updatedIdea = { ...selectedIdea, script: data.script };
        localStorage.setItem("selected_idea", JSON.stringify(updatedIdea));
      } else {
        alert("Error generating script: " + data.error);
      }
    } catch (err) {
      alert("Network error: " + err.message);
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
        <span className="eyebrow">REAL AI SCRIPT ENGINE</span>
        <h1>Script Studio ✍️</h1>
        <p>Generate high-retention US True Crime scripts powered by live AI.</p>
      </div>

      {selectedIdea && (
        <div className="active-idea-card">
          <span>Selected Topic:</span>
          <strong>{selectedIdea.title}</strong>
        </div>
      )}

      <button className="btn-generate" onClick={handleGenerateRealScript} disabled={generating}>
        {generating ? "AI is writing viral script..." : "🤖 Generate Real AI Script"}
      </button>

      {scriptContent && (
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
        .btn-generate { background: #25d8e8; color: #07111e; border: none; padding: 12px; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 12px; }
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
