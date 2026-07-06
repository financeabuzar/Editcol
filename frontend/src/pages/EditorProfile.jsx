import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import TrustBadges from "@/components/TrustBadges";
import { MessageSquare, Briefcase, MapPin, Star, Flag, ShieldAlert, UserX, X, Loader2, Play, Calendar, BadgeCheck } from "lucide-react";

export default function EditorProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const loc = useLocation();
  const { user } = useAuth();
  const [editor, setEditor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHire, setShowHire] = useState(loc.state?.open === "hire");
  const [showReport, setShowReport] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get(`/editors/${id}`);
      setEditor(data);
    } catch { setEditor(false); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const requireAuth = () => {
    if (!user || user === false) { nav("/login"); return false; }
    return true;
  };

  const onMessage = async () => {
    if (!requireAuth()) return;
    const { data } = await api.post("/conversations/start", { user_id: editor.user_id });
    nav(`/messages?c=${data.id}`);
  };

  const onBlock = async () => {
    if (!requireAuth()) return;
    if (!confirm("Block this user? You will no longer see their messages.")) return;
    await api.post("/blocks", { user_id: editor.user_id });
    alert("User blocked.");
  };

  if (loading) return <div className="premium-shell py-24 text-[#a0a0a0]">Loading editor profile...</div>;
  if (!editor) return <div className="premium-shell py-24 text-white">Editor not found.</div>;

  const ts = editor.trust_score || {};
  const heroImage = editor.avatar || "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1300&q=80";

  return (
    <div className="fade-in">
      <section className="relative overflow-hidden border-b border-white/[0.08] bg-[#050505] cinema-noise">
        <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-24 blur-sm scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/78 to-[#050505]/40" />
        <div className="premium-shell relative grid gap-10 py-14 sm:py-20 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="badge badge-elite">Available this week</span>
              {editor.location && <span className="inline-flex items-center gap-1 text-sm text-[#a0a0a0]"><MapPin size={14}/> {editor.location}</span>}
            </div>
            <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.025em] text-white sm:text-7xl" data-testid="editor-name">{editor.name}</h1>
            <p className="section-copy mt-5 max-w-2xl">{editor.bio || "Elite video editor focused on story, pacing, sound, and platform-native delivery."}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {(editor.skills || []).slice(0, 8).map(s => <span key={s} className="rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-white">{s}</span>)}
            </div>
          </div>

          <aside className="card p-5 lg:sticky lg:top-24">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-full border border-white/[0.12] bg-white/[0.05]">
                {editor.avatar ? <img src={editor.avatar} alt={editor.name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-2xl font-black text-white/40">{editor.name?.[0]}</div>}
              </div>
              <div>
                <p className="text-sm text-[#a0a0a0]">Starting from</p>
                <p className="text-3xl font-black text-white">${editor.starting_price ?? "-"}</p>
              </div>
            </div>
            <div className="mt-4"><TrustBadges badges={editor.badges} /></div>
            <div className="mt-5 grid gap-2">
              <button onClick={() => requireAuth() && setShowHire(true)} data-testid="hire-editor-btn" className="btn-primary w-full"><Briefcase size={16}/> Hire For Project</button>
              <button onClick={onMessage} data-testid="msg-editor-btn" className="btn-outline w-full"><MessageSquare size={16}/> Message Editor</button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/[0.08] pt-4 text-xs">
              <button onClick={() => requireAuth() && setShowReport("profile")} data-testid="report-profile-btn" className="inline-flex items-center gap-1.5 text-[#a0a0a0] hover:text-white"><Flag size={12}/> Report</button>
              <button onClick={() => requireAuth() && setShowReport("scam")} data-testid="report-scam-btn" className="inline-flex items-center gap-1.5 text-red-300 hover:text-red-200"><ShieldAlert size={12}/> Scam</button>
              <button onClick={onBlock} data-testid="block-user-btn" className="col-span-2 inline-flex items-center gap-1.5 text-[#a0a0a0] hover:text-white"><UserX size={12}/> Block User</button>
            </div>
          </aside>
        </div>
      </section>

      <div className="premium-shell grid gap-8 py-10 sm:py-14 lg:grid-cols-[1fr_360px]">
        <main className="space-y-10">
          <section>
            <p className="eyebrow">Portfolio</p>
            {editor.portfolio?.length ? (
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {editor.portfolio.map((p, i) => (
                  <motion.article key={i} whileHover={{ y: -6 }} className="card overflow-hidden">
                    <div className="relative h-64">
                      {p.thumbnail_b64 ? <img src={p.thumbnail_b64} alt={p.title} className="h-full w-full object-cover opacity-85" /> : <div className="grid h-full place-items-center bg-white/[0.04] text-white/25">No preview</div>}
                      <div className="absolute inset-0 grid place-items-center bg-black/20"><span className="grid h-12 w-12 place-items-center rounded-full bg-white text-black"><Play size={16} fill="currentColor" /></span></div>
                    </div>
                    <div className="p-5">
                      <p className="text-xl font-bold text-white">{p.title}</p>
                      {p.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#a0a0a0]">{p.description}</p>}
                      {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-bold text-[#43d9ff]">Open project</a>}
                    </div>
                  </motion.article>
                ))}
              </div>
            ) : (
              <div className="card mt-5 p-8 text-[#a0a0a0]">No portfolio items yet.</div>
            )}
          </section>

          <section>
            <p className="eyebrow">Reviews</p>
            {editor.reviews?.length ? (
              <div className="mt-5 space-y-4">
                {editor.reviews.map(r => (
                  <article key={r.id} className="card p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-bold text-white">{r.client_name}</p>
                        <div className="mt-1 flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} className={i < r.rating ? "fill-[#43d9ff] text-[#43d9ff]" : "text-white/18"} />)}
                        </div>
                      </div>
                      {r.verified_purchase && <span className="badge badge-verified"><BadgeCheck size={13} /> Verified purchase</span>}
                    </div>
                    <p className="mt-4 leading-7 text-[#d6d6d6]">{r.comment}</p>
                  </article>
                ))}
              </div>
            ) : <div className="card mt-5 p-8 text-[#a0a0a0]">No reviews yet.</div>}
          </section>
        </main>

        <aside className="space-y-5 lg:sticky lg:top-24 self-start">
          <div className="card p-5">
            <p className="eyebrow">Trust Score</p>
            <div className="mt-5 space-y-4">
              <TrustBar label="Completion rate" value={ts.completion_rate || 0} />
              <TrustBar label="Response rate" value={ts.response_rate || 0} />
              <TrustBar label="On-time delivery" value={ts.on_time_delivery_rate || 0} />
              <TrustBar label="Client satisfaction" value={ts.satisfaction || 0} />
            </div>
          </div>
          <div className="card p-5">
            <p className="eyebrow">Software</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(editor.software?.length ? editor.software : ["Premiere Pro", "After Effects", "DaVinci Resolve"]).map(s => <span key={s} className="rounded-full border border-white/[0.1] px-3 py-1.5 text-xs text-[#d6d6d6]">{s}</span>)}
            </div>
          </div>
          <div className="card p-5">
            <p className="flex items-center gap-2 text-sm font-bold text-white"><Calendar size={16} className="text-[#43d9ff]" /> Booking window</p>
            <p className="mt-2 text-sm leading-6 text-[#a0a0a0]">Send a brief with budget, deadline, footage size, and format. Strong briefs get faster replies.</p>
          </div>
        </aside>
      </div>

      {showHire && <HireDialog editor={editor} onClose={() => setShowHire(false)} />}
      {showReport && <ReportDialog kind={showReport} targetId={editor.user_id} onClose={() => setShowReport(false)} />}
    </div>
  );
}

function TrustBar({ label, value }) {
  return (
    <div>
      <div className="flex justify-between text-xs"><span className="text-[#a0a0a0]">{label}</span><span className="font-bold text-white">{value}%</span></div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
        <div className="h-full rounded-full bg-neon-grad" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function HireDialog({ editor, onClose }) {
  const nav = useNavigate();
  const [form, setForm] = useState({
    title: "", description: "", content_type: "YouTube", editing_style: "Cinematic",
    motion_graphics: false, footage_size: "< 10GB", budget: "", deadline: "7d", customDate: "",
  });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setBusy(true); setErr("");
    try {
      const deadline = form.deadline === "custom" ? form.customDate : form.deadline;
      await api.post("/projects", {
        editor_id: editor.id, title: form.title, description: form.description,
        content_type: form.content_type, editing_style: form.editing_style,
        motion_graphics: form.motion_graphics, footage_size: form.footage_size,
        budget: Number(form.budget), deadline,
      });
      alert("Project request sent - opening chat.");
      onClose();
      const conv = await api.post("/conversations/start", { user_id: editor.user_id });
      nav(`/messages?c=${conv.data.id}`);
    } catch (e) { setErr(formatApiError(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur">
      <div className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-5 sm:p-6 scroll-area" data-testid="hire-modal">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Project request</p>
            <h3 className="mt-2 text-3xl font-black text-white">Hire {editor.name}</h3>
          </div>
          <button onClick={onClose} className="text-[#a0a0a0] hover:text-white"><X size={20}/></button>
        </div>

        <div className="space-y-4">
          <Field label="Project title"><input data-testid="proj-title" className="input" value={form.title} onChange={e=>set("title", e.target.value)} placeholder="e.g. YouTube launch film"/></Field>
          <Field label="Description"><textarea data-testid="proj-desc" rows={4} className="input" value={form.description} onChange={e=>set("description", e.target.value)} placeholder="What do you need delivered?"/></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Content type"><select data-testid="proj-content" className="input" value={form.content_type} onChange={e=>set("content_type", e.target.value)}>{["YouTube","Reels/Shorts","Wedding","Corporate","Documentary","Podcast","Ad/Commercial","Other"].map(o=><option key={o}>{o}</option>)}</select></Field>
            <Field label="Editing style"><select data-testid="proj-style" className="input" value={form.editing_style} onChange={e=>set("editing_style", e.target.value)}>{["Cinematic","Fast-paced","Vlog","Documentary","Minimal","Trendy/Viral","Other"].map(o=><option key={o}>{o}</option>)}</select></Field>
            <label className="flex items-center gap-2 pt-7 text-sm text-[#d6d6d6]"><input id="mg" data-testid="proj-mg" type="checkbox" checked={form.motion_graphics} onChange={e=>set("motion_graphics", e.target.checked)} className="h-4 w-4 accent-[#7c5cff]" /> Motion graphics required</label>
            <Field label="Footage size"><select data-testid="proj-size" className="input" value={form.footage_size} onChange={e=>set("footage_size", e.target.value)}>{["< 5GB","< 10GB","10-50GB","50-200GB","> 200GB"].map(o=><option key={o}>{o}</option>)}</select></Field>
            <Field label="Budget ($)"><input data-testid="proj-budget" type="number" className="input" value={form.budget} onChange={e=>set("budget", e.target.value)} placeholder="500" /></Field>
            <Field label="Deadline"><select data-testid="proj-deadline" className="input" value={form.deadline} onChange={e=>set("deadline", e.target.value)}><option value="24h">24 Hours</option><option value="3d">3 Days</option><option value="7d">7 Days</option><option value="14d">14 Days</option><option value="30d">30 Days</option><option value="custom">Custom Date</option></select></Field>
            {form.deadline === "custom" && <Field label="Custom date"><input data-testid="proj-custom-date" type="date" className="input" value={form.customDate} onChange={e=>set("customDate", e.target.value)} /></Field>}
          </div>
          {err && <p className="text-sm text-red-300">{err}</p>}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button onClick={onClose} className="btn-outline">Cancel</button>
            <button onClick={submit} disabled={busy || !form.title || !form.budget} data-testid="proj-submit" className="btn-primary disabled:opacity-50">{busy && <Loader2 size={16} className="animate-spin" />} Send project request</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div><label className="input-label">{label}</label>{children}</div>;
}

function ReportDialog({ kind, targetId, onClose }) {
  const [reason, setReason] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try { await api.post("/reports", { target_user_id: targetId, kind, reason }); alert("Report submitted to moderation."); onClose(); }
    catch (e) { alert(formatApiError(e)); }
    finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur">
      <div className="card w-full max-w-md p-5 sm:p-6" data-testid="report-modal">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-2xl font-black text-white">Report {kind === "scam" ? "Scam" : "Profile"}</h3>
          <button onClick={onClose} className="text-[#a0a0a0]"><X size={18}/></button>
        </div>
        <textarea data-testid="report-reason" rows={4} className="input" placeholder="Describe the issue..." value={reason} onChange={e=>setReason(e.target.value)} />
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button onClick={onClose} className="btn-outline">Cancel</button>
          <button onClick={submit} disabled={busy || !reason} data-testid="report-submit" className="btn-primary">Submit report</button>
        </div>
      </div>
    </div>
  );
}
