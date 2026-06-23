import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, ArrowRight, Sparkles, Loader2, MessageSquare, Briefcase, Star } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import TrustBadges from "@/components/TrustBadges";
import TiltCard from "@/components/TiltCard";
import AiOrb from "@/components/AiOrb";

const CONTENT_TYPES = ["YouTube Long Form","Shorts","Documentary","Finance","Podcast","Gaming","Wedding","Corporate","Ad/Commercial","Other"];
const STYLES = ["Cinematic","Fast-paced","Vlog","Documentary","Minimal","Trendy/Viral","Other"];
const SIZES = ["< 5GB","< 10GB","10-50GB","50-200GB","> 200GB"];

export default function AIMatch() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    content_type: "YouTube Long Form", editing_style: "Cinematic",
    motion_graphics: false, footage_size: "< 10GB",
    budget: "", deadline: "7d", customDate: "",
  });
  const [busy, setBusy] = useState(false);
  const [matches, setMatches] = useState(null);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const run = async () => {
    if (!user || user === false) return nav("/login");
    setErr(""); setBusy(true); setMatches(null); setNote("");
    try {
      const deadline = form.deadline === "custom" ? form.customDate : form.deadline;
      const { data } = await api.post("/ai/match", {
        content_type: form.content_type, budget: Number(form.budget || 0),
        deadline, editing_style: form.editing_style,
        motion_graphics: form.motion_graphics, footage_size: form.footage_size,
      });
      setMatches(data.matches || []); setNote(data.note || "");
    } catch (e) { setErr(formatApiError(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="fade-in">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute right-[-100px] top-[-60px] hidden md:block">
          <AiOrb size={420} />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 lg:px-10 pt-20 pb-10">
          <p className="text-xs font-bold tracking-wider uppercase text-gray-500"><Sparkles size={12} className="inline -mt-0.5 text-[#39FF14]"/> AI Match</p>
          <h1 className="font-heading text-5xl sm:text-6xl font-bold text-gray-900 mt-3 leading-tight">
            Describe your edit.<br/>We'll <span className="text-neon-grad">match the editor</span>.
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl">
            Our AI ranks verified editors by skill, badges, trust score, price, and turnaround feasibility for your deadline.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 lg:px-10 pb-16">
        <TiltCard className="card p-6 sm:p-8 fade-in" maxTilt={2}>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="input-label">Content type</label>
              <select data-testid="ai-content" className="input" value={form.content_type} onChange={e=>set("content_type", e.target.value)}>
                {CONTENT_TYPES.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Editing style</label>
              <select data-testid="ai-style" className="input" value={form.editing_style} onChange={e=>set("editing_style", e.target.value)}>
                {STYLES.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Budget (USD)</label>
              <input data-testid="ai-budget" type="number" className="input" placeholder="500" value={form.budget} onChange={e=>set("budget", e.target.value)}/>
            </div>
            <div>
              <label className="input-label">Deadline</label>
              <select data-testid="ai-deadline" className="input" value={form.deadline} onChange={e=>set("deadline", e.target.value)}>
                <option value="24h">1 Day (24 Hours)</option>
                <option value="3d">3 Days</option>
                <option value="7d">7 Days</option>
                <option value="14d">14 Days</option>
                <option value="30d">30 Days</option>
                <option value="custom">Custom Date</option>
              </select>
            </div>
            {form.deadline === "custom" && (
              <div className="sm:col-span-2">
                <label className="input-label">Custom delivery date</label>
                <input data-testid="ai-custom-date" type="date" className="input" value={form.customDate} onChange={e=>set("customDate", e.target.value)}/>
              </div>
            )}
            <div>
              <label className="input-label">Footage size</label>
              <select data-testid="ai-size" className="input" value={form.footage_size} onChange={e=>set("footage_size", e.target.value)}>
                {SIZES.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 pt-7">
              <input id="mg" data-testid="ai-mg" type="checkbox" checked={form.motion_graphics} onChange={e=>set("motion_graphics", e.target.checked)} className="w-4 h-4 accent-[#39FF14]" />
              <label htmlFor="mg" className="text-sm text-gray-700">Motion graphics needed</label>
            </div>
          </div>

          {err && <p className="mt-4 text-sm text-red-600">{err}</p>}

          <div className="mt-6 flex justify-end">
            <button data-testid="ai-run" onClick={run} disabled={busy || !form.budget} className="btn-primary inline-flex items-center gap-2 disabled:opacity-50">
              {busy ? <Loader2 size={16} className="animate-spin"/> : <Wand2 size={16}/>} {busy ? "Finding editors…" : "Find my editor"}
            </button>
          </div>
        </TiltCard>
      </section>

      {/* Results */}
      <AnimatePresence>
        {(busy || matches) && (
          <motion.section
            key="results"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="max-w-7xl mx-auto px-6 lg:px-10 pb-24"
          >
            <h2 className="font-heading text-2xl font-semibold text-gray-900 mb-2">Top matches</h2>
            <p className="text-sm text-gray-500 mb-6">{busy ? "Ranking verified editors…" : (matches?.length ? `${matches.length} editors matched.` : (note || "No editors matched — try widening your budget or removing motion graphics requirement."))}</p>

            {busy ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => <div key={i} className="card p-5"><div className="skeleton h-32 mb-3"/><div className="skeleton h-4 w-1/2 mb-2"/><div className="skeleton h-3 w-full"/></div>)}
              </div>
            ) : (matches && matches.length > 0) ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {matches.map((m, i) => (
                  <motion.div key={m.id}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.05 }}>
                    <MatchCard m={m}/>
                  </motion.div>
                ))}
              </div>
            ) : null}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

function MatchCard({ m }) {
  return (
    <TiltCard className="card card-hover overflow-hidden h-full">
      <div className="p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center font-heading text-gray-400">
            {m.avatar ? <img src={m.avatar} alt="" className="w-full h-full object-cover" onError={(e)=>{e.currentTarget.style.display="none"}}/> : (m.name?.[0])}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{m.name}</p>
            <p className="text-xs text-gray-500">Starting ${m.starting_price ?? "—"}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-2xl font-bold text-neon-grad">{m.score}</p>
            <p className="text-[10px] uppercase tracking-wider text-gray-400">match</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-700 line-clamp-2">{m.bio || "—"}</p>
        <div className="mt-3"><TrustBadges badges={m.badges}/></div>
        <div className="mt-4 rounded-xl bg-gray-50 border border-gray-200 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-gray-500">AI reason</p>
          <p className="text-sm text-gray-800 mt-0.5">{m.reason}</p>
        </div>
        <div className="mt-5 flex gap-2">
          <Link to={`/editor/${m.id}`} className="btn-outline text-xs flex-1 text-center">View profile</Link>
          <Link to={`/editor/${m.id}`} state={{ open: "hire" }} className="btn-primary text-xs flex-1 text-center inline-flex items-center justify-center gap-1">
            <Briefcase size={12}/> Hire
          </Link>
        </div>
      </div>
    </TiltCard>
  );
}
