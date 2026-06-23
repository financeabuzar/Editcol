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
      const payload = { ...form,
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

  if (!user || user.role !== "editor") return <div className="max-w-3xl mx-auto px-6 py-12">You need an editor account.</div>;

  return (
    <div className="fade-in max-w-4xl mx-auto px-6 lg:px-10 py-10">
      <h1 className="font-heading text-3xl font-bold text-gray-900">Editor profile</h1>
      <p className="text-sm text-gray-500 mt-1">Complete every section to go live on the marketplace.</p>

      {editor && (
        <div className="mt-4 mb-8 flex items-center gap-3">
          <span className={`badge ${editor.is_public ? "badge-pro" : "badge-verified"}`}>
            {editor.is_public ? "Public — live" : "Private — not listed"}
          </span>
          <TrustBadges badges={editor.badges}/>
        </div>
      )}

      <section className="card p-6 space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden">
            {form.avatar_b64 ? <img src={form.avatar_b64} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300 font-heading">{user.name?.[0]}</div>}
          </div>
          <label className="btn-outline cursor-pointer text-sm inline-flex items-center gap-2">
            <UploadCloud size={14}/> Upload photo
            <input type="file" accept="image/*" hidden onChange={e=>onAvatar(e.target.files[0])} data-testid="upload-avatar"/>
          </label>
        </div>

        <div>
          <label className="input-label">Bio</label>
          <textarea data-testid="ed-bio" rows={4} className="input" value={form.bio} onChange={e=>set("bio", e.target.value)} placeholder="Tell clients what makes you elite…"/>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div><label className="input-label">Starting price ($)</label><input data-testid="ed-start" type="number" className="input" value={form.starting_price} onChange={e=>set("starting_price", e.target.value)}/></div>
          <div><label className="input-label">Hourly rate ($)</label><input data-testid="ed-hourly" type="number" className="input" value={form.hourly_rate} onChange={e=>set("hourly_rate", e.target.value)}/></div>
          <div><label className="input-label">Location</label><input data-testid="ed-location" className="input" value={form.location} onChange={e=>set("location", e.target.value)} placeholder="City, Country"/></div>
        </div>

        <div>
          <p className="input-label">Skills</p>
          <div className="flex flex-wrap gap-2">
            {ALL_SKILLS.map(s => (
              <button type="button" key={s} onClick={()=>toggle("skills", s)} data-testid={`skill-${s.replace(/\s/g,"")}`}
                className={`text-xs px-3 py-1.5 rounded-full border ${form.skills.includes(s)?"bg-ink text-white border-ink":"border-gray-200"}`}>{s}</button>
            ))}
          </div>
        </div>

        <div>
          <p className="input-label">Software</p>
          <div className="flex flex-wrap gap-2">
            {ALL_SW.map(s => (
              <button type="button" key={s} onClick={()=>toggle("software", s)}
                className={`text-xs px-3 py-1.5 rounded-full border ${form.software.includes(s)?"bg-ink text-white border-ink":"border-gray-200"}`}>{s}</button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="input-label !mb-0">Portfolio</p>
            <button type="button" onClick={addPortfolio} data-testid="add-portfolio" className="text-xs font-semibold text-gray-900 inline-flex items-center gap-1"><Plus size={14}/> Add item</button>
          </div>
          <div className="space-y-3">
            {form.portfolio.map((p, i) => (
              <div key={i} className="card p-4 relative">
                <button onClick={()=>removePortfolio(i)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-900"><X size={16}/></button>
                <div className="grid sm:grid-cols-[120px,1fr] gap-4">
                  <label className="block">
                    <div className="h-24 w-full bg-gray-100 rounded-lg overflow-hidden cursor-pointer flex items-center justify-center text-gray-400">
                      {p.thumbnail_b64 ? <img src={p.thumbnail_b64} className="w-full h-full object-cover" alt=""/> : <UploadCloud size={18}/>}
                    </div>
                    <input type="file" accept="image/*" hidden onChange={e=>onPortfolioThumb(i, e.target.files[0])}/>
                  </label>
                  <div className="space-y-2">
                    <input className="input" placeholder="Title" value={p.title} onChange={e=>updatePortfolio(i,"title",e.target.value)}/>
                    <input className="input" placeholder="URL (YouTube/Vimeo)" value={p.url} onChange={e=>updatePortfolio(i,"url",e.target.value)}/>
                    <textarea rows={2} className="input" placeholder="Short description" value={p.description} onChange={e=>updatePortfolio(i,"description",e.target.value)}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}

        <div className="pt-3 flex justify-end">
          <button onClick={save} disabled={busy} data-testid="save-profile" className="btn-primary inline-flex items-center gap-2 disabled:opacity-50">
            {busy && <Loader2 size={16} className="animate-spin"/>} Save profile
          </button>
        </div>
      </section>
    </div>
  );
}
