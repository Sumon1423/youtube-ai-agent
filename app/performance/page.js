"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function PerformancePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchVideos() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/login");
        return;
      }
      setUser(sessionData.session.user);

      // Fetch user channels first
      const { data: channels, channelError } = await supabase
        .from("channels")
        .select("id")
        .eq("user_id", sessionData.session.user.id);

      if (channelError || !channels || channels.length === 0) {
        setLoading(false);
        return;
      }

      const channelIds = channels.map((c) => c.id);

      // Fetch videos belonging to user's channels
      const { data: videoData, videoErr } = await supabase
        .from("videos")
        .select("*")
        .in("channel_id", channelIds)
        .order("created_at", { ascending: false });

      if (videoErr) {
        setError(videoErr.message);
      } else {
        setVideos(videoData || []);
      }
      setLoading(false);
    }

    fetchVideos();
  }, [router]);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Loading performance data...</p>
      </div>
    );
  }

  return (
    <div className="performance-container">
      <div className="page-header">
        <span className="eyebrow">ANALYTICS HUB</span>
        <h1>Video Performance</h1>
        <p>Inspect individual video metrics, views, and engagement.</p>
      </div>

      {error && <div className="error-box"><span>⚠</span><p>{error}</p></div>}

      {videos.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📈</span>
          <strong>No videos found</strong>
          <p>Go to the Home dashboard and run "Sync Channel Videos" to import your content.</p>
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((video) => {
            const views = Number(video.views || 0);
            const likes = Number(video.likes || 0);
            const comments = Number(video.comments_count || 0);

            return (
              <div
                key={video.id}
                className="video-card"
                onClick={() => router.push(`/video/${video.id}`)}
              >
                <div className="video-card-thumb">▶</div>
                <div className="video-card-content">
                  <h3>{video.title || "Untitled Video"}</h3>
                  <div className="metrics-row">
                    <span>👁 {views.toLocaleString()}</span>
                    <span>👍 {likes.toLocaleString()}</span>
                    <span>💬 {comments.toLocaleString()}</span>
                  </div>
                </div>
                <span className="card-arrow">›</span>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .performance-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .page-header {
          margin-bottom: 4px;
        }

        .eyebrow {
          color: #52b5ff;
          font-size: 10px;
          letter-spacing: 1.5px;
          font-weight: 800;
        }

        .page-header h1 {
          font-size: 26px;
          margin: 4px 0;
          letter-spacing: -0.5px;
        }

        .page-header p {
          color: #8da2bb;
          font-size: 12px;
          margin: 0;
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

        .error-box {
          display: flex;
          gap: 10px;
          padding: 12px;
          background: rgba(184, 52, 78, 0.15);
          border: 1px solid rgba(255, 117, 139, 0.3);
          border-radius: 10px;
          color: #ff9aa9;
          font-size: 11px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 40px 20px;
          background: rgba(15, 27, 44, 0.5);
          border: 1px dashed rgba(112, 165, 220, 0.2);
          border-radius: 14px;
          gap: 8px;
        }

        .empty-icon {
          font-size: 28px;
          margin-bottom: 4px;
        }

        .empty-state strong {
          font-size: 13px;
          color: #edf6ff;
        }

        .empty-state p {
          font-size: 11px;
          color: #8da2bb;
          margin: 0;
          max-width: 280px;
        }

        .video-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .video-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(15, 27, 44, 0.7);
          border: 1px solid rgba(112, 165, 220, 0.16);
          border-radius: 12px;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .video-card:hover {
          border-color: rgba(37, 216, 232, 0.4);
        }

        .video-card-thumb {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          background: rgba(37, 216, 232, 0.1);
          color: #25d8e8;
          border-radius: 10px;
          font-size: 14px;
          flex-shrink: 0;
        }

        .video-card-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .video-card-content h3 {
          margin: 0;
          font-size: 12px;
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .metrics-row {
          display: flex;
          gap: 12px;
          font-size: 10px;
          color: #8da2bb;
        }

        .card-arrow {
          font-size: 20px;
          color: #8da2bb;
        }
      `}</style>
    </div>
  );
}
