
"use client";

import { useState } from "react";

export default function Home() {
  const [active, setActive] = useState("Overview");

  const menu = [
    "Overview",
    "Channel Analytics",
    "AI Video Ideas",
    "Script Generator",
    "Asset Manager",
    "Voice Generator",
    "Video Editor",
    "Video Preview",
    "Upload Manager"
  ];

  return (
    <main style={{
      minHeight: "100vh",
      background: "#101419",
      color: "white",
      padding: "24px",
      fontFamily: "Arial"
    }}>
      <h1 style={{color:"#29E9BC"}}>
        YouTube AI Agent
      </h1>
      <p style={{color:"#9BA7B4"}}>
        Your Personal AI Channel Manager
      </p>

      <div style={{
        display:"flex",
        flexWrap:"wrap",
        gap:"10px",
        margin:"25px 0"
      }}>
        {menu.map(item => (
          <button
            key={item}
            onClick={() => setActive(item)}
            style={{
              padding:"12px",
              borderRadius:"8px",
              border:"1px solid #29343D",
              background:active === item ? "#23D3AA" : "#192129",
              color:active === item ? "#101419" : "white"
            }}
          >
            {item}
          </button>
        ))}
      </div>

      <section style={{
        background:"#192129",
        padding:"22px",
        borderRadius:"14px"
      }}>
        <h2>{active}</h2>
        <p style={{color:"#9BA7B4"}}>
          {active === "Overview"
            ? "Your AI YouTube Manager is ready for setup."
            : `${active} module will be connected in the next development stage.`}
        </p>
      </section>

      <p style={{
        color:"#29E9BC",
        marginTop:"30px"
      }}>
        AI Agent Status: Setup in progress
      </p>
    </main>
  );
}
