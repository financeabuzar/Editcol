import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import TrustBadges from "@/components/TrustBadges";
import { MessageSquare, Briefcase, MapPin, Star, Flag, ShieldAlert, UserX, X, Loader2, Play, Calendar, BadgeCheck, Camera } from "lucide-react";

export default function EditorProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const loc = useLocation();
  const { user } = useAuth();
  const [editor, setEditor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHire, setShowHire] = useState(loc.state?.open === "hire");
  const [showReport, setShowReport] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get(`/editors/${id}`);
      setEditor(data);
    } catch { setEditor(false); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const isOwner = user && editor && user.id === editor.user_id;

  const onAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) return alert("Image too large (max 1MB)");
    
    const r = new FileReader();
    r.onload = async () => {
      try {
        const payload = { avatar_b64: r.result };
        await api.put("/editors/me", payload);
        setEditor(prev => ({ ...prev, avatar: r.result }));
        alert("Profile photo updated successfully!");
      } catch (err) {
        alert("Failed to update profile photo");
      }
    };
    r.readAsDataURL(file);
  };

  const onBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) return alert("Image too large (max 1MB)");

    const r = new FileReader();
    r.onload = async () => {
      try {
        const payload = { cover_b64: r.result };
        await api.put("/editors/me", payload);
        setEditor(prev => ({ ...prev, cover_b64: r.result }));
        alert("Cover banner updated successfully!");
      } catch (err) {
        alert("Failed to update cover banner");
      }
    };
    r.readAsDataURL(file);
  };

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

  if (loading) return <div className="premium-shell py-24 text-muted-foreground">Loading editor profile...</div>;
  if (!editor) return <div className="premium-shell py-24 text-foreground">Editor not found.</div>;

  const ts = editor.trust_score || {};
  const heroImage = editor.avatar || "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1300&q=80";
  const bestVideo = editor.portfolio_videos?.[0]?.src || editor.portfolio?.[0]?.url;

  return (
    <div className="min-h-screen w-full bg-secondary/30 text-foreground py-8">
      <div className="premium-shell grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* LinkedIn-style Header Card */}
          <article className="card overflow-hidden relative">
            {/* Banner */}
            <div className="relative h-48 sm:h-64 w-full bg-secondary/80 overflow-hidden border-b border-border">
              {editor.cover_b64 ? (
                <img src={editor.cover_b64} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" />
              ) : bestVideo && bestVideo.endsWith(".mp4") ? (
                <video src={bestVideo} muted loop autoPlay className="absolute inset-0 w-full h-full object-cover opacity-40 blur-[1px]" />
              ) : (
                <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-35 blur-[2px] scale-105" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              
              {isOwner ? (
                <label className="absolute top-4 right-4 h-9 w-9 rounded-full bg-black/60 text-white hover:bg-black/80 grid place-items-center backdrop-blur transition cursor-pointer z-10 shadow-sm">
                  <Camera size={14} />
                  <input type="file" accept="image/*" hidden onChange={onBannerUpload} />
                </label>
              ) : (
                <button 
                  onClick={() => requireAuth() && setShowReport("profile")}
                  className="absolute top-4 right-4 h-9 w-9 rounded-full bg-black/40 text-white hover:bg-black/60 grid place-items-center backdrop-blur transition"
                  title="Report profile"
                >
                  <Flag size={14} />
                </button>
              )}
            </div>

            {/* Avatar overlapping bottom of banner */}
            <div className="absolute top-[136px] sm:top-[190px] left-6 sm:left-10 z-10 group">
              <div className="h-28 w-28 sm:h-36 sm:h-36 overflow-hidden rounded-full border-4 border-card bg-card shadow-lg relative">
                {editor.avatar ? (
                  <img src={editor.avatar} alt={editor.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-4xl font-black text-muted-foreground bg-secondary">{editor.name?.[0]}</div>
                )}
                
                {isOwner && (
                  <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 grid place-items-center cursor-pointer text-white">
                    <Camera size={24} />
                    <input type="file" accept="image/*" hidden onChange={onAvatarUpload} />
                  </label>
                )}
              </div>
            </div>

            {/* Info Details Section */}
            <div className="pt-16 sm:pt-20 px-6 sm:px-10 pb-8">
              <div className="grid md:grid-cols-[1fr_260px] gap-6 items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-1.5" data-testid="editor-name">
                      {editor.name}
                      {editor.badges?.includes("elite") && (
                        <BadgeCheck className="text-primary fill-primary/10 inline" size={20} />
                      )}
                    </h1>
                    <span className="text-xs text-muted-foreground font-semibold bg-secondary px-2.5 py-1 rounded-full">Available</span>
                  </div>
                  
                  <p className="mt-2 text-sm sm:text-base font-medium text-foreground">
                    {editor.bio || "Professional Video Editor & Storyteller &middot; Available for projects"}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-muted-foreground">
                    <span>{editor.location || "Remote"}</span>
                    <span className="text-muted-foreground/35">&middot;</span>
                    <button onClick={onMessage} className="text-primary font-bold hover:underline">Contact info</button>
                    <span className="text-muted-foreground/35">&middot;</span>
                    <span className="text-foreground font-bold">{(editor.portfolio || []).length * 4 + 7}+ projects shaped</span>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-6 flex flex-wrap items-center gap-2 relative">
                    <button 
                      onClick={() => requireAuth() && setShowHire(true)} 
                      data-testid="hire-editor-btn" 
                      className="btn-primary rounded-full px-5 py-2 text-xs sm:text-sm"
                    >
                      Open to work &middot; Hire
                    </button>
                    <button 
                      onClick={onMessage} 
                      data-testid="msg-editor-btn" 
                      className="btn-outline rounded-full px-5 py-2 text-xs sm:text-sm"
                    >
                      Message
                    </button>
                    
                    <div className="relative">
                      <button 
                        onClick={() => setShowMore(!showMore)}
                        className="btn-outline rounded-full px-4 py-2 text-xs sm:text-sm flex items-center gap-1"
                      >
                        More
                      </button>
                      {showMore && (
                        <div className="absolute left-0 mt-2 w-48 rounded-xl border border-border bg-card p-2 shadow-xl z-20">
                          <button onClick={() => requireAuth() && setShowReport("profile")} className="w-full text-left px-3 py-2 text-xs hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground flex items-center gap-2"><Flag size={12}/> Report Profile</button>
                          <button onClick={() => requireAuth() && setShowReport("scam")} className="w-full text-left px-3 py-2 text-xs hover:bg-secondary rounded-lg text-red-500 hover:text-red-600 flex items-center gap-2"><ShieldAlert size={12}/> Report Scam</button>
                          <div className="border-t border-border my-1" />
                          <button onClick={onBlock} className="w-full text-left px-3 py-2 text-xs hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground flex items-center gap-2"><UserX size={12}/> Block User</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side inline links (Company/Education style) */}
                <div className="space-y-4 md:border-l border-border md:pl-6 text-xs sm:text-sm w-full">
                  <div className="flex items-center gap-3">
                    <div className="grid place-items-center h-9 w-9 rounded-lg border border-border bg-secondary text-primary font-bold text-center text-base shrink-0">
                      $
                    </div>
                    <div>
                      <p className="font-bold text-foreground leading-tight">Starting price</p>
                      <p className="text-xs text-muted-foreground">${editor.starting_price ?? "50"}/project</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="grid place-items-center h-9 w-9 rounded-lg border border-border bg-secondary text-primary font-bold shrink-0">
                      ★
                    </div>
                    <div>
                      <p className="font-bold text-foreground leading-tight">Elite status</p>
                      <div className="mt-0.5"><TrustBadges badges={editor.badges} /></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* LinkedIn-style "Open to work" Box */}
              <div className="mt-6 max-w-lg rounded-2xl border border-border bg-secondary/35 p-4 sm:p-5 relative">
                <button onClick={() => requireAuth() && setShowHire(true)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                  <Briefcase size={15}/>
                </button>
                <p className="font-bold text-sm text-foreground">Open to work</p>
                <p className="text-xs text-muted-foreground mt-1">Video Editor &middot; Freelance / Contract &middot; Remote &middot; ${editor.starting_price ?? "50"}+</p>
                <button onClick={() => requireAuth() && setShowHire(true)} className="text-primary font-bold text-xs hover:underline mt-3 inline-block">Show details</button>
              </div>
            </div>
          </article>

          {/* About Section Card */}
          <section className="card p-6 sm:p-8">
            <h2 className="eyebrow mb-4">About</h2>
            <p className="text-sm sm:text-base leading-7 text-muted-foreground whitespace-pre-line">
              {editor.bio || `${editor.name} is an elite video editor specialized in post-production, storytelling, pacing, sound selection, and color grading. Available for custom commissions and recurring creator partnerships.`}
            </p>
          </section>

          {/* Portfolio Section Card */}
          <section className="card p-6 sm:p-8">
            <h2 className="eyebrow mb-5">Featured Portfolio</h2>
            {editor.portfolio?.length ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {editor.portfolio.map((p, i) => (
                  <motion.article key={i} whileHover={{ y: -6 }} className="card overflow-hidden bg-background">
                    <div className="relative h-44 border-b border-border bg-secondary/20">
                      {p.thumbnail_b64 ? <img src={p.thumbnail_b64} alt={p.title} className="h-full w-full object-cover opacity-85" /> : <div className="grid h-full place-items-center text-muted-foreground/35">No preview</div>}
                      <div className="absolute inset-0 grid place-items-center bg-black/20"><span className="grid h-10 w-10 place-items-center rounded-full bg-white text-black shadow-md"><Play size={14} fill="currentColor" className="ml-0.5" /></span></div>
                    </div>
                    <div className="p-4">
                      <p className="text-base font-bold text-foreground leading-snug">{p.title}</p>
                      {p.description && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{p.description}</p>}
                      {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-bold text-primary hover:underline">Open project</a>}
                    </div>
                  </motion.article>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">No portfolio items yet.</div>
            )}
          </section>

          {/* Reviews Section Card */}
          <section className="card p-6 sm:p-8">
            <h2 className="eyebrow mb-5">Recommendations / Reviews</h2>
            {editor.reviews?.length ? (
              <div className="space-y-4">
                {editor.reviews.map(r => (
                  <article key={r.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-bold text-foreground text-sm">{r.client_name}</p>
                        <div className="mt-1 flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} className={i < r.rating ? "fill-primary text-primary" : "text-muted-foreground/30"} />)}
                        </div>
                      </div>
                      {r.verified_purchase && <span className="badge badge-verified text-[10px] py-0.5 px-2"><BadgeCheck size={11} /> Verified purchase</span>}
                    </div>
                    <p className="mt-3 text-xs sm:text-sm leading-relaxed text-muted-foreground">"{r.comment}"</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">No recommendations yet.</div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-24 self-start">
          <div className="card p-5 bg-card">
            <p className="eyebrow">Trust Score</p>
            <div className="mt-5 space-y-4">
              <TrustBar label="Completion rate" value={ts.completion_rate || 0} />
              <TrustBar label="Response rate" value={ts.response_rate || 0} />
              <TrustBar label="On-time delivery" value={ts.on_time_delivery_rate || 0} />
              <TrustBar label="Client satisfaction" value={ts.satisfaction || 0} />
            </div>
          </div>
          
          <div className="card p-5 bg-card">
            <p className="eyebrow">Software</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {(editor.software?.length ? editor.software : ["Premiere Pro", "After Effects", "DaVinci Resolve"]).map(s => <span key={s} className="rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-xs text-muted-foreground">{s}</span>)}
            </div>
          </div>

          <div className="card p-5 bg-card">
            <p className="flex items-center gap-2 text-xs sm:text-sm font-bold text-foreground"><Calendar size={15} className="text-primary" /> Booking window</p>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">Send a project brief with your budget, deadline, and footage size. Strong briefs get replies within 24 hours.</p>
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
      <div className="flex justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="font-bold text-foreground">{value}%</span></div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
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
            <h3 className="mt-2 text-3xl font-black text-foreground">Hire {editor.name}</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20}/></button>
        </div>

        <div className="space-y-4">
          <Field label="Project title"><input data-testid="proj-title" className="input" value={form.title} onChange={e=>set("title", e.target.value)} placeholder="e.g. YouTube launch film"/></Field>
          <Field label="Description"><textarea data-testid="proj-desc" rows={4} className="input" value={form.description} onChange={e=>set("description", e.target.value)} placeholder="What do you need delivered?"/></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Content type"><select data-testid="proj-content" className="input" value={form.content_type} onChange={e=>set("content_type", e.target.value)}>{["YouTube","Reels/Shorts","Wedding","Corporate","Documentary","Podcast","Ad/Commercial","Other"].map(o=><option key={o}>{o}</option>)}</select></Field>
            <Field label="Editing style"><select data-testid="proj-style" className="input" value={form.editing_style} onChange={e=>set("editing_style", e.target.value)}>{["Cinematic","Fast-paced","Vlog","Documentary","Minimal","Trendy/Viral","Other"].map(o=><option key={o}>{o}</option>)}</select></Field>
            <label className="flex items-center gap-2 pt-7 text-sm text-muted-foreground"><input id="mg" data-testid="proj-mg" type="checkbox" checked={form.motion_graphics} onChange={e=>set("motion_graphics", e.target.checked)} className="h-4 w-4 accent-primary" /> Motion graphics required</label>
            <Field label="Footage size"><select data-testid="proj-size" className="input" value={form.footage_size} onChange={e=>set("footage_size", e.target.value)}>{["< 5GB","< 10GB","10-50GB","50-200GB","> 200GB"].map(o=><option key={o}>{o}</option>)}</select></Field>
            <Field label="Budget ($)"><input data-testid="proj-budget" type="number" className="input" value={form.budget} onChange={e=>set("budget", e.target.value)} placeholder="500" /></Field>
            <Field label="Deadline"><select data-testid="proj-deadline" className="input" value={form.deadline} onChange={e=>set("deadline", e.target.value)}><option value="24h">24 Hours</option><option value="3d">3 Days</option><option value="7d">7 Days</option><option value="14d">14 Days</option><option value="30d">30 Days</option><option value="custom">Custom Date</option></select></Field>
            {form.deadline === "custom" && <Field label="Custom date"><input data-testid="proj-custom-date" type="date" className="input" value={form.customDate} onChange={e=>set("customDate", e.target.value)} /></Field>}
          </div>
          {err && <p className="text-sm text-red-500">{err}</p>}
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
          <h3 className="text-2xl font-black text-foreground">Report {kind === "scam" ? "Scam" : "Profile"}</h3>
          <button onClick={onClose} className="text-muted-foreground"><X size={18}/></button>
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
