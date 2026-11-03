"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AssetManagerPage() {
  const router = useRouter();
  const [assets, setAssets] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssets() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      const userId = sessionData.session.user.id;

      // Fetching assets from supabase if table exists, or fallback to mock state
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setAssets(data);
      } else {
        // Initial mock assets for demonstration
        setAssets([
          { id: 1, name: "vintage_aviation_map.png", type: "Image", size: "1.2 MB", status: "Ready" },
          { id: 2, name: "classified_stamp_overlay.png", type: "PNG Overlay", size: "450 KB", status: "Ready" },
          { id: 3, name: "deep_bass_drop.mp3", type: "Sound Effect", size: "890 KB", status: "Ready" },
          { id: 4, name: "tension_wind_bg.mp3", type: "Background Audio", size: "2.4 MB", status: "Ready" },
        ]);
      }
      setLoading(false);
    }

    fetchAssets();
  }, [router]);

  const handleSimulatedUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setTimeout(() => {
      const newAsset = {
        id: Date.now(),
        name: file.name,
        type: file.type.includes("image") ? "Image" : file.type.includes("audio") ? "Audio" : "Video Clip",
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        status: "Uploaded"
      };
      setAssets([newAsset, ...assets]);
      setUploading(false);
    }, 1200);
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Asset Manager লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="assets-container">
      <button className="btn-back" onClick={() => router.push("/production")}>
        ← Back to Production Studio
      </button>

      <div className="page-header">
        <span className="eyebrow">MEDIA REPOSITORY</span>
        <h1>Asset Manager 🖼️</h1>
        <p>Manage video assets, b-roll, graphics, and custom user uploads.</p>
      </div>

      <div className="upload-box">
        <h3>Upload Custom Assets</h3>
        <p>Upload video clips, images, PNG overlays, background audio, or voiceovers.</p>
        <label className="upload-btn">
          {uploading ? "Uploading to Cloud..." : "📁 Choose File to Upload"}
          <input type="file" onChange={handleSimulatedUpload} style={{ display: "none" }} />
        </label>
      </div>

      <div className="assets-section">
        <h3>Project Asset Repository ({assets.length})</h3>
        <div className="assets-list">
          {assets.map((item) => (
            <div key={item.id} className="asset-card">
              <div className="asset-info">
                <strong>{item.name}</strong>
                <span className="asset-meta">{item.type} • {item.size}</span>
              </div>
              <span className="status-ready">{item.status}</span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .assets-container { display: flex; flex-direction: column; gap: 16px; }
        .btn-back { background: transparent; border: none; color: #3298ff; font-size: 11px; cursor: pointer; width: fit-content; padding: 0; }
        .eyebrow { color: #52b5ff; font-size: 10px; letter-spacing: 1.5px; font-weight: 800; }
        .page-header h1 { font-size: 24px; margin: 4px 0; }
        .page-header p { color: #8da2bb; font-size: 12px; margin: 0; }
        .upload-box { padding: 16px; background: rgba(15, 27, 44, 0.7); border: 1px dashed rgba(37, 216, 232, 0.4); border-radius: 14px; display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
        .upload-box h3 { margin: 0; font-size: 13px; color: #25d8e8; }
        .upload-box p { margin: 0; font-size: 11px; color: #8da2bb; }
        .upload-btn { background: rgba(37, 216, 232, 0.15); color: #25d8e8; border: 1px solid rgba(37, 216, 232, 0.3); padding: 8px 14px; border-radius: 8px; font-size: 11px; font-weight: bold; cursor: pointer; margin-top: 4px; display: inline-block; }
        .assets-section h3 { font-size: 13px; color: #edf6ff; margin-bottom: 8px; }
        .assets-list { display: flex; flex-direction: column; gap: 8px; }
        .asset-card { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(15, 27, 44, 0.7); border: 1px solid rgba(112, 165, 220, 0.16); border-radius: 10px; }
        .asset-info { display: flex; flex-direction: column; gap: 3px; }
        .asset-info strong { font-size: 11px; color: #edf6ff; }
        .asset-meta { font-size: 10px; color: #8da2bb; }
        .status-ready { font-size: 9px; font-weight: bold; padding: 3px 8px; background: rgba(69, 223, 170, 0.15); color: #45dfaa; border-radius: 6px; }
        .page-loading { text-align: center; color: #8da2bb; font-size: 11px; padding: 30px; }
        .spinner { width: 24px; height: 24px; border: 2px solid rgba(82, 144, 201, 0.22); border-top-color: #25d8e8; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 10px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
            }
