import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api, { formatApiError } from "@/lib/api";
import Logo from "@/components/Logo";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function Register() {
  const { register, refresh } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "client" });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const [otpDev, setOtpDev] = useState(null);
  const [emailOtp, setEmailOtp] = useState(""); const [phoneOtp, setPhoneOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setBusy(true); setErr("");
    try {
      const data = await register(form);
      setOtpDev(data.otp_dev || null);
      setStep(2);
    } catch (e) { setErr(formatApiError(e)); }
    finally { setBusy(false); }
  };

  const verify = async (type) => {
    const otp = type === "email" ? emailOtp : phoneOtp;
    try {
      await api.post("/auth/verify-otp", { email: form.email, otp, type });
      if (type === "email") setEmailVerified(true); else setPhoneVerified(true);
      await refresh();
    } catch (e) { alert(formatApiError(e)); }
  };

  const resend = async (type) => {
    try {
      const { data } = await api.post("/auth/resend-otp", { email: form.email, type });
      setOtpDev(prev => ({ ...(prev||{}), [`${type}_otp`]: data.otp_dev }));
      alert(`New OTP (dev): ${data.otp_dev}`);
    } catch (e) { alert(formatApiError(e)); }
  };

  const finish = () => nav(form.role === "editor" ? "/editor/onboarding" : "/dashboard");

  return (
    <div className="min-h-screen grid md:grid-cols-2 fade-in">
      <div className="hidden md:flex bg-ink relative overflow-hidden p-12 items-end">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full" style={{background:"radial-gradient(circle, rgba(57,255,20,0.35), transparent 70%)"}}/>
        <div className="relative text-white max-w-sm">
          <Logo size="lg" as="div" />
          <p className="mt-8 font-heading text-3xl leading-tight">Join EditCol.<br/>Trust starts with verification.</p>
          <ul className="mt-6 space-y-2 text-sm text-gray-300">
            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#39FF14]"/> Email + phone verification</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#39FF14]"/> Get a Verified Editor badge</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#39FF14]"/> Earn Pro / Top Rated / Elite tiers</li>
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="md:hidden mb-6"><Logo/></div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-neon-grad transition-all" style={{ width: step === 1 ? "33%" : (emailVerified && phoneVerified ? "100%" : "66%") }}/>
            </div>
            <p className="mt-2 text-xs text-gray-500">Step {step === 1 ? "1 of 2 — Account" : "2 of 2 — Verify"}</p>
          </div>

          {step === 1 ? (
            <form onSubmit={(e)=>{e.preventDefault(); submit();}} className="space-y-4" data-testid="register-form">
              <h1 className="font-heading text-3xl font-bold text-gray-900">Create your account</h1>
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-full">
                {["client","editor"].map(r => (
                  <button type="button" key={r} onClick={()=>set("role", r)} data-testid={`role-${r}`}
                    className={`text-sm py-2 rounded-full font-semibold transition-all ${form.role===r ? "bg-ink text-white" : "text-gray-700"}`}>
                    I'm a {r}
                  </button>
                ))}
              </div>

              <div>
                <label className="input-label">Full name</label>
                <input data-testid="reg-name" required className="input" value={form.name} onChange={e=>set("name", e.target.value)} />
              </div>
              <div>
                <label className="input-label">Email</label>
                <input data-testid="reg-email" required type="email" className="input" value={form.email} onChange={e=>set("email", e.target.value)} />
              </div>
              <div>
                <label className="input-label">Phone (+country code)</label>
                <input data-testid="reg-phone" required className="input" value={form.phone} onChange={e=>set("phone", e.target.value)} placeholder="+14155551234"/>
              </div>
              <div>
                <label className="input-label">Password</label>
                <input data-testid="reg-password" required type="password" minLength={6} className="input" value={form.password} onChange={e=>set("password", e.target.value)} />
              </div>

              <p className="text-xs text-gray-500">By continuing, you accept our <Link to="/legal/terms" className="font-semibold text-gray-900 hover:underline">Terms</Link> and <Link to="/legal/privacy" className="font-semibold text-gray-900 hover:underline">Privacy Policy</Link>.</p>

              {err && <p className="text-sm text-red-600" data-testid="register-error">{err}</p>}
              <button disabled={busy} data-testid="register-submit" className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50">
                {busy && <Loader2 size={16} className="animate-spin"/>} Continue
              </button>
              <p className="text-sm text-gray-600 pt-2">Already have an account? <Link to="/login" className="font-semibold text-gray-900 hover:underline">Sign in</Link></p>
            </form>
          ) : (
            <div className="space-y-5">
              <h1 className="font-heading text-3xl font-bold text-gray-900">Verify your account</h1>
              <p className="text-sm text-gray-500">We sent codes to your email and phone. (Dev mode: codes shown below.)</p>

              {otpDev && (
                <div className="card p-4 bg-gray-50 border-dashed border-gray-300 text-xs text-gray-700 font-mono">
                  📨 Email OTP: <span className="font-bold text-gray-900">{otpDev.email_otp}</span><br/>
                  📱 Phone OTP: <span className="font-bold text-gray-900">{otpDev.phone_otp}</span>
                </div>
              )}

              <OtpRow label="Email OTP" verified={emailVerified} value={emailOtp} onChange={setEmailOtp}
                onVerify={()=>verify("email")} onResend={()=>resend("email")} testId="otp-email"/>
              <OtpRow label="Phone OTP" verified={phoneVerified} value={phoneOtp} onChange={setPhoneOtp}
                onVerify={()=>verify("phone")} onResend={()=>resend("phone")} testId="otp-phone"/>

              <button disabled={!emailVerified || !phoneVerified} onClick={finish} data-testid="verify-finish"
                className="btn-primary w-full disabled:opacity-50">
                {emailVerified && phoneVerified ? "Continue" : "Verify both to continue"}
              </button>
              <button onClick={finish} className="text-xs text-gray-500 hover:text-gray-900 underline" data-testid="skip-verify">
                Verify later
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OtpRow({ label, verified, value, onChange, onVerify, onResend, testId }) {
  return (
    <div className="card p-4">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        {verified && <span className="badge badge-pro">Verified</span>}
      </div>
      {!verified && (
        <div className="flex gap-2">
          <input data-testid={`${testId}-input`} maxLength={6} className="input font-mono tracking-widest text-center" value={value} onChange={e=>onChange(e.target.value)} placeholder="000000"/>
          <button data-testid={`${testId}-verify`} onClick={onVerify} className="btn-dark text-sm whitespace-nowrap">Verify</button>
        </div>
      )}
      {!verified && <button onClick={onResend} className="text-xs text-gray-500 hover:text-gray-900 underline mt-2">Resend code</button>}
    </div>
  );
}
