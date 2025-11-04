import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
const Ctx = createContext(null);
export const useAuth = ()=>useContext(Ctx);
export function AuthProvider({ children }){
  const [user,setUser]=useState(null), [loading,setLoading]=useState(true), [err,setErr]=useState("");
  useEffect(()=>{ api("/users/me").then(r=>setUser(r.user)).catch(()=>{}).finally(()=>setLoading(false)); },[]);
  const login=async(e,p)=>{ setErr(""); const r=await api("/auth/login",{method:"POST",data:{email:e,password:p}}); setUser(r.user); };
  const register=async(n,e,p)=>{ setErr(""); const r=await api("/auth/register",{method:"POST",data:{name:n,email:e,password:p}}); setUser(r.user); };
  const logout=async()=>{ await api("/auth/logout",{method:"POST"}); setUser(null); };
  const updateMe=async(patch)=>{ const r=await api("/users/me",{method:"PATCH",data:patch}); setUser(r.user); };
  const deleteMe=async()=>{ await api("/users/me",{method:"DELETE"}); setUser(null); };
  return <Ctx.Provider value={{user,loading,err,setErr,login,register,logout,updateMe,deleteMe}}>{children}</Ctx.Provider>;
}
