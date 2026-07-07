import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import TrustBadges from "@/components/TrustBadges";
import { Loader2, Plus, X, UploadCloud } from "lucide-react";

const ALL_SKILLS = ["Color Grading","Motion Graphics","VFX","Sound Design","Editing","Animation","Reels","YouTube","Wedding","Corporate","Documentary","Podcast"];
const ALL_SW = ["Premiere Pro","Final Cut","DaVinci Resolve","After Effects","Avid","Photoshop","Illustrator","CapCut"];

export default function EditorOnboarding() {
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState({ bio:"", hourly_rate:"", starting_price:"", location:"", skills:[], software:[], languages:[], portfolio:[], avatar_b64: "" });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");

  useEffect(() => {
    api.get("/editors/me/profile").then(r => {
      setEditor(r.data);
      setForm(f => ({ ...f,
        bio: r.data.bio || "", hourly_rate: r.data.hourly_rate || "", starting_price: r.data.starting_price || "",
        location: r.data.location || "", skills: r.data.skills || [], software: r.data.software || [],
        languages: r.data.languages || [], portfolio: r.data.portfolio || [], avatar_b64: r.data.avatar || "",
      }));
    }).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggle = (k, item) => setForm(f => ({ ...f, [k]: f[k].includes(item) ? f[k].filter(x=>x!==item) : [...f[k], item] }));

  const onAvatar = (file) => {
    if (!file) return;
    if (file.size > 1024*1024) return alert("Avatar too large (max 1MB)");
    const r = new FileReader(); r.onload = ()=> set("avatar_b64", r.result); r.readAsDataURL(file);
  };

  const addPortfolio = () => set("portfolio", [...form.portfolio, { title:"", description:"", url:"", thumbnail_b64:"" }]);
  const updatePortfolio = (i, k, v) => {
    const list = [...form.portfolio]; list[i] = { ...list[i], [k]: v }; set("portfolio", list);
  };
  const removePortfolio = (i) => { const l=[...form.portfolio]; l.splice(i,1); set("portfolio", l); };
  const onPortfolioThumb = (i, file) => {
    if (!file) return;
    if (file.size > 1024*1024) return alert("Thumbnail too large (max 1MB)");
    const r = new FileReader(); r.onload = ()=> updatePortfolio(i, "thumbnail_b64", r.result); r.readAsDataURL(file);
  };

  const save = async () => {
    setBusy(true); setErr("");
    try {
      const languagesList = typeof form.languages === "string"
        ? form.languages.split(",").map(lang => lang.trim()).filter(Boolean)
        : Array.isArray(form.languages) ? form.languages : [];

      const payload = { ...form,
        languages: languagesList,
        hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : null,
        starting_price: form.starting_price ? Number(form.starting_price) : null,
      };
      const { data } = await api.put("/editors/me", payload);
      setEditor(data);
      await refresh();
      alert("Profile saved");
    } catch (e) { setErr(formatApiError(e)); }
    finally { setBusy(false); }
  };

  if (!user || user.role !== "editor") return <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-zinc-400">You need an editor account.</div>;

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground py-8 sm:py-10 selection:bg-purple-600 selection:text-white">
      {/* Background glow blobs */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-purple-900/5 rounded-full pointer-events-none" style={{ filter: "blur(130px)" }} />
      <div className="absolute bottom-0 right-1/4 w-[350px] h-[350px] bg-indigo-950/5 rounded-full pointer-events-none" style={{ filter: "blur(120px)" }} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-10">
        <h1 className="font-heading text-3xl font-black text-foreground">Editor profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Complete every section to go live on the marketplace.</p>

        {editor && (
          <div className="mt-4 mb-8 flex flex-wrap items-center gap-3">
            <span className={`badge ${editor.is_public ? "badge-pro" : "badge-verified"}`}>
              {editor.is_public ? "Public — live" : "Private — not listed"}
            </span>
            <TrustBadges badges={editor.badges}/>
          </div>
        )}

        <section className="w-full rounded-3xl border border-border bg-card/60 p-5 shadow-2xl backdrop-blur-md sm:p-8 space-y-6 mt-6">
          {/* Avatar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-20 h-20 rounded-2xl border border-border bg-background overflow-hidden">
              {form.avatar_b64 ? (
                <img src={form.avatar_b64} className="w-full h-full object-cover" alt=""/>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl text-muted-foreground font-heading">
                  {user.name?.[0]}
                </div>
              )}
            </div>
            <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-secondary transition-colors">
              <UploadCloud size={16} className="text-muted-foreground"/> Upload photo
              <input type="file" accept="image/*" hidden onChange={e=>onAvatar(e.target.files[0])} data-testid="upload-avatar"/>
            </label>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Bio</label>
            <textarea
              data-testid="ed-bio"
              rows={4}
              className="input mt-2 w-full"
              value={form.bio}
              onChange={e=>set("bio", e.target.value)}
              placeholder="Tell clients what makes you elite…"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Starting price ($)</label>
              <input
                data-testid="ed-start"
                type="number"
                className="input mt-2 w-full"
                value={form.starting_price}
                onChange={e=>set("starting_price", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Hourly rate ($)</label>
              <input
                data-testid="ed-hourly"
                type="number"
                className="input mt-2 w-full"
                value={form.hourly_rate}
                onChange={e=>set("hourly_rate", e.target.value)}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Location</label>
              <input
                data-testid="ed-location"
                className="input mt-2 w-full"
                value={form.location}
                onChange={e=>set("location", e.target.value)}
                placeholder="City, Country"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Languages</label>
              <input
                className="input mt-2 w-full"
                value={Array.isArray(form.languages) ? form.languages.join(", ") : form.languages || ""}
                onChange={e=>set("languages", e.target.value)}
                placeholder="English, Spanish (comma separated)"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Skills</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {ALL_SKILLS.map(s => (
                <button
                  type="button"
                  key={s}
                  onClick={()=>toggle("skills", s)}
                  data-testid={`skill-${s.replace(/\s/g,"")}`}
                  className={`text-xs px-3 py-2 rounded-full border transition-all duration-200 font-semibold ${
                    form.skills.includes(s)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground hover:bg-secondary"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Software</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {ALL_SW.map(s => (
                <button
                  type="button"
                  key={s}
                  onClick={()=>toggle("software", s)}
                  className={`text-xs px-3 py-2 rounded-full border transition-all duration-200 font-semibold ${
                    form.software.includes(s)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground hover:bg-secondary"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Portfolio</p>
              <button
                type="button"
                onClick={addPortfolio}
                data-testid="add-portfolio"
                className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
              >
                <Plus size={14}/> Add item
              </button>
            </div>
            <div className="space-y-4">
              {form.portfolio.map((p, i) => (
                <div key={i} className="rounded-2xl border border-border bg-secondary/35 p-4 sm:p-5 relative">
                  <button onClick={()=>removePortfolio(i)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors">
                    <X size={16}/>
                  </button>
                  <div className="grid sm:grid-cols-[120px,1fr] gap-4">
                    <label className="block">
                      <div className="h-24 w-full bg-background border border-border rounded-lg overflow-hidden cursor-pointer flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors">
                        {p.thumbnail_b64 ? <img src={p.thumbnail_b64} className="w-full h-full object-cover" alt=""/> : <UploadCloud size={18}/>}
                      </div>
                      <input type="file" accept="image/*" hidden onChange={e=>onPortfolioThumb(i, e.target.files[0])}/>
                    </label>
                    <div className="space-y-3">
                      <input
                        className="input h-10 py-2 placeholder:text-muted-foreground/60"
                        placeholder="Title"
                        value={p.title}
                        onChange={e=>updatePortfolio(i,"title",e.target.value)}
                      />
                      <input
                        className="input h-10 py-2 placeholder:text-muted-foreground/60"
                        placeholder="URL (YouTube/Vimeo)"
                        value={p.url}
                        onChange={e=>updatePortfolio(i,"url",e.target.value)}
                      />
                      <textarea
                        rows={2}
                        className="input py-2 placeholder:text-muted-foreground/60"
                        placeholder="Short description"
                        value={p.description}
                        onChange={e=>updatePortfolio(i,"description",e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {err && <p className="text-xs text-red-400 font-medium mt-2">{err}</p>}

          <div className="pt-3 flex justify-stretch sm:justify-end">
            <button
              onClick={save}
              disabled={busy}
              data-testid="save-profile"
              className="inline-flex w-full sm:w-auto h-12 items-center justify-center gap-2 rounded-full bg-foreground hover:bg-foreground/90 text-background font-bold px-6 transition-all duration-200 hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
            >
              {busy && <Loader2 size={16} className="animate-spin text-background"/>}
              Save profile
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
