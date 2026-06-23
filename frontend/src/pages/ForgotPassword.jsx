import { useState } from "react";
import { Link } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import Logo from "@/components/Logo";

export default function ForgotPassword() {
  const [email, setEmail] = useState(""); const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false); const [resetToken, setResetToken] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setDone(true); setResetToken(data.reset_token_dev || "");
    } catch (e) { setErr(formatApiError(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 fade-in">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <Logo />
        <h1 className="font-heading text-3xl font-bold text-gray-900 mt-6">Forgot password?</h1>
        <p className="text-sm text-gray-500">We'll email you a reset link.</p>

        <div>
          <label className="input-label">Email</label>
          <input data-testid="fp-email" required type="email" className="input" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}

        {done ? (
          <div className="card p-4 bg-gray-50 border-dashed text-sm">
            <p className="text-gray-700">✅ If an account exists, a reset link was sent.</p>
            {resetToken && (
              <p className="mt-2 text-xs text-gray-500 font-mono break-all">Dev token: <Link to={`/reset-password?token=${resetToken}`} className="text-gray-900 font-semibold underline">{resetToken}</Link></p>
            )}
          </div>
        ) : (
          <button disabled={busy} data-testid="fp-submit" className="btn-primary w-full disabled:opacity-50">Send reset link</button>
        )}

        <p className="text-sm text-gray-600 pt-2"><Link to="/login" className="font-semibold text-gray-900 hover:underline">Back to sign in</Link></p>
      </form>
    </div>
  );
}
