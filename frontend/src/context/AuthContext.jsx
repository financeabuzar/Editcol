import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);     // null = unknown/loading
  const [ready, setReady] = useState(false);

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
    setUser(data.user);
    return data.user;
  };
  const verifyLoginOtp = async (email, otp, remember_me) => {
    const { data } = await api.post("/auth/verify-login-otp", { email, otp, remember_me });
    setUser(data.user);
    return data.user;
  };
  const googleAuth = async (credential, role = "pending", remember_me = true) => {
    const { data } = await api.post("/auth/google", { credential, role, remember_me });
    setUser(data.user);
    return data.user;
  };
  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    if (data.user) setUser(data.user);
    return data;
  };
  const logout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, ready, login, verifyLoginOtp, googleAuth, register, logout, refresh, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
