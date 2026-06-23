import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";
import TiltCard from "@/components/TiltCard";
import { motion } from "framer-motion";
import { CheckCircle2, Wand2, Briefcase, Loader2 } from "lucide-react";

/**
 * "Become an editor" flow for users who are already logged in.
 *   - If not logged in → redirects to /register?role=editor
 *   - If logged in as client → upgrades the role to editor (creates editor doc) and goes to onboarding
 *   - If already editor / admin → just goes to onboarding
 */
export default function BecomeEditor() {
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (user === false) {
    // not logged in — push to register
    nav("/register?role=editor", { replace: true });
    return null;
  }
  if (user && (user.role === "editor" || user.role === "admin")) {
    nav("/editor/onboarding", { replace: true });
    return null;
  }

  const upgrade = async () => {
    setBusy(true); setErr("");
    try {
      await api.post("/auth/upgrade-to-editor");
      await refresh();
      nav("/editor/onboarding", { replace: true });
    } catch (e) { setErr(formatApiError(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="fade-in min-h-screen flex items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }} className="w-full max-w-2xl">
        <Logo size="lg"/>
        <TiltCard className="card p-8 sm:p-10 mt-6" maxTilt={3}>
          <p className="text-xs font-bold tracking-wider uppercase text-gray-500">Upgrade your account</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900 mt-2">Become an editor on EditCol</h1>
          <p className="mt-3 text-gray-600">
            You're already signed in as <span className="font-semibold text-gray-900">{user?.name}</span>. We'll add an editor profile to your account — no new signup needed.
          </p>

          <div className="mt-6 space-y-3">
            {[
              { Icon: CheckCircle2, t: "Keep your existing login", d: "Same email, same password, same trusted account." },
              { Icon: Briefcase,    t: "Build a public profile",    d: "Add a bio, portfolio, skills, and pricing — go live after email + phone verification." },
              { Icon: Wand2,        t: "Appear in AI Match",         d: "Verified editors are ranked by our AI matcher for every new project." },
            ].map(it => (
              <div key={it.t} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-ink text-white flex items-center justify-center shrink-0">
                  <it.Icon size={16} className="text-[#39FF14]"/>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{it.t}</p>
                  <p className="text-sm text-gray-600">{it.d}</p>
                </div>
              </div>
            ))}
          </div>

          {err && <p className="mt-4 text-sm text-red-600">{err}</p>}

          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={upgrade} disabled={busy} data-testid="upgrade-to-editor"
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-50">
              {busy && <Loader2 size={14} className="animate-spin"/>} Create my editor profile
            </button>
            <button onClick={()=>nav("/dashboard")} className="btn-outline">Not now</button>
          </div>
        </TiltCard>
      </motion.div>
    </div>
  );
}
