import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
export default function AccountDelete(){
  const { deleteMe } = useAuth();
  const [confirm,setConfirm]=useState("");
  const canDelete = confirm.toLowerCase().trim() === "delete my account";
  return (<div className="card">
    <h2 style={{color:"var(--danger)"}}>Delete account</h2>
    <p>Type <code>delete my account</code> to confirm. This action cannot be undone.</p>
    <input value={confirm} onChange={e=>setConfirm(e.target.value)} />
    <button disabled={!canDelete} onClick={deleteMe} style={{background:"var(--danger)",color:"white"}}>Permanently delete</button>
  </div>);
}
