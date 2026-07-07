import { useCallback, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { formatApiError } from "@/lib/api";
import AuthLeftPanel from "@/components/AuthLeftPanel";
import PhoneInput from "@/components/PhoneInput";
import ThemeToggle from "@/components/ThemeToggle";
import { COUNTRIES } from "@/constants/countries";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

const DEFAULT_COUNTRY = COUNTRIES.find((c) => c.iso === "IN") || COUNTRIES[0];

/* ─── Google G icon ─── */
function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

/* ─── Divider ─── */
function Divider() {
  return (
    <div className="relative flex items-center justify-center my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <span className="relative px-3 bg-card text-xs text-muted-foreground uppercase font-mono tracking-wider">
        Or
      </span>
    </div>
  );
}

export default function Register() {
  const { register, refresh, googleAuth } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const defaultRole = params.get("role") === "editor" ? "editor" : "pending";

  /* form state */
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState("");

  /* errors */
  const [errors, setErrors] = useState({});

  /* UI state */
  const [busy, setBusy] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [err, setErr] = useState("");

  const finish = useCallback(() => nav("/onboarding", { replace: true }), [nav]);

  /* ─── Validate ─── */
  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Full name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email address";
    if (!password) e.password = "Password is required";
    else if (password.length < 8) e.password = "Password must be at least 8 characters";
    if (!phone || phone.length < 7) e.phone = "Enter a valid phone number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ─── Email/password register ─── */
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setBusy(true);
    setErr("");
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: `${country.dial}${phone}`,
        role: defaultRole,
      });
      await refresh();
      finish();
    } catch (e) {
      setErr(formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  /* ─── Google register ─── */
  const handleGoogleClick = useCallback(async () => {
    if (!window.google?.accounts?.id) {
      setErr("Google sign-in is not available. Check your REACT_APP_GOOGLE_CLIENT_ID.");
      return;
    }
    setGoogleLoading(true);
    setErr("");
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        setGoogleLoading(false);
        setErr("Google sign-in was dismissed. Try again.");
      }
    });
  }, []);

  /* Initialise Google once */
  useState(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!clientId) return;
    const init = () => {
      window.google?.accounts?.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          if (!credential) return;
          setGoogleLoading(true);
          setErr("");
          try {
            await googleAuth(credential, defaultRole, true);
            finish();
          } catch (e) {
            setErr(formatApiError(e));
          } finally {
            setGoogleLoading(false);
          }
        },
      });
    };
    if (window.google?.accounts?.id) { init(); return; }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = init;
    document.head.appendChild(script);
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground flex items-center justify-center md:p-8 lg:p-12 overflow-x-hidden overflow-y-auto selection:bg-purple-600 selection:text-white">
      {/* Floating Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle className="h-10 w-10 rounded-full border border-border bg-card text-foreground shadow-sm flex items-center justify-center hover:bg-secondary transition-colors" />
      </div>

      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-900/10 rounded-full pointer-events-none" style={{ filter: "blur(150px)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-950/10 rounded-full pointer-events-none" style={{ filter: "blur(130px)" }} />

      <div className="relative w-full max-w-6xl z-10 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full min-h-screen md:min-h-0 bg-card md:border md:border-border md:rounded-2xl lg:rounded-3xl flex flex-col lg:flex-row gap-0 md:shadow-[0_30px_100px_rgba(0,0,0,0.2)] dark:md:shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-visible lg:overflow-hidden"
        >
          {/* Left branding panel */}
          <AuthLeftPanel isSignUp={true} />

          {/* Right form */}
          <div className="flex-1 flex flex-col justify-center px-5 pt-6 pb-8 md:px-8 lg:px-12 relative overflow-visible lg:overflow-y-auto min-h-0">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-md mx-auto"
            >
              {/* Title */}
              <div className="text-center lg:text-left mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">Create Account</h2>
                <p className="text-sm text-muted-foreground">Enter your personal data to get started on EditCol.</p>
              </div>

              {/* Google button */}
              <button
                type="button"
                data-testid="register-google"
                disabled={googleLoading || busy}
                onClick={handleGoogleClick}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border bg-background hover:bg-secondary text-foreground font-medium text-sm transition-all duration-200 hover:border-foreground/20 disabled:opacity-50 mb-2"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                ) : (
                  <GoogleIcon />
                )}
                <span>Continue with Google</span>
              </button>

              <Divider />

              {/* Global error */}
              <AnimatePresence>
                {err && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-4 text-xs text-red-400 font-medium"
                    data-testid="register-error"
                  >
                    {err}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4" data-testid="register-form">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block" htmlFor="reg-name">
                    Full Name
                  </label>
                  <input
                    id="reg-name"
                    data-testid="reg-name"
                    type="text"
                    autoComplete="name"
                    placeholder="e.g. John Frans"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl bg-background border text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all ${errors.name ? "border-red-500/80" : "border-border"}`}
                  />
                  {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block" htmlFor="reg-email">
                    Email
                  </label>
                  <input
                    id="reg-email"
                    data-testid="reg-email"
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl bg-background border text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all ${errors.email ? "border-red-500/80" : "border-border"}`}
                  />
                  {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block" htmlFor="reg-phone-number">
                    Phone
                  </label>
                  <PhoneInput
                    country={country}
                    setCountry={setCountry}
                    phone={phone}
                    setPhone={setPhone}
                    testId="reg-phone"
                  />
                  {errors.phone && <p className="text-xs text-red-400">{errors.phone}</p>}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block" htmlFor="reg-password">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      data-testid="reg-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-4 pr-11 py-3 rounded-xl bg-background border text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all ${errors.password ? "border-red-500/80" : "border-border"}`}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password ? (
                    <p className="text-xs text-red-400">{errors.password}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Must be at least 8 characters.</p>
                  )}
                </div>

                {/* Terms */}
                <p className="text-xs text-muted-foreground">
                  By continuing, you accept our{" "}
                  <Link to="/legal/terms" className="text-foreground/80 hover:text-foreground underline underline-offset-2">Terms</Link>{" "}
                  and{" "}
                  <Link to="/legal/privacy" className="text-foreground/80 hover:text-foreground underline underline-offset-2">Privacy Policy</Link>.
                </p>

                {/* Submit */}
                <button
                  type="submit"
                  data-testid="register-submit"
                  disabled={busy || googleLoading}
                  className="w-full mt-2 py-3.5 rounded-xl bg-foreground hover:bg-foreground/90 text-background font-bold text-sm tracking-tight transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-foreground/5 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
                >
                  {busy ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating Account…</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Benefits bullets (mobile) */}
              <ul className="lg:hidden mt-6 space-y-2 text-xs text-muted-foreground">
                {[
                  "Build a hiring or editing profile",
                  "Verified portfolios and rich profiles",
                  "Projects, messages, and reviews in one place",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-purple-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              {/* Switch to login */}
              <div className="text-center mt-8">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-foreground hover:text-purple-500 font-bold transition-all underline decoration-border hover:decoration-purple-500 underline-offset-4"
                  >
                    Log in
                  </Link>
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
