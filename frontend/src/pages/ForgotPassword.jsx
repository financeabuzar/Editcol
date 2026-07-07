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
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8 fade-in relative overflow-hidden selection:bg-purple-600 selection:text-white">
      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-purple-900/5 rounded-full pointer-events-none" style={{ filter: "blur(100px)" }} />
      
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 relative z-10">
        <Logo className="mb-4" />
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-black text-foreground">Forgot password?</h1>
          <p className="text-sm text-muted-foreground">We'll email you a password reset link.</p>
        </div>

        <div>
          <label className="input-label">Email Address</label>
          <input data-testid="fp-email" required type="email" placeholder="your@email.com" className="input" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>

        {err && <p className="text-xs text-red-400 font-medium">{err}</p>}

        {done ? (
          <div className="card p-4 bg-[#08080A]/30 border-dashed text-sm">
            <p className="text-foreground">✅ If an account exists, a reset link was sent.</p>
            {resetToken && (
              <p className="mt-3 text-xs text-muted-foreground font-mono break-all bg-foreground/5 p-2 rounded-lg">
                Dev token: <Link to={`/reset-password?token=${resetToken}`} className="text-foreground font-bold hover:text-primary transition-colors underline">{resetToken}</Link>
              </p>
            )}
          </div>
        ) : (
          <button disabled={busy} data-testid="fp-submit" className="btn-primary w-full disabled:opacity-50">Send reset link</button>
        )}

        <p className="text-sm text-muted-foreground pt-2">
          <Link to="/login" className="font-bold text-foreground hover:text-primary transition-colors underline decoration-border hover:decoration-primary underline-offset-4">
            Back to sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
