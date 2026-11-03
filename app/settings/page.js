"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    async function fetchSettingsData() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      const currentUser = sessionData.session.user;
      setUser(currentUser);

      const { data: channelData } = await supabase
        .from("channels")
        .select("*")
        .eq("user_id", currentUser.id);

      setChannels(channelData || []);
      setLoading(false);
    }

    fetchSettingsData();
  }, [router]);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Loading settings...</p>
      </div>
    );
  }

  const activeChannel = channels.length > 0 ? channels[0] : null;

  return (
    <div className="settings-container">
      <div className="page-header">
        <span className="eyebrow">WORKSPACE PREFERENCES</span>
        <h1>Settings & Account</h1>
        <p>Manage your account credentials, connected channels, and sessions.</p>
      </div>

      <div className="settings-card">
        <h3>User Profile</h3>
        <div className="settings-row">
          <span>Email</span>
          <strong>{user?.email || "N/A"}</strong>
        </div>
        <div className="settings-row">
          <span>User ID</span>
          <strong className="sub-text">{user?.id}</strong>
        </div>
      </div>

      <div className="settings-card">
        <h3>YouTube Connection</h3>
        <div className="settings-row">
          <span>Status</span>
          <strong className={activeChannel ? "text-success" : "text-muted"}>
            {activeChannel ? "Connected" : "Not Connected"}
          </strong>
        </div>
        {activeChannel && (
          <div className="settings-row">
            <span>Channel Name</span>
            <strong>{activeChannel.channel_name || "Active Channel"}</strong>
          </div>
        )}
      </div>

      <div className="settings-card danger-zone">
        <h3>Session Management</h3>
        <p>Sign out of your CreatorOS workspace on this device.</p>
        <button className="btn-danger" onClick={handleSignOut} disabled={signingOut}>
          {signingOut ? "Signing out..." : "Sign Out"}
        </button>
      </div>

      <style jsx>{`
        .settings-container {
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

        .settings-card {
          padding: 16px;
          background: rgba(15, 27, 44, 0.7);
          border: 1px solid rgba(112, 165, 220, 0.16);
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .settings-card h3 {
          margin: 0;
          font-size: 13px;
          color: #25d8e8;
        }

        .settings-card p {
          margin: 0;
          font-size: 11px;
          color: #8da2bb;
        }

        .settings-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid rgba(112, 165, 220, 0.1);
          font-size: 11px;
        }

        .settings-row:last-child {
          border-bottom: 0;
        }

        .settings-row span {
          color: #8da2bb;
        }

        .sub-text {
          font-size: 9px;
          color: #8da2bb;
          word-break: break-all;
          max-width: 180px;
          text-align: right;
        }

        .text-success {
          color: #45dfaa;
        }

        .text-muted {
          color: #8da2bb;
        }

        .danger-zone {
          border-color: rgba(255, 117, 139, 0.2);
        }

        .danger-zone h3 {
          color: #ff9aa9;
        }

        .btn-danger {
          padding: 10px;
          border: none;
          border-radius: 10px;
          background: rgba(255, 117, 139, 0.15);
          color: #ff9aa9;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          width: 100%;
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
