import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
export default function Login(){
  const nav=useNavigate(); const { login,setErr,err }=useAuth();
  const [form,setForm]=useState({email:"",password:""}), [busy,setBusy]=useState(false);
  async function onSubmit(e){ e.preventDefault(); setBusy(true); setErr("");
    try{ await login(form.email,form.password); nav("/account"); }catch(ex){ setErr(ex.message);}finally{ setBusy(false);} }
  return (<form className="form" onSubmit={onSubmit}>
    <h2>Log in</h2><p className="help">Welcome back! Access your trips and stats.</p>{err&&<p className="error" aria-live="polite">{err}</p>}
    <label>Email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
    <label>Password<input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>
    <button disabled={busy} type="submit">{busy?"Signing in...":"Log in"}</button>
    <p className="help">New here? <Link to="/register">Create an account</Link></p></form>);
}
