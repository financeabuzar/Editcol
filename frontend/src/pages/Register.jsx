import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import api, { formatApiError } from "@/lib/api";
import Logo from "@/components/Logo";
import PhoneInput from "@/components/PhoneInput";
import OtpInput from "@/components/OtpInput";
import { COUNTRIES } from "@/constants/countries";
import { Loader2, CheckCircle2, Mail, Phone as PhoneIcon, ArrowRight } from "lucide-react";

export default function Register() {
  const { register, refresh } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const initialRole = sp.get("role") === "editor" ? "editor" : "client";

  // step: 1 = account, 2 = email otp, 3 = phone otp, 4 = done
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: initialRole });
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const [otpDev, setOtpDev] = useState(null);
  const [emailOtp, setEmailOtp] = useState(""); const [phoneOtp, setPhoneOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const fullPhone = `${country.dial}${phone}`;

  const submit = async (e) => {
    e?.preventDefault();
    setBusy(true); setErr("");
    try {
      const payload = { ...form, phone: fullPhone };
      const data = await register(payload);
      setOtpDev(data.otp_dev || null);
      setStep(2);
    } catch (e) { setErr(formatApiError(e)); }
    finally { setBusy(false); }
  };

  const verify = async (type) => {
    const otp = type === "email" ? emailOtp : phoneOtp;
    try {
      await api.post("/auth/verify-otp", { email: form.email, otp, type });
      if (type === "email") { setEmailVerified(true); setStep(3); }
      else { setPhoneVerified(true); setStep(4); }
      await refresh();
    } catch (e) { alert(formatApiError(e)); }
  };

  const resend = async (type) => {
    try {
      const { data } = await api.post("/auth/resend-otp", { email: form.email, type });
      setOtpDev(prev => ({ ...(prev || {}), [`${type}_otp`]: data.otp_dev }));
    } catch (e) { alert(formatApiError(e)); }
  };

  const finish = () => nav(form.role === "editor" ? "/editor/onboarding" : "/dashboard");

  const totalSteps = 3;
  const stepIndex = Math.min(step, totalSteps);

  return (
    <div className="min-h-screen grid md:grid-cols-2 fade-in">
      {/* LEFT panel */}
      <div className="hidden md:flex bg-ink relative overflow-hidden p-12 items-end">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full" style={{background:"radial-gradient(circle, rgba(57,255,20,0.35), transparent 70%)"}}/>
        <div className="absolute -bottom-40 -right-40 w-[28rem] h-[28rem] rounded-full" style={{background:"radial-gradient(circle, rgba(223,255,0,0.28), transparent 70%)"}}/>
        <div className="relative text-white max-w-sm">
          <Logo size="lg" as="div"/>
          <p className="mt-8 font-heading text-3xl leading-tight">Join EditCol.<br/>Trust starts with verification.</p>
          <ul className="mt-6 space-y-2 text-sm text-gray-300">
            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#39FF14]"/> Email + phone verification</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#39FF14]"/> Verified Editor badge</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#39FF14]"/> Pro · Top Rated · Elite tiers</li>
          </ul>
        </div>
      </div>

      {/* RIGHT panel */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="md:hidden mb-6"><Logo/></div>

          {/* progress dots */}
          <div className="mb-6 flex items-center gap-2">
            {[1,2,3].map(i => (
              <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-gray-100">
                <div className={`h-full transition-all ${stepIndex >= i ? "bg-neon-grad" : ""}`} style={{ width: stepIndex >= i ? "100%" : "0%" }} />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mb-6">
            Step {stepIndex} of {totalSteps} — {step===1?"Account":step===2?"Verify email":step===3?"Verify phone":"Done"}
          </p>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form key="s1" onSubmit={submit}
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
                className="space-y-4" data-testid="register-form">
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
                  <label className="input-label">Phone</label>
                  <PhoneInput country={country} setCountry={setCountry} phone={phone} setPhone={setPhone} testId="reg-phone"/>
                </div>
                <div>
                  <label className="input-label">Password</label>
                  <input data-testid="reg-password" required type="password" minLength={6} className="input" value={form.password} onChange={e=>set("password", e.target.value)} />
                </div>

                <p className="text-xs text-gray-500">By continuing, you accept our <Link to="/legal/terms" className="font-semibold text-gray-900 hover:underline">Terms</Link> and <Link to="/legal/privacy" className="font-semibold text-gray-900 hover:underline">Privacy Policy</Link>.</p>

                {err && <p className="text-sm text-red-600" data-testid="register-error">{err}</p>}
                <button disabled={busy || !phone} data-testid="register-submit" className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50">
                  {busy && <Loader2 size={16} className="animate-spin"/>} Continue <ArrowRight size={16}/>
                </button>
                <p className="text-sm text-gray-600 pt-2">Already have an account? <Link to="/login" className="font-semibold text-gray-900 hover:underline">Sign in</Link></p>
              </motion.form>
            )}

            {step === 2 && (
              <motion.div key="s2"
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
                className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-ink text-white flex items-center justify-center"><Mail size={18} className="text-[#39FF14]"/></div>
                  <div>
                    <h1 className="font-heading text-2xl font-bold text-gray-900">Verify your email</h1>
                    <p className="text-xs text-gray-500">Enter the 6-digit code we sent</p>
                  </div>
                </div>
                {otpDev?.email_otp && (
                  <div className="card p-3 bg-gray-50 border-dashed border-gray-300 text-xs text-gray-700 font-mono">
                    📨 Dev code: <span className="font-bold text-gray-900">{otpDev.email_otp}</span>
                  </div>
                )}
                <OtpInput
                  label="Email code" dest={form.email}
                  verified={emailVerified} value={emailOtp} onChange={setEmailOtp}
                  onVerify={()=>verify("email")} onResend={()=>resend("email")}
                  testId="otp-email"
                />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3"
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
                className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-ink text-white flex items-center justify-center"><PhoneIcon size={18} className="text-[#39FF14]"/></div>
                  <div>
                    <h1 className="font-heading text-2xl font-bold text-gray-900">Verify your phone</h1>
                    <p className="text-xs text-gray-500">Enter the 6-digit code we sent</p>
                  </div>
                </div>
                {otpDev?.phone_otp && (
                  <div className="card p-3 bg-gray-50 border-dashed border-gray-300 text-xs text-gray-700 font-mono">
                    📱 Dev code: <span className="font-bold text-gray-900">{otpDev.phone_otp}</span>
                  </div>
                )}
                <OtpInput
                  label="Phone code" dest={fullPhone}
                  verified={phoneVerified} value={phoneOtp} onChange={setPhoneOtp}
                  onVerify={()=>verify("phone")} onResend={()=>resend("phone")}
                  testId="otp-phone"
                />
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="s4"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="space-y-5 text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-neon-grad mx-auto flex items-center justify-center">
                  <CheckCircle2 size={32} className="text-ink"/>
                </div>
                <h1 className="font-heading text-3xl font-bold text-gray-900">You're verified!</h1>
                <p className="text-gray-500">Email and phone confirmed. Welcome to EditCol.</p>
                <button onClick={finish} data-testid="verify-finish" className="btn-primary inline-flex items-center gap-2">
                  Continue <ArrowRight size={16}/>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {(step === 2 || step === 3) && (
            <button onClick={finish} className="mt-6 text-xs text-gray-500 hover:text-gray-900 underline" data-testid="skip-verify">
              I'll verify later
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
