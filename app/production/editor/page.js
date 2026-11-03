"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AIEditorPage() {
  const router = useRouter();
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderResult, setRenderResult] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const handleStartRendering = () => {
    setRendering(true);
    setRenderProgress(15);
    setRenderResult(null);

    setTimeout(() => setRenderProgress(45), 1000);
    setTimeout(() => setRenderProgress(80), 2000);
    setTimeout(() => {
      setRenderProgress(100);
      setRendering(false);
      setRenderResult({
        videoName: "True_Crime_Shorts_Final_Render.mp4",
        resolution: "1080x1920 (Vertical Shorts)",
        fps: "30 FPS",
        duration: "52s",
        status: "Ready for Publishing",
        // ডেমো বা স্যাম্পল ভিডিও লিংক (এখানে রেন্ডার হওয়া ভিডিওর প্রিভিউ দেখা যাবে)
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" 
      });
    }, 3000);
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
        <span className="eyebrow">AUTOMATED RENDERING ENGINE</span>
        <h1>AI Editor 🎬</h1>
        <p>Assemble visuals, subtitles, audio tracks, and transitions into a viral Shorts video.</p>
      </div>

      <div className="editor-pipeline-box">
        <h3>Pipeline Assembly Status</h3>
        <ul className="pipeline-steps">
          <li>✔ Script & Storyboard Verified</li>
          <li>✔ Voiceover Audio Synced</li>
          <li>✔ Visual Assets & PNG Overlays Mapped</li>
          <li>✔ Auto-Captions & Sub-rip Timing Applied</li>
        </ul>
      </div>

      <button className="btn-render" onClick={handleStartRendering} disabled={rendering}>
        {rendering ? `Rendering Video... ${renderProgress}%` : "🚀 Start Autonomous Video Rendering"}
      </button>

      {rendering && (
        <div className="progress-bar-container">
          <div className="progress-fill" style={{ width: `${renderProgress}%` }} />
        </div>
      )}

      {renderResult && (
        <div className="render-result-card">
          <h3>Render Successful! 🎉</h3>
          <div className="render-details">
            <p><strong>File:</strong> {renderResult.videoName}</p>
            <p><strong>Resolution:</strong> {renderResult.resolution}</p>
            <p><strong>Specs:</strong> {renderResult.fps} • {renderResult.duration}</p>
            <span className="badge-success">{renderResult.status}</span>
          </div>

          {/* ভিডিও প্রিভিউ প্লেয়ার */}
          <div className="video-preview-wrapper">
            <h4>🎥 Video Preview:</h4>
            <video 
              controls 
              width="100%" 
              style={{ borderRadius: "10px", maxHeight: "350px", background: "#000" }}
              src={renderResult.videoUrl}
            >
              Your browser does not support the video tag.
            </video>
          </div>

          <div className="action-buttons">
            <a 
              href={renderResult.videoUrl} 
              download 
              className="btn-download"
              target="_blank" 
              rel="noopener noreferrer"
            >
              📥 Download Video
            </a>
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
        .video-preview-wrapper h4 { font-size: 11px; color: #25d8e8; margin-bottom: 6px; }
        .action-buttons { display: flex; gap: 10px; margin-top: 4px; }
        .btn-download { background: rgba(69, 223, 170, 0.2); color: #45dfaa; border: 1px solid rgba(69, 223, 170, 0.4); padding: 8px 12px; border-radius: 8px; font-size: 11px; font-weight: bold; cursor: pointer; text-decoration: none; text-align: center; }
        .btn-proceed { background: rgba(50, 152, 255, 0.2); color: #52b5ff; border: 1px solid rgba(50, 152, 255, 0.4); padding: 8px 12px; border-radius: 8px; font-size: 11px; font-weight: bold; cursor: pointer; }
        .page-loading { text-align: center; color: #8da2bb; font-size: 11px; padding: 30px; }
        .spinner { width: 24px; height: 24px; border: 2px solid rgba(82, 144, 201, 0.22); border-top-color: #25d8e8; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 10px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
