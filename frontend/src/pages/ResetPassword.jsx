import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import Logo from "@/components/Logo";

export default function ResetPassword() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const [token, setToken] = useState(sp.get("token") || "");
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault(); setErr("");
    if (pw.length < 6) return setErr("Password must be at least 6 characters");
    if (pw !== pw2) return setErr("Passwords do not match");
    setBusy(true);
    try { await api.post("/auth/reset-password", { token, new_password: pw }); alert("Password reset successfully"); nav("/login"); }
    catch (e) { setErr(formatApiError(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 fade-in">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <Logo />
        <h1 className="font-heading text-3xl font-bold text-gray-900 mt-6">Set a new password</h1>

        <div>
          <label className="input-label">Reset token</label>
          <input data-testid="rp-token" required className="input font-mono text-xs" value={token} onChange={e=>setToken(e.target.value)}/>
        </div>
        <div>
          <label className="input-label">New password</label>
          <input data-testid="rp-password" required type="password" minLength={6} className="input" value={pw} onChange={e=>setPw(e.target.value)}/>
        </div>
        <div>
          <label className="input-label">Confirm password</label>
          <input data-testid="rp-password2" required type="password" minLength={6} className="input" value={pw2} onChange={e=>setPw2(e.target.value)}/>
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}
        <button disabled={busy} data-testid="rp-submit" className="btn-primary w-full disabled:opacity-50">Reset password</button>

        <p className="text-sm text-gray-600 pt-2"><Link to="/login" className="font-semibold text-gray-900 hover:underline">Back to sign in</Link></p>
      </form>
    </div>
  );
}
