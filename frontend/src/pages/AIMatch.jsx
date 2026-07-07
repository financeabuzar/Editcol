import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, Sparkles, Loader2, Briefcase } from "lucide-react";
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
    <div className="fade-in bg-background text-foreground min-h-screen relative overflow-hidden">
      {/* Glow blobs */}
      <div className="absolute top-0 right-0 pointer-events-none z-0">
        <AiOrb size={420} />
      </div>
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-900/5 rounded-full pointer-events-none" style={{ filter: "blur(130px)" }} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 pt-20 pb-10">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-purple-500 animate-pulse"/>
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground font-mono">AI Matchmaker</span>
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl font-black text-foreground mt-3 leading-[1.05] tracking-tight">
          Describe your edit.<br/>We'll <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">match the editor</span>.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-xl">
          Our AI ranks verified editors by skill alignment, pricing, trust score, and feasibility for your deadline.
        </p>
      </div>

      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 pb-16">
        <TiltCard className="card p-5 sm:p-8 backdrop-blur-md" maxTilt={2}>
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
              <input id="mg" data-testid="ai-mg" type="checkbox" checked={form.motion_graphics} onChange={e=>set("motion_graphics", e.target.checked)} className="w-4 h-4 accent-purple-500 cursor-pointer" />
              <label htmlFor="mg" className="text-sm text-muted-foreground select-none cursor-pointer">Motion graphics needed</label>
            </div>
          </div>

          {err && <p className="mt-4 text-xs text-red-400 font-medium">{err}</p>}

          <div className="mt-6 flex justify-stretch sm:justify-end">
            <button data-testid="ai-run" onClick={run} disabled={busy || !form.budget} className="btn-primary inline-flex w-full sm:w-auto items-center justify-center gap-2 disabled:opacity-50">
              {busy ? <Loader2 size={16} className="animate-spin text-white"/> : <Wand2 size={16}/>} {busy ? "Finding editors…" : "Find my editor"}
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
            className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 pb-24 relative z-10"
          >
            <h2 className="font-heading text-2xl font-black text-foreground mb-2">Top matches</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {busy ? "Ranking verified editors…" : (matches?.length ? `${matches.length} editors matched.` : (note || "No editors matched — try widening your budget or removing motion graphics requirement."))}
            </p>

            {busy ? (
              <div className="grid sm:grid-cols-2 gap-6">
                {[1,2].map(i => <div key={i} className="card p-5"><div className="skeleton h-32 mb-3"/><div className="skeleton h-4 w-1/2 mb-2"/><div className="skeleton h-3 w-full"/></div>)}
              </div>
            ) : (matches && matches.length > 0) ? (
              <div className="grid sm:grid-cols-2 gap-6">
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
      <div className="p-5 flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-background border border-border flex items-center justify-center font-heading text-muted-foreground">
              {m.avatar ? <img src={m.avatar} alt="" className="w-full h-full object-cover" onError={(e)=>{e.currentTarget.style.display="none"}}/> : (m.name?.[0])}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground truncate">{m.name}</p>
              <p className="text-xs text-muted-foreground">Starting ${m.starting_price ?? "—"}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">{m.score}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">match</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground line-clamp-2">{m.bio || "—"}</p>
          <div className="mt-3"><TrustBadges badges={m.badges}/></div>
          <div className="mt-4 rounded-xl bg-background border border-border px-3.5 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">AI Recommendation</p>
            <p className="text-xs text-foreground mt-1 leading-relaxed">{m.reason}</p>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <Link to={`/editor/${m.id}`} className="btn-outline text-xs flex-1 text-center py-2 min-h-0">View profile</Link>
          <Link to={`/editor/${m.id}`} state={{ open: "hire" }} className="btn-primary text-xs flex-1 text-center inline-flex items-center justify-center gap-1 py-2 min-h-0">
            <Briefcase size={12}/> Hire
          </Link>
        </div>
      </div>
    </TiltCard>
  );
}
