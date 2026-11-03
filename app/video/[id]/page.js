"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function VideoDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const videoId = params?.id;

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchVideoDetails() {
      if (!videoId) return;

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("id", videoId)
        .single();

      if (error) {
        setError(error.message);
      } else {
        setVideo(data);
      }
      setLoading(false);
    }

    fetchVideoDetails();
  }, [videoId, router]);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Loading video metrics...</p>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="error-container">
        <p>Video not found or error loading data.</p>
        <button className="btn-back" onClick={() => router.push("/performance")}>
          ← Back to Performance
        </button>
      </div>
    );
  }

  const performance = video.performance_data || {};
  const analytics = performance.analytics || performance.youtubeAnalytics || performance;
  
  const views = Number(video.views || 0);
  const likes = Number(video.likes || 0);
  const comments = Number(video.comments_count || 0);
  const avgPercentage = analytics.averageViewPercentage || null;

  return (
    <div className="details-container">
      <button className="btn-back" onClick={() => router.push("/performance")}>
        ← Back to Performance
      </button>

      <div className="video-header-card">
        <span className="eyebrow">VIDEO DIAGNOSTICS</span>
        <h1>{video.title || "Untitled Video"}</h1>
        {video.youtube_video_id && (
          <a
            className="yt-link"
            href={`https://www.youtube.com/watch?v=${video.youtube_video_id}`}
            target="_blank"
            rel="noreferrer"
          >
            Watch on YouTube ↗
          </a>
        )}
      </div>

      <div className="metrics-grid">
        <div className="metric-box">
          <strong>{views.toLocaleString()}</strong>
          <span>Views</span>
        </div>
        <div className="metric-box">
          <strong>{likes.toLocaleString()}</strong>
          <span>Likes</span>
        </div>
        <div className="metric-box">
          <strong>{comments.toLocaleString()}</strong>
          <span>Comments</span>
        </div>
        <div className="metric-box">
          <strong>{avgPercentage !== null ? `${Number(avgPercentage).toFixed(1)}%` : "—"}</strong>
          <span>Avg. Viewed %</span>
        </div>
      </div>

      <div className="description-card">
        <h3>Description</h3>
        <p>{video.description || "No description provided."}</p>
      </div>

      <style jsx>{`
        .details-container {
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

        .video-header-card h1 {
          font-size: 20px;
          margin: 6px 0;
          line-height: 1.4;
          word-break: break-word;
        }

        .yt-link {
          color: #25d8e8;
          font-size: 11px;
          text-decoration: none;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .metric-box {
          padding: 14px;
          background: rgba(15, 27, 44, 0.7);
          border: 1px solid rgba(112, 165, 220, 0.16);
          border-radius: 12px;
        }

        .metric-box strong {
          display: block;
          font-size: 18px;
          margin-bottom: 4px;
        }

        .metric-box span {
          font-size: 10px;
          color: #8da2bb;
        }

        .description-card {
          padding: 16px;
          background: rgba(15, 27, 44, 0.5);
          border: 1px solid rgba(112, 165, 220, 0.16);
          border-radius: 12px;
        }

        .description-card h3 {
          margin: 0 0 8px;
          font-size: 12px;
          color: #25d8e8;
        }

        .description-card p {
          margin: 0;
          font-size: 11px;
          color: #8da2bb;
          line-height: 1.5;
          word-break: break-word;
        }

        .page-loading {
          min-height: 50vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #8da2bb;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(82, 144, 201, 0.22);
          border-top-color: #25d8e8;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
