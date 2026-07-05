import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { formatApiError } from "@/lib/api";
import Logo from "@/components/Logo";
import PhoneInput from "@/components/PhoneInput";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { COUNTRIES } from "@/constants/countries";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

export default function Register() {
  const { register, refresh, googleAuth } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const fullPhone = `${country.dial}${phone}`;
  const finish = useCallback(() => nav("/onboarding", { replace: true }), [nav]);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await register({ ...form, phone: fullPhone });
      await refresh();
      finish();
    } catch (e) {
      setErr(formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = useCallback(async (credential) => {
    setBusy(true);
    setErr("");
    try {
      await googleAuth(credential, "pending", true);
      finish();
    } catch (e) {
      setErr(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }, [finish, googleAuth]);

  return (
    <div className="min-h-screen grid md:grid-cols-2 fade-in">
      <div className="hidden md:flex bg-ink relative overflow-hidden p-12 items-end">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full" style={{ background: "radial-gradient(circle, rgba(57,255,20,0.35), transparent 70%)" }} />
        <div className="absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full" style={{ background: "radial-gradient(circle, rgba(223,255,0,0.28), transparent 70%)" }} />
        <div className="relative max-w-sm text-white">
          <Logo size="lg" as="div" />
          <p className="mt-8 font-heading text-3xl leading-tight">Welcome to EditCol.</p>
          <ul className="mt-6 space-y-2 text-sm text-gray-300">
            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#39FF14]" /> Build a hiring or editing profile</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#39FF14]" /> Verified portfolios and richer profiles</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#39FF14]" /> Projects, messages, and reviews in one place</li>
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-md space-y-4"
          data-testid="register-form"
        >
          <div className="md:hidden mb-6"><Logo /></div>
          <h1 className="font-heading text-3xl font-bold text-gray-900">Welcome to EditCol</h1>

          <GoogleAuthButton onCredential={handleGoogle} text="continue_with" disabled={busy} />
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-gray-400">
            <div className="h-px flex-1 bg-gray-200" />
            <span>OR</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div>
            <label className="input-label">Full Name</label>
            <input data-testid="reg-name" required className="input" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className="input-label">Email</label>
            <input data-testid="reg-email" required type="email" className="input" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div>
            <label className="input-label">Phone</label>
            <PhoneInput country={country} setCountry={setCountry} phone={phone} setPhone={setPhone} testId="reg-phone" />
          </div>
          <div>
            <label className="input-label">Password</label>
            <input data-testid="reg-password" required type="password" minLength={6} className="input" value={form.password} onChange={(e) => set("password", e.target.value)} />
          </div>

          <p className="text-xs text-gray-500">
            By continuing, you accept our <Link to="/legal/terms" className="font-semibold text-gray-900 hover:underline">Terms</Link> and <Link to="/legal/privacy" className="font-semibold text-gray-900 hover:underline">Privacy Policy</Link>.
          </p>

          {err && <p className="text-sm text-red-600" data-testid="register-error">{err}</p>}
          <button disabled={busy || !phone} data-testid="register-submit" className="btn-primary inline-flex w-full items-center justify-center gap-2 disabled:opacity-50">
            {busy && <Loader2 size={16} className="animate-spin" />} Create Account <ArrowRight size={16} />
          </button>
          <p className="pt-2 text-sm text-gray-600">
            Already have an account? <Link to="/login" className="font-semibold text-gray-900 hover:underline">Sign in</Link>
          </p>
        </motion.form>
      </div>
    </div>
  );
}
