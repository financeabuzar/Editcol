import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, ArrowRight, Briefcase, CheckCircle2, Loader2, UploadCloud, UserRound, Video } from "lucide-react";

const creatorTypes = ["YouTuber", "Agency", "Brand", "Company", "Business", "Influencer", "Course Creator", "Podcast", "Music Artist", "Startup", "Other"];
const videoTypes = ["YouTube Long Form", "Short Form", "Instagram Reels", "TikTok", "Ads", "Commercials", "Podcasts", "Gaming", "Travel", "Real Estate", "Education", "Corporate", "Wedding", "Documentary", "Vlogs", "Talking Head", "Animation", "Motion Graphics", "Faceless Videos", "Other"];
const editorCategories = ["YouTube", "Reels", "TikTok", "Ads", "Corporate", "Music Videos", "Wedding", "Gaming", "Anime", "Education", "Travel", "Real Estate", "Finance", "Podcast", "Documentary", "Motion Graphics", "VFX", "Color Grading", "Animation", "Talking Head", "Faceless", "Short Films", "Other"];
const software = ["Adobe Premiere Pro", "After Effects", "DaVinci Resolve", "Final Cut", "CapCut", "Photoshop", "Illustrator", "Audition", "Blender", "Cinema4D", "Canva", "Figma"];
const urlFields = ["YouTube", "Instagram", "TikTok", "Facebook", "LinkedIn", "Twitter/X", "Website", "Portfolio"];

const emptyClient = {
  avatar: "", creator_type: "", video_types: [], hire_frequency: "", budget: "Rs 20k",
  social_links: {}, bio: "",
};

const emptyEditor = {
  avatar: "", country: "", timezone: "", languages: "", experience_level: "", years_experience: "",
  categories: [], software: [], hourly_rate: "", starting_price: "", currency: "INR", availability: "",
  social_links: {}, portfolio_links: {}, portfolio_videos: [], proof_videos: [], bio: "",
};

function readFile(file, maxMb = 8) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");
    if (file.size > maxMb * 1024 * 1024) return reject(new Error(`File must be under ${maxMb}MB`));
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function isUrl(value) {
  if (!value) return true;
  try { new URL(value); return true; } catch { return false; }
}

function Chip({ active, children, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${active ? "border-[#39FF14] bg-[#39FF14] text-black" : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"}`}>
      {children}
    </button>
  );
}

function TextInput({ label, value, onChange, placeholder, type = "text", invalid }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</span>
      <input type={type} value={value || ""} placeholder={placeholder} onChange={e=>onChange(e.target.value)}
        className={`mt-2 h-12 w-full rounded-xl border bg-white/5 px-4 text-white outline-none transition placeholder:text-gray-600 ${invalid ? "border-red-400" : "border-white/10 focus:border-[#39FF14]"}`} />
    </label>
  );
}

function AvatarUpload({ value, onChange }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="h-24 w-24 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-gray-500"><UserRound /></div>}
      </div>
      <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10">
        <UploadCloud size={16} /> Upload avatar
        <input hidden type="file" accept="image/*" onChange={async e => onChange(await readFile(e.target.files?.[0], 2))} />
      </label>
    </div>
  );
}

async function videosFromFiles(files, existing = []) {
  const selected = Array.from(files || []).slice(0, Math.max(0, 10 - existing.length));
  const items = [];
  for (const file of selected) {
    if (!/\.(mp4|mov|mkv)$/i.test(file.name)) throw new Error("Videos must be mp4, mov, or mkv files.");
    const src = await readFile(file, 500);
    items.push({ name: file.name, size: file.size, src });
  }
  return [...existing, ...items].slice(0, 10);
}

export default function Onboarding() {
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(user?.role && user.role !== "pending" ? user.role : "");
  const [clientForm, setClientForm] = useState(() => JSON.parse(localStorage.getItem("editcol_client_onboarding") || "null") || emptyClient);
  const [editorForm, setEditorForm] = useState(() => JSON.parse(localStorage.getItem("editcol_editor_onboarding") || "null") || emptyEditor);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get("/onboarding/me").then(({ data }) => {
      if (data.user?.role && data.user.role !== "pending") setRole(data.user.role);
      if (data.client_profile) setClientForm(f => ({ ...f, ...data.client_profile }));
      if (data.editor_profile) setEditorForm(f => ({ ...f, ...data.editor_profile }));
    }).catch(() => {});
  }, []);

  useEffect(() => { localStorage.setItem("editcol_client_onboarding", JSON.stringify(clientForm)); }, [clientForm]);
  useEffect(() => { localStorage.setItem("editcol_editor_onboarding", JSON.stringify(editorForm)); }, [editorForm]);

  const form = role === "editor" ? editorForm : clientForm;
  const setForm = (patch) => role === "editor" ? setEditorForm(f => ({ ...f, ...patch })) : setClientForm(f => ({ ...f, ...patch }));
  const toggle = (key, item) => setForm({ [key]: form[key]?.includes(item) ? form[key].filter(x=>x!==item) : [...(form[key] || []), item] });

  const progress = Math.min(step, 4);
  const invalidUrls = useMemo(() => Object.values(form.social_links || {}).some(v => !isUrl(v)), [form.social_links]);

  const saveRole = async (nextRole = role) => {
    setBusy(true); setErr("");
    try {
      const { data } = await api.post("/onboarding/role", { role: nextRole });
      await refresh();
      setRole(data.user.role);
      setStep(3);
    } catch (e) { setErr(formatApiError(e)); }
    finally { setBusy(false); }
  };

  const saveProfile = async () => {
    setBusy(true); setErr("");
    try {
      if (invalidUrls) throw new Error("Please fix invalid URLs before continuing.");
      if (role === "editor" && !(form.portfolio_videos || []).length) throw new Error("Upload at least one portfolio video.");
      if (role === "editor" && !(form.proof_videos || []).length) throw new Error("Upload at least one original edited proof-of-work video.");
      await api.put("/onboarding/profile", { data: form });
      setStep(4);
    } catch (e) { setErr(formatApiError(e)); }
    finally { setBusy(false); }
  };

  const complete = async () => {
    setBusy(true); setErr("");
    try {
      const { data } = await api.post("/onboarding/complete");
      await refresh();
      localStorage.removeItem("editcol_client_onboarding");
      localStorage.removeItem("editcol_editor_onboarding");
      nav(data.user.role === "editor" ? "/dashboard" : "/dashboard", { replace: true });
    } catch (e) { setErr(formatApiError(e)); }
    finally { setBusy(false); }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#050608] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <div className="font-heading text-2xl font-black tracking-tight">EDITCOL</div>
          <div className="text-xs font-semibold text-gray-400">Step {progress} of 4</div>
        </div>
        <div className="mt-5 grid grid-cols-4 gap-2">
          {[1,2,3,4].map(i => <div key={i} className={`h-1 rounded-full ${progress >= i ? "bg-[#39FF14]" : "bg-white/10"}`} />)}
        </div>

        <div className="flex flex-1 items-center py-10">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.section key="welcome" initial={{opacity:0, y:16}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-16}} className="w-full">
                <div className="max-w-2xl">
                  <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#39FF14]">Welcome to EditCol</p>
                  <h1 className="mt-4 font-heading text-5xl font-black tracking-tight sm:text-7xl">Your workspace starts here.</h1>
                  <p className="mt-5 text-lg text-gray-400">We'll personalize your experience in under 2 minutes.</p>
                  <button onClick={()=>setStep(2)} className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-[#39FF14] px-6 font-bold text-black">
                    Continue <ArrowRight size={18} />
                  </button>
                </div>
              </motion.section>
            )}

            {step === 2 && (
              <motion.section key="role" initial={{opacity:0, y:16}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-16}} className="w-full">
                <h1 className="font-heading text-4xl font-black">Choose your role</h1>
                <p className="mt-2 text-gray-400">You can select one. This shapes your dashboard and setup.</p>
                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  {[
                    { id:"client", Icon: Briefcase, title:"Client", sub:"I hire video editors", items:["Create projects","Find editors","Manage work"] },
                    { id:"editor", Icon: Video, title:"Editor", sub:"I edit videos professionally", items:["Show portfolio","Receive projects","Earn money"] },
                  ].map(card => (
                    <button key={card.id} onClick={()=>setRole(card.id)} className={`rounded-2xl border p-6 text-left transition ${role===card.id ? "border-[#39FF14] bg-[#39FF14]/10" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"}`}>
                      <card.Icon className="text-[#39FF14]" />
                      <h2 className="mt-5 text-2xl font-black">{card.title}</h2>
                      <p className="mt-1 text-gray-300">{card.sub}</p>
                      <ul className="mt-5 space-y-2 text-sm text-gray-400">{card.items.map(x => <li key={x} className="flex gap-2"><CheckCircle2 size={15} className="text-[#39FF14]" />{x}</li>)}</ul>
                    </button>
                  ))}
                </div>
                {err && <p className="mt-4 text-sm text-red-300">{err}</p>}
                <div className="mt-8 flex justify-between">
                  <button onClick={()=>setStep(1)} className="inline-flex items-center gap-2 text-sm text-gray-400"><ArrowLeft size={16}/> Back</button>
                  <button disabled={!role || busy} onClick={()=>saveRole()} className="inline-flex h-12 items-center gap-2 rounded-full bg-[#39FF14] px-6 font-bold text-black disabled:opacity-50">
                    {busy && <Loader2 size={16} className="animate-spin" />} Continue
                  </button>
                </div>
              </motion.section>
            )}

            {step === 3 && (
              <motion.section key="profile" initial={{opacity:0, y:16}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-16}} className="w-full">
                <h1 className="font-heading text-4xl font-black">{role === "editor" ? "Build your editor profile" : "Set up your client profile"}</h1>
                <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur sm:p-8">
                  <AvatarUpload value={form.avatar} onChange={(avatar)=>setForm({ avatar })} />
                  {role === "client" ? (
                    <div className="mt-8 space-y-7">
                      <label className="block"><span className="text-xs font-bold uppercase text-gray-400">What type of creator are you?</span><select className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#0b1018] px-4 text-white" value={form.creator_type} onChange={e=>setForm({creator_type:e.target.value})}><option value="">Select</option>{creatorTypes.map(x=><option key={x}>{x}</option>)}</select></label>
                      <div><p className="text-xs font-bold uppercase text-gray-400">What type of videos do you need?</p><div className="mt-3 flex flex-wrap gap-2">{videoTypes.map(x=><Chip key={x} active={form.video_types?.includes(x)} onClick={()=>toggle("video_types", x)}>{x}</Chip>)}</div></div>
                      <div><p className="text-xs font-bold uppercase text-gray-400">How often do you hire?</p><div className="mt-3 flex flex-wrap gap-2">{["One Time","Weekly","Monthly","Full Time","Agency Scale"].map(x=><Chip key={x} active={form.hire_frequency===x} onClick={()=>setForm({hire_frequency:x})}>{x}</Chip>)}</div></div>
                      <TextInput label="Estimated monthly budget" value={form.budget} onChange={v=>setForm({budget:v})} placeholder="Rs 20k" />
                    </div>
                  ) : (
                    <div className="mt-8 space-y-7">
                      <div className="grid gap-4 sm:grid-cols-3"><TextInput label="Country" value={form.country} onChange={v=>setForm({country:v})}/><TextInput label="Timezone" value={form.timezone} onChange={v=>setForm({timezone:v})}/><TextInput label="Languages" value={form.languages} onChange={v=>setForm({languages:v})}/></div>
                      <div><p className="text-xs font-bold uppercase text-gray-400">Editor experience</p><div className="mt-3 flex flex-wrap gap-2">{["Beginner","Intermediate","Professional","Senior","Agency"].map(x=><Chip key={x} active={form.experience_level===x} onClick={()=>setForm({experience_level:x})}>{x}</Chip>)}</div></div>
                      <div><p className="text-xs font-bold uppercase text-gray-400">Video categories</p><div className="mt-3 flex flex-wrap gap-2">{editorCategories.map(x=><Chip key={x} active={form.categories?.includes(x)} onClick={()=>toggle("categories", x)}>{x}</Chip>)}</div></div>
                      <div><p className="text-xs font-bold uppercase text-gray-400">Software skills</p><div className="mt-3 flex flex-wrap gap-2">{software.map(x=><Chip key={x} active={form.software?.includes(x)} onClick={()=>toggle("software", x)}>{x}</Chip>)}</div></div>
                      <div className="grid gap-4 sm:grid-cols-3"><TextInput label="Hourly rate" type="number" value={form.hourly_rate} onChange={v=>setForm({hourly_rate:v})}/><TextInput label="Starting price" type="number" value={form.starting_price} onChange={v=>setForm({starting_price:v})}/><TextInput label="Currency" value={form.currency} onChange={v=>setForm({currency:v})}/></div>
                      <div><p className="text-xs font-bold uppercase text-gray-400">Availability</p><div className="mt-3 flex flex-wrap gap-2">{["Part Time","Full Time","Weekends","Agency","Available Immediately"].map(x=><Chip key={x} active={form.availability===x} onClick={()=>setForm({availability:x})}>{x}</Chip>)}</div></div>
                      <div>
                        <p className="text-xs font-bold uppercase text-gray-400">Portfolio videos</p>
                        <label className="mt-3 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-center text-sm text-gray-400 hover:bg-white/[0.06]">
                          <UploadCloud className="mb-2 text-[#39FF14]" /> Drop or upload up to 10 mp4, mov, or mkv videos.
                          <input hidden type="file" accept=".mp4,.mov,.mkv,video/*" multiple onChange={async e=>setForm({portfolio_videos: await videosFromFiles(e.target.files, form.portfolio_videos || [])})} />
                        </label>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">{(form.portfolio_videos || []).map((v, i)=><div key={`${v.name}-${i}`} className="rounded-2xl border border-white/10 bg-black/30 p-3"><video src={v.src} controls className="aspect-video w-full rounded-xl bg-black object-cover" /><div className="mt-2 flex items-center justify-between gap-2 text-xs text-gray-400"><span className="truncate">{v.name}</span><button type="button" onClick={()=>setForm({portfolio_videos: form.portfolio_videos.filter((_,idx)=>idx!==i)})} className="text-red-300">Remove</button></div></div>)}</div>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase text-gray-400">Proof of work</p>
                        <label className="mt-3 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#39FF14]/40 bg-[#39FF14]/5 p-5 text-center text-sm text-gray-300">
                          <UploadCloud className="mb-2 text-[#39FF14]" /> Upload at least one original edited video. Required for public verification.
                          <input hidden type="file" accept=".mp4,.mov,.mkv,video/*" multiple onChange={async e=>setForm({proof_videos: await videosFromFiles(e.target.files, form.proof_videos || [])})} />
                        </label>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">{(form.proof_videos || []).map((v, i)=><div key={`${v.name}-${i}`} className="rounded-2xl border border-white/10 bg-black/30 p-3"><video src={v.src} controls className="aspect-video w-full rounded-xl bg-black object-cover" /><div className="mt-2 flex items-center justify-between gap-2 text-xs text-gray-400"><span className="truncate">{v.name}</span><button type="button" onClick={()=>setForm({proof_videos: form.proof_videos.filter((_,idx)=>idx!==i)})} className="text-red-300">Remove</button></div></div>)}</div>
                      </div>
                    </div>
                  )}

                  <div className="mt-8">
                    <p className="text-xs font-bold uppercase text-gray-400">Social links</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">{urlFields.map(x => <TextInput key={x} label={x} value={form.social_links?.[x] || ""} invalid={!isUrl(form.social_links?.[x])} onChange={v=>setForm({social_links:{...(form.social_links || {}), [x]: v}})} placeholder="https://" />)}</div>
                  </div>
                  <div className="mt-6"><label className="text-xs font-bold uppercase text-gray-400">Bio</label><textarea maxLength={role==="editor" ? 1000 : 500} rows={5} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-4 text-white outline-none focus:border-[#39FF14]" value={form.bio || ""} onChange={e=>setForm({bio:e.target.value})} /></div>
                </div>
                {err && <p className="mt-4 text-sm text-red-300">{err}</p>}
                <div className="mt-8 flex justify-between"><button onClick={()=>setStep(2)} className="inline-flex items-center gap-2 text-sm text-gray-400"><ArrowLeft size={16}/> Back</button><button onClick={saveProfile} disabled={busy} className="inline-flex h-12 items-center gap-2 rounded-full bg-[#39FF14] px-6 font-bold text-black disabled:opacity-50">{busy && <Loader2 size={16} className="animate-spin" />} Continue</button></div>
              </motion.section>
            )}

            {step === 4 && (
              <motion.section key="summary" initial={{opacity:0, y:16}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-16}} className="w-full">
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
                  <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#39FF14]">Final step</p>
                  <h1 className="mt-3 font-heading text-4xl font-black">Review your profile</h1>
                  <div className="mt-6 grid gap-4 text-sm text-gray-300 sm:grid-cols-2">
                    <p><b className="text-white">Role:</b> {role}</p>
                    <p><b className="text-white">Name:</b> {user.name}</p>
                    <p><b className="text-white">Email:</b> {user.email}</p>
                    <p><b className="text-white">Status:</b> {role === "editor" ? "Pending Verification" : "Ready"}</p>
                  </div>
                  <pre className="mt-6 max-h-64 overflow-auto rounded-2xl bg-black/40 p-4 text-xs text-gray-400">{JSON.stringify(form, null, 2)}</pre>
                </div>
                {err && <p className="mt-4 text-sm text-red-300">{err}</p>}
                <div className="mt-8 flex justify-between"><button onClick={()=>setStep(3)} className="inline-flex items-center gap-2 text-sm text-gray-400"><ArrowLeft size={16}/> Edit</button><button onClick={complete} disabled={busy} className="inline-flex h-12 items-center gap-2 rounded-full bg-[#39FF14] px-6 font-bold text-black disabled:opacity-50">{busy && <Loader2 size={16} className="animate-spin" />} Submit profile</button></div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
