import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);     // null = unknown/loading
  const [ready, setReady] = useState(false);

  const storeAuth = (data) => {
    if (data?.access_token) localStorage.setItem("editcol_access_token", data.access_token);
    if (data?.user) setUser(data.user);
    return data?.user;
  };

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      setUser(false);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (identifier, password, remember_me) => {
    const { data } = await api.post("/auth/login", { email: identifier, password, remember_me });
    if (data.login_otp_required) return data;
    return storeAuth(data);
  };
  const verifyLoginOtp = async (email, otp, remember_me) => {
    const { data } = await api.post("/auth/verify-login-otp", { email, otp, remember_me });
    return storeAuth(data);
  };
  const googleAuth = async (credential, role = "pending", remember_me = true) => {
    const { data } = await api.post("/auth/google", { credential, role, remember_me });
    return storeAuth(data);
  };
  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    storeAuth(data);
    return data;
  };
  const logout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    localStorage.removeItem("editcol_access_token");
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, ready, login, verifyLoginOtp, googleAuth, register, logout, refresh, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
