import { useCallback, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import api, { formatApiError } from "@/lib/api";
import AuthLeftPanel from "@/components/AuthLeftPanel";
import OtpInput from "@/components/OtpInput";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  RefreshCw,
  Mail,
  Lock,
} from "lucide-react";

/* ─── Google G icon (inline SVG so no extra dep) ─── */
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

export default function Login() {
  const { login, verifyLoginOtp, googleAuth } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  /* form state */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  /* OTP step */
  const [step, setStep] = useState("password"); // "password" | "otp"
  const [loginEmail, setLoginEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpDev, setOtpDev] = useState(null);

  /* UI state */
  const [busy, setBusy] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [err, setErr] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");

  const redirect = useCallback(
    (u) => {
      if (u.role !== "admin" && !u.onboarding_completed) {
        nav("/onboarding");
        return;
      }
      nav(loc.state?.from || (u.role === "admin" ? "/admin" : "/dashboard"));
    },
    [loc.state?.from, nav]
  );

  /* ─── Google sign-in ─── */
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

  /* Initialise Google once on mount */
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
            const u = await googleAuth(credential, "pending", remember);
            redirect(u);
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

  /* ─── Email / password submit ─── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setBusy(true);
    setErr("");
    try {
      const result = await login(email.trim(), password, remember);
      if (result?.login_otp_required) {
        setLoginEmail(result.email);
        setOtpDev(result.otp_dev || null);
        setStep("otp");
        return;
      }
      redirect(result);
    } catch (e) {
      setErr(formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  /* ─── OTP verify ─── */
  const verifyOtp = async () => {
    try {
      const u = await verifyLoginOtp(loginEmail, otp, remember);
      redirect(u);
    } catch (e) {
      setErr(formatApiError(e));
    }
  };

  const resendOtp = async () => {
    try {
      const { data } = await api.post("/auth/resend-login-otp", { email: loginEmail });
      setOtpDev(data.otp_dev || null);
    } catch (e) {
      setErr(formatApiError(e));
    }
  };

  /* ─── Forgot password ─── */
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErr("Enter your email address first, then click Forgot password.");
      return;
    }
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setForgotMsg(`Password reset instructions sent to ${email.trim()}`);
      setTimeout(() => setForgotMsg(""), 5000);
    } catch (e) {
      setErr(formatApiError(e));
    }
  };

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
          className="w-full min-h-screen md:min-h-0 bg-card md:border md:border-border md:rounded-2xl lg:rounded-3xl flex flex-col lg:flex-row gap-0 lg:h-[680px] md:shadow-[0_30px_100px_rgba(0,0,0,0.2)] dark:md:shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-visible lg:overflow-hidden"
        >
          {/* Left branding panel */}
          <AuthLeftPanel isSignUp={false} />

          {/* Right form area */}
          <div className="flex-1 flex flex-col justify-center px-5 pt-6 pb-8 md:px-8 lg:px-12 relative overflow-visible lg:overflow-y-auto min-h-0 lg:max-h-full">
            <AnimatePresence mode="wait">
              {step === "password" ? (
                <motion.div
                  key="login-password-step"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="w-full max-w-md mx-auto"
                >
                  {/* Title */}
                  <div className="text-center lg:text-left mb-8">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">Log In</h2>
                    <p className="text-sm text-muted-foreground">Enter your registered details to access EditCol.</p>
                  </div>

                  {/* Forgot-password toast */}
                  <AnimatePresence>
                    {forgotMsg && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mb-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs text-purple-600 dark:text-purple-300 font-medium text-center"
                      >
                        {forgotMsg}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Google button */}
                  <button
                    type="button"
                    data-testid="login-google"
                    disabled={googleLoading || busy}
                    onClick={handleGoogleClick}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border bg-background hover:bg-secondary text-foreground font-medium text-sm transition-all duration-200 hover:border-foreground/20 disabled:opacity-50 mb-2"
                  >
                    {googleLoading ? <Loader2 className="w-4 h-4 animate-spin text-purple-500" /> : <GoogleIcon />}
                    <span>Continue with Google</span>
                  </button>

                  <Divider />

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block" htmlFor="login-email">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          id="login-email"
                          data-testid="login-email"
                          type="email"
                          autoComplete="email"
                          spellCheck={false}
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block" htmlFor="login-password">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-500 font-bold transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          id="login-password"
                          data-testid="login-password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="w-full pl-10 pr-11 py-3 rounded-xl bg-background border border-border text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all"
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
                    </div>

                    {/* Remember me */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        data-testid="login-remember"
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="h-4 w-4 rounded accent-purple-500"
                      />
                      <span className="text-sm text-muted-foreground">Remember me</span>
                    </label>

                    {/* Error */}
                    {err && <p className="text-xs text-red-400 font-medium" data-testid="login-error">{err}</p>}

                    {/* Submit */}
                    <button
                      type="submit"
                      data-testid="login-submit"
                      disabled={busy || googleLoading}
                      className="w-full mt-2 py-3.5 rounded-xl bg-foreground hover:bg-foreground/90 text-background font-bold text-sm tracking-tight transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-foreground/5 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
                    >
                      {busy ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Verifying…</span>
                        </>
                      ) : (
                        <>
                          <span>Log In</span>
                          <LogIn className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Switch to register */}
                  <div className="text-center mt-8">
                    <p className="text-sm text-muted-foreground">
                      Don&apos;t have an account yet?{" "}
                      <Link
                        to="/register"
                        className="text-foreground hover:text-purple-500 font-bold transition-all underline decoration-border hover:decoration-purple-500 underline-offset-4"
                      >
                        Sign up
                      </Link>
                    </p>
                  </div>
                </motion.div>
              ) : (
                /* ─── OTP step ─── */
                <motion.div
                  key="login-otp-step"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="w-full max-w-md mx-auto space-y-4"
                >
                  <div className="text-center lg:text-left mb-6">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">Verify your login</h2>
                    <p className="text-sm text-muted-foreground">Enter the 6-digit code we sent to your email.</p>
                  </div>

                  {/* Dev OTP display */}
                  {otpDev?.login_otp && (
                    <div className="p-3 bg-secondary border border-dashed border-border rounded-xl font-mono text-xs text-muted-foreground">
                      Dev code:{" "}
                      <span className="font-bold text-foreground">{otpDev.login_otp}</span>
                    </div>
                  )}

                  {err && <p className="text-xs text-red-400 font-medium">{err}</p>}

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

                  <button
                    type="button"
                    onClick={() => { setStep("password"); setOtp(""); setErr(""); setLoginEmail(""); }}
                    className="text-xs text-muted-foreground underline hover:text-foreground transition-colors"
                  >
                    ← Use a different email
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
