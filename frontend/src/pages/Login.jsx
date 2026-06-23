import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { formatApiError } from "@/lib/api";
import Logo from "@/components/Logo";
import { Loader2, Lock, Mail } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate(); const loc = useLocation();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const u = await login(email.trim().toLowerCase(), password, remember);
      const dest = u.role === "admin" ? "/admin" : "/dashboard";
      nav(loc.state?.from || dest);
    } catch (e) { setErr(formatApiError(e)); } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 fade-in">
      <div className="hidden md:flex bg-ink relative overflow-hidden p-12 items-end">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full" style={{background:"radial-gradient(circle, rgba(57,255,20,0.35), transparent 70%)"}}/>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full" style={{background:"radial-gradient(circle, rgba(223,255,0,0.25), transparent 70%)"}}/>
        <div className="relative text-white max-w-sm">
          <Logo size="lg" as="div" />
          <p className="mt-8 font-heading text-3xl leading-tight">Where elite editors meet serious creators.</p>
          <p className="mt-4 text-sm text-gray-400">Verified profiles · Real reviews · Transparent trust scores.</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4" data-testid="login-form">
          <div className="md:hidden mb-6"><Logo /></div>
          <p className="text-xs font-bold tracking-wider uppercase text-gray-500">Welcome back</p>
          <h1 className="font-heading text-3xl font-bold text-gray-900">Sign in to EditCol</h1>

          <div>
            <label className="input-label">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input data-testid="login-email" required type="email" className="input pl-9" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="input-label">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input data-testid="login-password" required type="password" className="input pl-9" value={password} onChange={e=>setPassword(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input data-testid="login-remember" type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} className="w-4 h-4 accent-[#39FF14]"/>
              <span className="text-gray-700">Remember me</span>
            </label>
            <Link to="/forgot-password" data-testid="login-forgot" className="text-gray-900 font-semibold hover:underline">Forgot?</Link>
          </div>

          {err && <p className="text-sm text-red-600" data-testid="login-error">{err}</p>}

          <button disabled={busy} data-testid="login-submit" className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50">
            {busy && <Loader2 size={16} className="animate-spin"/>} Sign in
          </button>

          <p className="text-sm text-gray-600 pt-2">
            New to EditCol? <Link to="/register" className="font-semibold text-gray-900 hover:underline">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
