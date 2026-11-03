"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function ChannelMonitorPage() {
  const router = useRouter();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChannelData() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      const userId = sessionData.session.user.id;

      const { data: channelData } = await supabase
        .from("channels")
        .select("*")
        .eq("user_id", userId);

      setChannels(channelData || []);
      setLoading(false);
    }

    fetchChannelData();
  }, [router]);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Channel Monitor লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="monitor-container">
      <button className="btn-back" onClick={() => router.push("/intelligence")}>
        ← Intelligence Hub-এ ফিরে যান
      </button>

      <div className="page-header">
        <span className="eyebrow">LIVE TELEMETRY</span>
        <h1>Channel Monitor 📡</h1>
        <p>আপনার ইউটিউব চ্যানেলের স্বাস্থ্য, সাবস্ক্রাইবার এবং সার্বিক গ্রোথ ট্র্যাক করুন।</p>
      </div>

      {channels.length === 0 ? (
        <div className="empty-state">
          <p>কোনো কানেক্টেড চ্যানেল পাওয়া যায়নি। অনুগ্রহ করে আগে চ্যানেল সিংক করুন।</p>
        </div>
      ) : (
        <div className="channels-grid">
          {channels.map((channel) => (
            <div key={channel.id} className="channel-card">
              <div className="channel-top">
                <h3>{channel.channel_name || "আমার ইউটিউব শর্টস চ্যানেল"}</h3>
                <span className="status-badge online">Active</span>
              </div>
              
              <div className="metrics-row">
                <div className="metric-box">
                  <span>মোট সাবস্ক্রাইবার</span>
                  <strong>{Number(channel.subscribers_count || 0).toLocaleString()}</strong>
                </div>
                <div className="metric-box">
                  <span>সর্বশেষ সিংক</span>
                  <strong className="small-text">
                    {channel.last_synced_at ? new Date(channel.last_synced_at).toLocaleString() : "এখনো হয়নি"}
                  </strong>
                </div>
              </div>

              <div className="health-section">
                <span>চ্যানেল হেলথ স্ট্যাটাস:</span>
                <strong className="text-success">Optimal & Stable (US Target Ready)</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .monitor-container {
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

        .channels-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .channel-card {
          padding: 16px;
          background: rgba(15, 27, 44, 0.7);
          border: 1px solid rgba(112, 165, 220, 0.16);
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .channel-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .channel-card h3 {
          margin: 0;
          font-size: 14px;
          color: #25d8e8;
        }

        .status-badge {
          padding: 3px 8px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: bold;
          background: rgba(69, 223, 170, 0.15);
          color: #45dfaa;
        }

        .metrics-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .metric-box {
          padding: 10px;
          background: rgba(25, 40, 65, 0.5);
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .metric-box span {
          font-size: 10px;
          color: #8da2bb;
        }

        .metric-box strong {
          font-size: 13px;
          color: #edf6ff;
        }

        .small-text {
          font-size: 10px !important;
          color: #aab7c8 !important;
        }

        .health-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          padding-top: 6px;
          border-top: 1px solid rgba(112, 165, 220, 0.1);
        }

        .health-section span {
          color: #8da2bb;
        }

        .text-success {
          color: #45dfaa;
        }

        .page-loading, .empty-state {
          text-align: center;
          color: #8da2bb;
          font-size: 11px;
          padding: 20px;
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
