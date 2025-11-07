import React, { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import states from "../data/states.json";

function getStateByCode(code) {
  const c = String(code || "").toUpperCase();
  return states.find((s) => s.code === c) || null;
}

function buildCandidates(code) {
  const lower = String(code).toLowerCase();
  return [
    `/state-photos/${lower}.jpg`,
    `/state-photos/${lower}.jpeg`,
    `/state-photos/${lower}.png`,
    `/state-photos/fallback.jpg`,
    `/state-photos/fallback.jpeg`,
    `/state-photos/fallback.png`,
  ];
}

export default function StateDetail() {
  const { code } = useParams();
  const state = useMemo(() => getStateByCode(code), [code]);

  const [idx, setIdx] = useState(0);
  const candidates = state ? buildCandidates(state.code) : [];

  if (!state) {
    return (
      <div className="card" style={{ marginTop: 16 }}>
        <p>State not found.</p>
        <p><Link to="/states">Back to all states</Link></p>
      </div>
    );
  }

  const src = candidates[idx];

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <p><Link to="/states">← Back to all states</Link></p>

      <header>
        <h1 style={{ margin: "0 0 8px" }}>
          {state.name} <span style={{ opacity: 0.7 }}>({state.code})</span>
        </h1>
        <div style={{ color: "var(--muted)" }}>
          Capital: <strong>{state.capital}</strong> · Region: <strong>{state.region}</strong>
          {state.nickname ? <> · Nickname: <strong>{state.nickname}</strong></> : null}
        </div>
      </header>

      <img
        src={src}
        alt={`${state.name} representative`}
        className="state-hero"
        loading="lazy"
        onError={() => {
          // try next candidate if current fails
          if (idx < candidates.length - 1) {
            console.warn("[StateDetail] image failed, trying next:", src);
            setIdx((i) => i + 1);
          }
        }}
        style={{
          width: "100%",
          height: "auto",
          maxHeight: 420,
          objectFit: "cover",
          borderRadius: 12,
          border: "1px solid var(--border, #2b3142)",
          marginTop: 12,
        }}
      />

      {/* Debug line (keep for now; remove later) */}
      <p className="help" style={{ marginTop: 8 }}>
        Image URL tried: <code>{src}</code>
      </p>

      <section>
        <h2 style={{ marginTop: 16 }}>About {state.name}</h2>
        <p className="help">Add quick facts, links, or your own notes here.</p>
      </section>
    </div>
  );
}
