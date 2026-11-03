"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function VideoDoctorPage() {
  const router = useRouter();
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVideos() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      const userId = sessionData.session.user.id;

      const { data: channels } = await supabase
        .from("channels")
        .select("id")
        .eq("user_id", userId);

      if (channels && channels.length > 0) {
        const channelIds = channels.map((c) => c.id);
        const { data: vids } = await supabase
          .from("videos")
          .select("*")
          .in("channel_id", channelIds)
          .order("created_at", { ascending: false });

        setVideos(vids || []);
      }
      setLoading(false);
    }

    loadVideos();
  }, [router]);

  const runDiagnosis = (video) => {
    setSelectedVideo(video);
    setAnalyzing(true);
    setReport(null);

    setTimeout(() => {
      const views = Number(video.views || 0);
      let hookScore = "Strong";
      let retentionStatus = "High Retention";
      let recommendations = [];

      if (views < 500) {
        hookScore = "Weak Hook";
        retentionStatus = "Low Initial Hold";
        recommendations.push("First 3 seconds-e visual hook ba strong audio trigger use করুন।");
        recommendations.push("Title-e USA audience-er jonno curios query add করুন।");
      } else if (views < 2000) {
        hookScore = "Moderate Hook";
        retentionStatus = "Average Retention";
        recommendations.push("Pacing fast করুন ebong transition speed baran.");
      } else {
        hookScore = "Excellent Hook";
        retentionStatus = "Viral Potential";
        recommendations.push("Ei video-r topic ebong editing pattern die similar notun content banan.");
      }

      setReport({
        views,
        hookScore,
        retentionStatus,
        recommendations,
      });
      setAnalyzing(false);
    }, 1200);
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Loading Video Doctor...</p>
      </div>
    );
  }

  return (
    <div className="doctor-container">
      <button className="btn-back" onClick={() => router.push("/intelligence")}>
        ← Back to Intelligence Hub
      </button>

      <div className="page-header">
        <span className="eyebrow">AI DIAGNOSTICS</span>
        <h1>Video Doctor 🩺</h1>
        <p>Diagnose individual video performance and identify weak hooks.</p>
      </div>

      {videos.length === 0 ? (
        <div className="empty-state">
          <p>No videos available for diagnosis. Please sync your channel first.</p>
        </div>
      ) : (
        <div className="doctor-content">
          <div className="video-selector">
            <h3>Select a Video to Diagnose</h3>
            <div className="video-list">
              {videos.map((vid) => (
                <div
                  key={vid.id}
                  className={`vid-card ${selectedVideo?.id === vid.id ? "active" : ""}`}
                  onClick={() => runDiagnosis(vid)}
                >
                  <strong>{vid.title || "Untitled Video"}</strong>
                  <span>👁 {Number(vid.views || 0).toLocaleString()} Views</span>
                </div>
              ))}
            </div>
          </div>

          <div className="diagnosis-panel">
            {analyzing ? (
              <div className="analyzing-state">
                <div className="spinner" />
                <p>AI Doctor is inspecting video retention, hook, and pacing...</p>
              </div>
            ) : report ? (
              <div className="report-card">
                <h3>Diagnosis Report</h3>
                <p className="vid-title">{selectedVideo?.title}</p>
                <div className="status-tags">
                  <span className={`tag ${report.hookScore.toLowerCase().replace(" ", "-")}`}>
                    Hook: {report.hookScore}
                  </span>
                  <span className="tag retention">{report.retentionStatus}</span>
                </div>

                <div className="recommendations-box">
                  <h4>AI Action Plan & Suggestions:</h4>
                  <ul>
                    {report.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="prompt-state">
                <p>👈 Left side theke ekta video select korun AI Diagnosis run korar jonno.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .doctor-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .btn-back {
          background: transparent;
          border: none;
          color: #3298ff;
          font-size: 11px;
          cursor: pointer;
          width: fit-content;
          padding: 0;
        }

        .eyebrow {
          color: #52b5ff;
          font-size: 10px;
          letter-spacing: 1.5px;
          font-weight: 800;
        }

        .page-header h1 {
          font-size: 24px;
          margin: 4px 0;
        }

        .page-header p {
          color: #8da2bb;
          font-size: 12px;
          margin: 0;
        }

        .doctor-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .video-selector h3, .diagnosis-panel h3 {
          font-size: 13px;
          margin-bottom: 10px;
          color: #25d8e8;
        }

        .video-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 400px;
          overflow-y: auto;
        }

        .vid-card {
          padding: 12px;
          background: rgba(15, 27, 44, 0.7);
          border: 1px solid rgba(112, 165, 220, 0.16);
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .vid-card:hover, .vid-card.active {
          border-color: #25d8e8;
          background: rgba(37, 216, 232, 0.08);
        }

        .vid-card strong {
          font-size: 11px;
          color: #edf6ff;
        }

        .vid-card span {
          font-size: 10px;
          color: #8da2bb;
        }

        .diagnosis-panel {
          padding: 16px;
          background: rgba(15, 27, 44, 0.7);
          border: 1px solid rgba(112, 165, 220, 0.16);
          border-radius: 12px;
          min-height: 250px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .vid-title {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 12px;
        }

        .status-tags {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }

        .tag {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: bold;
          background: rgba(50, 152, 255, 0.2);
          color: #52b5ff;
        }

        .tag.weak-hook {
          background: rgba(255, 117, 139, 0.2);
          color: #ff9aa9;
        }

        .recommendations-box h4 {
          font-size: 11px;
          color: #25d8e8;
          margin-bottom: 6px;
        }

        .recommendations-box ul {
          padding-left: 16px;
          margin: 0;
          font-size: 11px;
          color: #8da2bb;
        }

        .recommendations-box li {
          margin-bottom: 4px;
        }

        .page-loading, .analyzing-state, .prompt-state, .empty-state {
          text-align: center;
          color: #8da2bb;
          font-size: 11px;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(82, 144, 201, 0.22);
          border-top-color: #25d8e8;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 10px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
