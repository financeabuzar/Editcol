import { useCallback, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api, { formatApiError } from "@/lib/api";
import Logo from "@/components/Logo";
import OtpInput from "@/components/OtpInput";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { Loader2, Lock, Mail } from "lucide-react";

export default function Login() {
  const { login, verifyLoginOtp, googleAuth } = useAuth();
  const nav = useNavigate(); const loc = useLocation();
  const [identifier, setIdentifier] = useState(""); const [password, setPassword] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [remember, setRemember] = useState(true);
  const [otp, setOtp] = useState("");
  const [otpDev, setOtpDev] = useState(null);
  const [step, setStep] = useState("password");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");

  const goAfterLogin = useCallback((u) => {
    const dest = u.role === "admin" ? "/admin" : "/dashboard";
    nav(loc.state?.from || dest);
  }, [loc.state?.from, nav]);

  const handleGoogle = useCallback(async (credential) => {
    setBusy(true); setErr("");
    try {
      const u = await googleAuth(credential, "client", remember);
      goAfterLogin(u);
    } catch (e) { setErr(formatApiError(e)); }
    finally { setBusy(false); }
  }, [goAfterLogin, googleAuth, remember]);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const result = await login(identifier.trim(), password, remember);
      if (result.login_otp_required) {
        setLoginEmail(result.email);
        setOtpDev(result.otp_dev || null);
        setStep("otp");
        return;
      }
      goAfterLogin(result);
    } catch (e) { setErr(formatApiError(e)); } finally { setBusy(false); }
  };

  const verifyOtp = async () => {
    try {
      const u = await verifyLoginOtp(loginEmail, otp, remember);
      goAfterLogin(u);
    } catch (e) { setErr(formatApiError(e)); }
  };

  const resendOtp = async () => {
    try {
      const { data } = await api.post("/auth/resend-login-otp", { email: loginEmail });
      setOtpDev(data.otp_dev || null);
    } catch (e) { setErr(formatApiError(e)); }
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
          <h1 className="font-heading text-3xl font-bold text-gray-900">{step === "otp" ? "Verify your login" : "Sign in to EditCol"}</h1>

          {step === "password" ? (
            <>
              <GoogleAuthButton onCredential={handleGoogle} disabled={busy} />
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <div className="h-px flex-1 bg-gray-200" />
                <span>or</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              <div>
                <label className="input-label">Email or phone</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input data-testid="login-email" required type="text" className="input pl-9" value={identifier} onChange={e=>setIdentifier(e.target.value)} />
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
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Enter the 6-digit code we sent to your email.</p>
              {otpDev?.login_otp && (
                <div className="card p-3 bg-gray-50 border-dashed border-gray-300 text-xs text-gray-700 font-mono">
                  Dev code: <span className="font-bold text-gray-900">{otpDev.login_otp}</span>
                </div>
              )}
              <OtpInput
                label="Login code"
                dest={loginEmail}
                verified={false}
                value={otp}
                onChange={setOtp}
                onVerify={verifyOtp}
                onResend={resendOtp}
                testId="login-otp"
              />
              {err && <p className="text-sm text-red-600" data-testid="login-error">{err}</p>}
              <button
                type="button"
                onClick={() => { setStep("password"); setOtp(""); setErr(""); setLoginEmail(""); }}
                className="text-xs text-gray-500 hover:text-gray-900 underline"
              >
                Use a different email or phone
              </button>
            </div>
          )}

          <p className="text-sm text-gray-600 pt-2">
            New to EditCol? <Link to="/register" className="font-semibold text-gray-900 hover:underline">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
