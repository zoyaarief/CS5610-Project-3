import React from "react";
import { useParams, Link } from "react-router-dom";
import states from "../data/states.json";
export default function StateDetail(){
  const { code } = useParams();
  const s = states.find(x=>x.code.toLowerCase()===code.toLowerCase());
  if (!s) return <div className="card"><p>State not found. <Link to="/states">Back</Link></p></div>;
  return (<article className="card" style={{display:"grid",gap:8}}>
    <h2>{s.name} ({s.code})</h2>
    <div><strong>Capital:</strong> {s.capital}</div>
    <div><strong>Region:</strong> {s.region}</div>
    <div><strong>Nickname:</strong> {s.nickname || "—"}</div>
    <p className="help">More quick facts coming soon.</p>
    <Link to="/states">← All states</Link>
  </article>);
}
