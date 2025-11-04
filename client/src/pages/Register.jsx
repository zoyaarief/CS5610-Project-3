import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
export default function Register(){
  const nav=useNavigate(); const { register,setErr,err }=useAuth();
  const [form,setForm]=useState({name:"",email:"",password:""}), [busy,setBusy]=useState(false), [e,setE]=useState({});
  function validate(){ const x={}; if(!form.name.trim())x.name="Name is required";
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))x.email="Enter a valid email";
    if(form.password.length<6)x.password="Password must be at least 6 characters"; setE(x); return !Object.keys(x).length; }
  async function onSubmit(ev){ ev.preventDefault(); if(!validate())return; setBusy(true); setErr("");
    try{ await register(form.name,form.email,form.password); nav("/account"); }catch(ex){ setErr(ex.message); }finally{ setBusy(false); } }
  return (<form className="form" onSubmit={onSubmit} noValidate>
    <h2>Create account</h2><p className="help">Sign up to save your trips and stats.</p>{err&&<p className="error" aria-live="polite">{err}</p>}
    <label>Name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} aria-invalid={!!e.name}/></label>{e.name&&<div className="error">{e.name}</div>}
    <label>Email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} aria-invalid={!!e.email}/></label>{e.email&&<div className="error">{e.email}</div>}
    <label>Password<input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} aria-invalid={!!e.password}/></label>{e.password&&<div className="error">{e.password}</div>}
    <button disabled={busy} type="submit">{busy?"Creating...":"Sign up"}</button></form>);
}
