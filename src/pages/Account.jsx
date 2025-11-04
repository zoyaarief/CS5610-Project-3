import React from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
export default function Account(){
  const { user } = useAuth();
  return (<div className="card">
    <h2>My Account</h2>
    <img src={user.avatarUrl || "https://via.placeholder.com/96"} alt="avatar" width={96} height={96} style={{borderRadius:12}}/>
    <div><strong>Name:</strong> {user.name}</div>
    <div><strong>Email:</strong> {user.email}</div>
    <div style={{display:"flex",gap:8,marginTop:8}}>
      <Link to="/account/edit">Edit</Link>
      <Link to="/account/delete" style={{color:"var(--danger)"}}>Delete account</Link>
    </div></div>);
}
