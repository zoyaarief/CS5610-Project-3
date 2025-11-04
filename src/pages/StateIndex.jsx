import React from "react";
import { Link } from "react-router-dom";
import states from "../data/states.json";
export default function StateIndex(){
  return (<div className="card">
    <h2>States</h2>
    <ul style={{columns:2,gap:20,paddingLeft:16}}>
      {states.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(s=>(
        <li key={s.code}><Link to={`/states/${s.code}`}>{s.name}</Link></li>
      ))}
    </ul>
  </div>);
}
