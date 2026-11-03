"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AIEditorPage() {
  const router = useRouter();
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderResult, setRenderResult] = useState(null);
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

  const handleStartTrueCrimeRendering = () => {
    setRendering(true);
    setRenderProgress(20);
    setRenderResult(null);

    setTimeout(() => setRenderProgress(50), 1200);
    setTimeout(() => setRenderProgress(85), 2400);
    setTimeout(() => {
      setRenderProgress(100);
      setRendering(false);
      setRenderResult({
        title: selectedIdea?.title || "The Unsolved Mystery of the Missing B-29 Bomber",
        resolution: "1080x1920 (Vertical US Shorts)",
        duration: "52s",
        fps: "30 FPS",
        voiceProfile: "Marcus (Deep True Crime Narrator)",
        status: "Ready for Publishing"
      });
    }, 3500);
  };

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
        <h1>AI Editor 🎬</h1>
        <p>Synthesizing US True Crime script, archival maps, and deep narration audio.</p>
      </div>

      {selectedIdea && (
        <div className="active-project-box">
          <span>Active Production Project:</span>
          <strong>{selectedIdea.title}</strong>
        </div>
      )}

      <div className="editor-pipeline-box">
        <h3>Pipeline Assembly Checklist</h3>
        <ul className="pipeline-steps">
          <li>✔ 50s+ True Crime Script & Hook Verified</li>
          <li>✔ Marcus (Deep Narrator) Audio Profile Synced</li>
          <li>✔ Vintage Aviation Maps & Classified Overlays Mapped</li>
          <li>✔ Dynamic Subtitles & Sound FX Layered</li>
        </ul>
      </div>

      <button className="btn-render" onClick={handleStartTrueCrimeRendering} disabled={rendering}>
        {rendering ? `Rendering True Crime Short... ${renderProgress}%` : "🚀 Start True Crime Video Assembly"}
      </button>

      {rendering && (
        <div className="progress-bar-container">
          <div className="progress-fill" style={{ width: `${renderProgress}%` }} />
        </div>
      )}

      {renderResult && (
        <div className="render-result-card">
          <h3>True Crime Render Successful! 🎉</h3>
          <div className="render-details">
            <p><strong>Project:</strong> {renderResult.title}</p>
            <p><strong>Resolution:</strong> {renderResult.resolution}</p>
            <p><strong>Duration & Specs:</strong> {renderResult.duration} • {renderResult.fps}</p>
            <p><strong>Voiceover:</strong> {renderResult.voiceProfile}</p>
            <span className="badge-success">{renderResult.status}</span>
          </div>

          <div className="storyboard-preview-box">
            <h4>🎞️ Compiled Scene Timeline (52s):</h4>
            <div className="timeline-scenes">
              <div className="timeline-scene-item">
                <span>0-3s</span> <strong>Hook:</strong> Vintage aviation map & deep bass drop.
              </div>
              <div className="timeline-scene-item">
                <span>4-25s</span> <strong>Body:</strong> Classified military documents & radio static.
              </div>
              <div className="timeline-scene-item">
                <span>26-52s</span> <strong>Climax:</strong> Unsolved disappearance & tense wind FX.
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn-download" onClick={() => alert("Downloading True Crime Shorts package (.mp4 + .srt)...")}>
              📥 Download Video & Subtitles
            </button>
            <button className="btn-proceed" onClick={() => router.push("/production")}>
              Proceed to Publishing →
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .editor-container { display: flex; flex-direction: column; gap: 16px; }
        .btn-back { background: transparent; border: none; color: #3298ff; font-size: 11px; cursor: pointer; width: fit-content; padding: 0; }
        .eyebrow { color: #52b5ff; font-size: 10px; letter-spacing: 1.5px; font-weight: 800; }
        .page-header h1 { font-size: 24px; margin: 4px 0; }
        .page-header p { color: #8da2bb; font-size: 12px; margin: 0; }
        .active-project-box { padding: 10px 14px; background: rgba(37, 216, 232, 0.08); border: 1px solid rgba(37, 216, 232, 0.2); border-radius: 10px; font-size: 11px; display: flex; flex-direction: column; gap: 2px; color: #25d8e8; }
        .editor-pipeline-box { padding: 16px; background: rgba(15, 27, 44, 0.7); border: 1px solid rgba(112, 165, 220, 0.16); border-radius: 12px; display: flex; flex-direction: column; gap: 8px; }
        .editor-pipeline-box h3 { font-size: 13px; color: #25d8e8; margin: 0; }
        .pipeline-steps { margin: 0; padding-left: 16px; font-size: 11px; color: #45dfaa; display: flex; flex-direction: column; gap: 4px; list-style: none; }
        .btn-render { background: #25d8e8; color: #07111e; border: none; padding: 12px; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 12px; }
        .progress-bar-container { width: 100%; height: 8px; background: rgba(15, 27, 44, 0.8); border-radius: 4px; overflow: hidden; border: 1px solid rgba(112, 165, 220, 0.2); }
        .progress-fill { height: 100%; background: #25d8e8; transition: width 0.3s ease; }
        .render-result-card { padding: 16px; background: rgba(15, 27, 44, 0.7); border: 1px solid rgba(112, 165, 220, 0.16); border-radius: 12px; display: flex; flex-direction: column; gap: 12px; }
        .render-result-card h3 { font-size: 13px; color: #45dfaa; margin: 0; }
        .render-details { display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: #aab7c8; }
        .badge-success { background: rgba(69, 223, 170, 0.15); color: #45dfaa; padding: 3px 8px; border-radius: 6px; font-size: 9px; font-weight: bold; width: fit-content; margin-top: 4px; }
        .storyboard-preview-box h4 { font-size: 11px; color: #25d8e8; margin-bottom: 6px; }
        .timeline-scenes { display: flex; flex-direction: column; gap: 6px; }
        .timeline-scene-item { background: rgba(255, 255, 255, 0.03); padding: 8px 10px; border-radius: 8px; font-size: 11px; color: #aab7c8; border-left: 2px solid #3298ff; }
        .timeline-scene-item span { color: #52b5ff; font-weight: bold; margin-right: 6px; }
        .action-buttons { display: flex; gap: 10px; margin-top: 4px; }
        .btn-download { background: rgba(69, 223, 170, 0.2); color: #45dfaa; border: 1px solid rgba(69, 223, 170, 0.4); padding: 8px 12px; border-radius: 8px; font-size: 11px; font-weight: bold; cursor: pointer; }
        .btn-proceed { background: rgba(50, 152, 255, 0.2); color: #52b5ff; border: 1px solid rgba(50, 152, 255, 0.4); padding: 8px 12px; border-radius: 8px; font-size: 11px; font-weight: bold; cursor: pointer; }
        .page-loading { text-align: center; color: #8da2bb; font-size: 11px; padding: 30px; }
        .spinner { width: 24px; height: 24px; border: 2px solid rgba(82, 144, 201, 0.22); border-top-color: #25d8e8; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 10px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
