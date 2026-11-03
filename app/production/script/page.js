"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ScriptStudioPage() {
  const router = useRouter();
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [scriptData, setScriptData] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const savedIdea = localStorage.getItem("selected_idea");
    if (savedIdea) {
      setSelectedIdea(JSON.parse(savedIdea));
    }
  }, []);

  const generateScriptAndStoryboard = () => {
    setGenerating(true);
    setTimeout(() => {
      setScriptData({
        title: selectedIdea?.title || "Autonomous Shorts Script",
        language: "English (US)",
        scenes: [
          {
            scene: 1,
            duration: "0-3s",
            visual: "Dark vintage aviation map overlaying misty ocean graphics.",
            narration: selectedIdea?.hook || "In 1948, an American bomber disappeared without a trace...",
            onScreenText: "DISAPPEARED WITHOUT A TRACE ⚠️",
            soundFx: "Deep Dramatic Bass Drop"
          },
          {
            scene: 2,
            duration: "4-12s",
            visual: "Archival military documents and rapid zoom on classified stamp.",
            narration: "The flight took off under clear skies. But 20 minutes in, the pilot sent a message that made no sense.",
            onScreenText: "CLASSIFIED TRANSMISSION 📡",
            soundFx: "Static Radio Noise"
          },
          {
            scene: 3,
            duration: "13-25s",
            visual: "Dramatic portrait sketches and timeline animation.",
            narration: "Search teams found no wreckage, no oil slicks, and no distress signals. It vanished into thin air.",
            onScreenText: "VANISHED INTO THIN AIR 🌫️",
            soundFx: "Tense Wind Sound"
          }
        ]
      });
      setGenerating(false);
    }, 1500);
  };

  return (
    <div className="script-container">
      <button className="btn-back" onClick={() => router.push("/production/ideas")}>
        ← Back to Video Ideas
      </button>

      <div className="page-header">
        <span className="eyebrow">SCRIPT & STORYBOARD ENGINE</span>
        <h1>Script Studio ✍️</h1>
        <p>Automated Scene-by-Scene Scripting & Visual Storyboard Generation.</p>
      </div>

      {selectedIdea && (
        <div className="active-idea-box">
          <span>Selected Concept:</span>
          <strong>{selectedIdea.title}</strong>
        </div>
      )}

      <button className="btn-generate" onClick={generateScriptAndStoryboard} disabled={generating}>
        {generating ? "Generating Storyboard..." : "🎬 Generate US English Script & Storyboard"}
      </button>

      {scriptData && (
        <div className="script-results">
          <div className="script-header">
            <h3>{scriptData.title}</h3>
            <span className="lang-tag">{scriptData.language}</span>
          </div>

          <div className="storyboard-list">
            {scriptData.scenes.map((sc) => (
              <div key={sc.scene} className="scene-card">
                <div className="scene-top">
                  <span className="scene-num">Scene {sc.scene}</span>
                  <span className="scene-dur">⏱️ {sc.duration}</span>
                </div>
                <p><strong>Visual Direction:</strong> {sc.visual}</p>
                <p><strong>Narration (Audio):</strong> "{sc.narration}"</p>
                <p><strong>On-Screen Text:</strong> <span className="text-highlight">{sc.onScreenText}</span></p>
                <p className="sfx">🔊 <strong>SFX:</strong> {sc.soundFx}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .script-container { display: flex; flex-direction: column; gap: 16px; }
        .btn-back { background: transparent; border: none; color: #3298ff; font-size: 11px; cursor: pointer; width: fit-content; padding: 0; }
        .eyebrow { color: #52b5ff; font-size: 10px; letter-spacing: 1.5px; font-weight: 800; }
        .page-header h1 { font-size: 24px; margin: 4px 0; }
        .page-header p { color: #8da2bb; font-size: 12px; margin: 0; }
        .active-idea-box { padding: 10px 14px; background: rgba(37, 216, 232, 0.08); border: 1px solid rgba(37, 216, 232, 0.2); border-radius: 10px; font-size: 11px; display: flex; flex-direction: column; gap: 2px; color: #25d8e8; }
        .btn-generate { background: #3298ff; color: #ffffff; border: none; padding: 12px; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 12px; }
        .script-results { display: flex; flex-direction: column; gap: 12px; margin-top: 8px; }
        .script-header { display: flex; justify-content: space-between; align-items: center; background: rgba(15, 27, 44, 0.7); padding: 12px; border-radius: 10px; border: 1px solid rgba(112, 165, 220, 0.16); }
        .script-header h3 { margin: 0; font-size: 13px; color: #edf6ff; }
        .lang-tag { background: rgba(69, 223, 170, 0.15); color: #45dfaa; padding: 2px 8px; border-radius: 6px; font-size: 9px; font-weight: bold; }
        .storyboard-list { display: flex; flex-direction: column; gap: 10px; }
        .scene-card { padding: 14px; background: rgba(15, 27, 44, 0.7); border: 1px solid rgba(112, 165, 220, 0.16); border-radius: 12px; display: flex; flex-direction: column; gap: 6px; font-size: 11px; color: #aab7c8; }
        .scene-top { display: flex; justify-content: space-between; font-weight: bold; }
        .scene-num { color: #25d8e8; }
        .scene-dur { color: #8da2bb; font-size: 10px; }
        .text-highlight { color: #ffc107; font-weight: bold; }
        .sfx { color: #52b5ff; margin: 0; }
      `}</style>
    </div>
  );
}
