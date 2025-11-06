import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const me = await api("/users/me");
        if (!cancel) setUser(me.user || null);
      } catch {
        if (!cancel) setUser(null);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const login = async (email, password) => {
    setErr("");
    const r = await api("/auth/login", {
      method: "POST",
      data: { email, password },
    });
    setUser(r.user);
    return r.user;
  };

  const register = async (name, email, password) => {
    setErr("");
    const r = await api("/auth/register", {
      method: "POST",
      data: { name, email, password },
    });
    setUser(r.user);
    return r.user;
  };

  const logout = async () => {
    setErr("");
    await api("/auth/logout", { method: "POST" });
    setUser(null);
  };

  const updateMe = async (patch) => {
    try {
      const r = await api("/users/me", { method: "PATCH", data: patch });
      setUser(r.user); // <- immediately update context
      return r.user;
    } catch (e) {
      if (e.status === 401) setUser(null); // stale cookie → logout locally
      throw e;
    }
  };

  const deleteMe = async () => {
    setErr("");
    await api("/users/me", { method: "DELETE" });
    setUser(null);
  };

  return (
    <AuthCtx.Provider
      value={{
        user,
        loading,
        err,
        setErr,
        login,
        register,
        logout,
        updateMe,
        deleteMe,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}
