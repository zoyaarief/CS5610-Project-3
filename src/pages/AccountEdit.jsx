import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
export default function AccountEdit(){
  const { user, updateMe } = useAuth();
  const nav = useNavigate();
  const [form,setForm]=useState({ name:user?.name||"", avatarUrl:user?.avatarUrl||"", password:"" });
  const [busy,setBusy]=useState(false), [errs,setErrs]=useState({});
  function validate(){ const e={}; if(!form.name.trim()) e.name="Name is required";
    if(form.password && form.password.length<6) e.password="Min 6 characters"; setErrs(e); return !Object.keys(e).length; }
  async function onSubmit(ev){ ev.preventDefault(); if(!validate())return; setBusy(true);
    try{ const patch={ name:form.name, avatarUrl:form.avatarUrl }; if(form.password) patch.password=form.password; await updateMe(patch); nav("/account"); }
    finally{ setBusy(false); } }
  return (<form className="form" onSubmit={onSubmit} noValidate>
    <h2>Edit account</h2>
    <label>Name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} aria-invalid={!!errs.name}/></label>{errs.name&&<div className="error">{errs.name}</div>}
    <label>Avatar URL<input value={form.avatarUrl} onChange={e=>setForm({...form,avatarUrl:e.target.value})}/></label>
    <label>New password (optional)<input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} aria-invalid={!!errs.password}/></label>{errs.password&&<div className="error">{errs.password}</div>}
    <button disabled={busy} type="submit">{busy?"Saving...":"Save changes"}</button></form>);
}
