import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import TrustBadges from "@/components/TrustBadges";
import { MessageSquare, Briefcase, MapPin, Star, Flag, ShieldAlert, UserX, X, Loader2 } from "lucide-react";

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

  if (loading) return <div className="max-w-7xl mx-auto px-6 py-20 text-gray-500">Loading…</div>;
  if (!editor) return <div className="max-w-7xl mx-auto px-6 py-20">Editor not found.</div>;

  const ts = editor.trust_score || {};

  return (
    <div className="fade-in max-w-7xl mx-auto px-6 lg:px-10 py-12 grid lg:grid-cols-[360px,1fr] gap-10">
      {/* Sidebar */}
      <aside className="lg:sticky lg:top-24 self-start space-y-6">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
              {editor.avatar
                ? <img src={editor.avatar} alt={editor.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-2xl font-heading text-gray-400">{editor.name?.[0]}</div>}
            </div>
            <div>
              <p className="font-semibold text-lg text-gray-900" data-testid="editor-name">{editor.name}</p>
              {editor.location && <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><MapPin size={12}/> {editor.location}</p>}
            </div>
          </div>
          <div className="mt-4"><TrustBadges badges={editor.badges} /></div>

          <p className="mt-4 text-sm text-gray-700">Starting from</p>
          <p className="font-heading text-3xl font-bold">${editor.starting_price ?? "—"}</p>

          <div className="mt-5 space-y-2.5">
            <button onClick={onMessage} data-testid="msg-editor-btn" className="w-full btn-dark inline-flex items-center justify-center gap-2">
              <MessageSquare size={16}/> Message Editor
            </button>
            <button onClick={() => requireAuth() && setShowHire(true)} data-testid="hire-editor-btn" className="w-full btn-primary inline-flex items-center justify-center gap-2">
              <Briefcase size={16}/> Hire For Project
            </button>
          </div>

          <div className="mt-5 pt-5 border-t border-gray-200 grid grid-cols-2 gap-2 text-xs">
            <button onClick={() => requireAuth() && setShowReport("profile")} data-testid="report-profile-btn" className="text-gray-500 hover:text-gray-900 inline-flex items-center gap-1.5"><Flag size={12}/> Report Profile</button>
            <button onClick={() => requireAuth() && setShowReport("scam")} data-testid="report-scam-btn" className="text-red-600 hover:text-red-700 inline-flex items-center gap-1.5"><ShieldAlert size={12}/> Report Scam</button>
            <button onClick={onBlock} data-testid="block-user-btn" className="col-span-2 text-gray-500 hover:text-gray-900 inline-flex items-center gap-1.5"><UserX size={12}/> Block User</button>
          </div>
        </div>

        <div className="card-hover card p-6">
          <p className="text-xs font-bold tracking-wider uppercase text-gray-500">Trust Score</p>
          <div className="mt-4 space-y-3">
            <TrustBar label="Completion rate" value={ts.completion_rate || 0} />
            <TrustBar label="Response rate" value={ts.response_rate || 0} />
            <TrustBar label="On-time delivery" value={ts.on_time_delivery_rate || 0} />
            <TrustBar label="Client satisfaction" value={ts.satisfaction || 0} />
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="space-y-10">
        <section>
          <h2 className="font-heading text-2xl font-semibold text-gray-900">About</h2>
          <p className="mt-3 text-gray-600 leading-relaxed">{editor.bio || "No bio yet."}</p>

          {editor.skills?.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {editor.skills.map(s => <span key={s} className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-700">{s}</span>)}
            </div>
          )}
          {editor.software?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {editor.software.map(s => <span key={s} className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-700">{s}</span>)}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold text-gray-900">Portfolio</h2>
          {editor.portfolio?.length ? (
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              {editor.portfolio.map((p, i) => (
                <div key={i} className="card overflow-hidden">
                  {p.thumbnail_b64
                    ? <img src={p.thumbnail_b64} alt={p.title} className="h-48 w-full object-cover" />
                    : <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-300 font-heading text-xl">No preview</div>}
                  <div className="p-4">
                    <p className="font-semibold text-gray-900">{p.title}</p>
                    {p.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>}
                    {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs text-neon-grad font-semibold mt-2 inline-block">Open project →</a>}
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="mt-3 text-gray-500 text-sm">No portfolio items yet.</p>}
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold text-gray-900">Reviews</h2>
          {editor.reviews?.length ? (
            <div className="mt-4 space-y-4">
              {editor.reviews.map(r => (
                <div key={r.id} className="card p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">{r.client_name}</p>
                      <div className="flex items-center gap-0.5 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} className={i < r.rating ? "text-amber-500 fill-amber-500" : "text-gray-300"} />)}
                      </div>
                    </div>
                    {r.verified_purchase && <span className="badge badge-verified">Verified purchase</span>}
                  </div>
                  <p className="mt-3 text-gray-700">{r.comment}</p>
                </div>
              ))}
            </div>
          ) : <p className="mt-3 text-gray-500 text-sm">No reviews yet.</p>}
        </section>
      </main>

      {showHire && <HireDialog editor={editor} onClose={() => setShowHire(false)} />}
      {showReport && <ReportDialog kind={showReport} targetId={editor.user_id} onClose={() => setShowReport(false)} />}
    </div>
  );
}

function TrustBar({ label, value }) {
  return (
    <div>
      <div className="flex justify-between text-xs"><span className="text-gray-500">{label}</span><span className="text-gray-900 font-semibold">{value}%</span></div>
      <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-neon-grad rounded-full" style={{ width: `${value}%` }} />
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
      const { data } = await api.post("/projects", {
        editor_id: editor.id, title: form.title, description: form.description,
        content_type: form.content_type, editing_style: form.editing_style,
        motion_graphics: form.motion_graphics, footage_size: form.footage_size,
        budget: Number(form.budget), deadline,
      });
      alert("Project request sent — opening chat.");
      onClose();
      // Start conversation
      const conv = await api.post("/conversations/start", { user_id: editor.user_id });
      nav(`/messages?c=${conv.data.id}`);
    } catch (e) { setErr(formatApiError(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 scroll-area" data-testid="hire-modal">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-xs font-bold tracking-wider uppercase text-gray-500">Project request</p>
            <h3 className="font-heading text-2xl font-semibold text-gray-900">Hire {editor.name}</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900"><X size={20}/></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="input-label">Project title</label>
            <input data-testid="proj-title" className="input" value={form.title} onChange={e=>set("title", e.target.value)} placeholder="e.g. YouTube intro video edit"/>
          </div>
          <div>
            <label className="input-label">Description</label>
            <textarea data-testid="proj-desc" rows={4} className="input" value={form.description} onChange={e=>set("description", e.target.value)} placeholder="What do you need delivered?"/>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Content type</label>
              <select data-testid="proj-content" className="input" value={form.content_type} onChange={e=>set("content_type", e.target.value)}>
                {["YouTube","Reels/Shorts","Wedding","Corporate","Documentary","Podcast","Ad/Commercial","Other"].map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Editing style</label>
              <select data-testid="proj-style" className="input" value={form.editing_style} onChange={e=>set("editing_style", e.target.value)}>
                {["Cinematic","Fast-paced","Vlog","Documentary","Minimal","Trendy/Viral","Other"].map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 pt-7">
              <input id="mg" data-testid="proj-mg" type="checkbox" checked={form.motion_graphics} onChange={e=>set("motion_graphics", e.target.checked)} className="w-4 h-4 accent-[#39FF14]" />
              <label htmlFor="mg" className="text-sm text-gray-700">Motion graphics required</label>
            </div>
            <div>
              <label className="input-label">Footage size</label>
              <select data-testid="proj-size" className="input" value={form.footage_size} onChange={e=>set("footage_size", e.target.value)}>
                {["< 5GB","< 10GB","10-50GB","50-200GB","> 200GB"].map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Budget ($)</label>
              <input data-testid="proj-budget" type="number" className="input" value={form.budget} onChange={e=>set("budget", e.target.value)} placeholder="500" />
            </div>
            <div>
              <label className="input-label">Deadline</label>
              <select data-testid="proj-deadline" className="input" value={form.deadline} onChange={e=>set("deadline", e.target.value)}>
                <option value="24h">24 Hours</option>
                <option value="3d">3 Days</option>
                <option value="7d">7 Days</option>
                <option value="14d">14 Days</option>
                <option value="30d">30 Days</option>
                <option value="custom">Custom Date</option>
              </select>
            </div>
            {form.deadline === "custom" && (
              <div>
                <label className="input-label">Custom date</label>
                <input data-testid="proj-custom-date" type="date" className="input" value={form.customDate} onChange={e=>set("customDate", e.target.value)} />
              </div>
            )}
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="btn-outline">Cancel</button>
            <button onClick={submit} disabled={busy || !form.title || !form.budget} data-testid="proj-submit" className="btn-primary inline-flex items-center gap-2 disabled:opacity-50">
              {busy && <Loader2 size={16} className="animate-spin" />} Send project request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
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
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6" data-testid="report-modal">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-heading text-xl font-semibold text-gray-900">Report — {kind === "scam" ? "Scam" : "Profile"}</h3>
          <button onClick={onClose}><X size={18}/></button>
        </div>
        <textarea data-testid="report-reason" rows={4} className="input" placeholder="Describe the issue…" value={reason} onChange={e=>setReason(e.target.value)} />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="btn-outline">Cancel</button>
          <button onClick={submit} disabled={busy || !reason} data-testid="report-submit" className="btn-primary">Submit report</button>
        </div>
      </div>
    </div>
  );
}
