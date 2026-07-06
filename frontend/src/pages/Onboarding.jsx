import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  UploadCloud,
  UserRound,
} from "lucide-react";

const clientCreatorTypes = ["YouTube", "Instagram", "TikTok", "Podcast", "Course", "Real Estate", "Agency", "Business", "Gaming", "Travel", "Other"];
const clientEditingTypes = ["YouTube Long Videos", "Reels", "Shorts", "TikTok", "Ads", "Podcast", "Motion Graphics", "Color Grading", "Documentary", "Wedding", "Corporate", "Talking Head", "Faceless", "Animation"];
const hireFrequency = ["One Project", "Weekly", "Monthly", "Full Time"];
const budgetMarks = ["₹10k", "₹25k", "₹50k", "₹1L", "₹2L+"];
const clientSocials = ["YouTube", "Instagram", "Website", "LinkedIn", "Facebook"];

const experienceLevels = ["Beginner", "Intermediate", "Professional", "Senior", "Agency"];
const editorCategories = ["YouTube", "Shorts", "Reels", "Podcast", "Gaming", "Anime", "Travel", "Wedding", "Corporate", "Commercial", "Motion Graphics", "Color Grading", "Documentary", "Ads", "Music Videos", "Education", "Real Estate", "Faceless", "Talking Head", "Other"];
const softwareOptions = ["Premiere Pro", "After Effects", "DaVinci", "CapCut", "Final Cut", "Photoshop", "Illustrator", "Audition", "Blender"];
const editorSocials = ["Instagram", "YouTube", "Behance", "Dribbble", "Website", "LinkedIn"];
const portfolioLinks = ["Website", "Drive Link", "Behance", "Dropbox"];
const connectPlatforms = ["YouTube", "Instagram", "Behance", "Vimeo"];
const availabilityOptions = ["Available", "Busy", "Full Time", "Part Time", "Agency"];

const emptyClient = {
  avatar: "",
  profile_name: "",
  company: "",
  bio: "",
  creator_types: [],
  video_types: [],
  hire_frequency: "",
  monthly_budget: "₹25k",
  social_links: {},
};

const emptyEditor = {
  avatar: "",
  bio: "",
  country: "",
  languages: "",
  timezone: "",
  experience_level: "",
  years_experience: "",
  categories: [],
  software: [],
  hourly_rate: "",
  starting_price: "",
  currency: "INR",
  social_links: {},
  portfolio_links: {},
  connected_accounts: {},
  portfolio_videos: [],
  availability: "",
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
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

async function videosFromFiles(files, existing = []) {
  const selected = Array.from(files || []).slice(0, 1);
  const items = [];
  for (const file of selected) {
    if (!/\.(mp4|mov)$/i.test(file.name)) throw new Error("Videos must be MP4 or MOV files.");
    const src = await readFile(file, 500);
    items.push({ name: file.name, size: file.size, src });
  }
  return items.slice(0, 1);
}

function TextInput({ label, value, onChange, placeholder, type = "text", invalid }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</span>
      <input
        type={type}
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-2 h-12 w-full rounded-xl border bg-white/5 px-4 text-white outline-none transition placeholder:text-gray-600 ${invalid ? "border-red-400" : "border-white/10 focus:border-[#39FF14]"}`}
      />
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 5 }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</span>
      <textarea
        rows={rows}
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-4 text-white outline-none transition placeholder:text-gray-600 focus:border-[#39FF14]"
      />
    </label>
  );
}

function AvatarUpload({ value, onChange, label = "Profile Picture" }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="h-24 w-24 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-500"><UserRound /></div>
          )}
        </div>
        <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10">
          <UploadCloud size={16} /> Upload photo
          <input hidden type="file" accept="image/*" onChange={async (e) => onChange(await readFile(e.target.files?.[0], 2))} />
        </label>
      </div>
    </div>
  );
}

function Chip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-10 rounded-full border px-4 py-2 text-sm font-semibold transition ${active ? "border-[#39FF14] bg-[#39FF14] text-black" : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"}`}
    >
      {children}
    </button>
  );
}

function RadioCard({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left text-sm font-semibold transition ${active ? "border-[#39FF14] bg-[#39FF14]/10 text-white" : "border-white/10 bg-white/[0.04] text-gray-300 hover:bg-white/[0.08]"}`}
    >
      <span className={`mr-3 inline-flex h-4 w-4 rounded-full border align-middle ${active ? "border-[#39FF14] bg-[#39FF14]" : "border-white/30"}`} />
      {children}
    </button>
  );
}

function WizardCard({ children }) {
  return (
    <div className="w-full rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur sm:p-8">
      {children}
    </div>
  );
}

function LinkGrid({ fields, values, onChange }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => (
        <TextInput
          key={field}
          label={field}
          value={values?.[field] || ""}
          invalid={!isUrl(values?.[field])}
          onChange={(value) => onChange({ ...(values || {}), [field]: value })}
          placeholder="https://"
        />
      ))}
    </div>
  );
}

export default function Onboarding() {
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const [phase, setPhase] = useState("welcome");
  const [role, setRole] = useState(user?.can_edit ? "editor" : user?.can_hire && user?.role !== "pending" ? "client" : "");
  const [roleStep, setRoleStep] = useState(0);
  const [clientForm, setClientForm] = useState(() => JSON.parse(localStorage.getItem("editcol_client_onboarding") || "null") || emptyClient);
  const [editorForm, setEditorForm] = useState(() => JSON.parse(localStorage.getItem("editcol_editor_onboarding") || "null") || emptyEditor);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get("/onboarding/me").then(({ data }) => {
      if (data.user?.can_edit) setRole("editor");
      else if (data.user?.can_hire && data.user?.role !== "pending") setRole("client");
      if (data.client_profile) setClientForm((f) => ({ ...f, ...data.client_profile }));
      if (data.editor_profile) setEditorForm((f) => ({ ...f, ...data.editor_profile }));
    }).catch(() => {});
  }, []);

  useEffect(() => { localStorage.setItem("editcol_client_onboarding", JSON.stringify(clientForm)); }, [clientForm]);
  useEffect(() => { localStorage.setItem("editcol_editor_onboarding", JSON.stringify(editorForm)); }, [editorForm]);

  const form = role === "editor" ? editorForm : clientForm;
  const totalRoleSteps = role === "editor" ? 11 : 6;
  const stepLabel = phase === "welcome" ? 1 : phase === "role" ? 2 : Math.min(roleStep + 3, totalRoleSteps + 3);
  const totalSteps = totalRoleSteps + 3;

  const invalidUrls = useMemo(() => {
    const socialInvalid = Object.values(form.social_links || {}).some((value) => !isUrl(value));
    const portfolioInvalid = Object.values(form.portfolio_links || {}).some((value) => !isUrl(value));
    const connectedInvalid = Object.values(form.connected_accounts || {}).some((value) => !isUrl(value));
    return socialInvalid || portfolioInvalid || connectedInvalid;
  }, [form]);

  const setForm = (patch) => {
    if (role === "editor") setEditorForm((current) => ({ ...current, ...patch }));
    else setClientForm((current) => ({ ...current, ...patch }));
  };

  const toggle = (key, item) => {
    const list = form[key] || [];
    setForm({ [key]: list.includes(item) ? list.filter((value) => value !== item) : [...list, item] });
  };

  const saveRole = async (nextRole) => {
    setBusy(true);
    setErr("");
    try {
      const { data } = await api.post("/onboarding/role", { role: nextRole });
      await refresh();
      setRole(data.user.can_edit ? "editor" : "client");
      setRoleStep(0);
      setPhase("profile");
    } catch (e) {
      setErr(formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  const persistProfile = async () => {
    if (invalidUrls) throw new Error("Please fix invalid URLs before continuing.");
    await api.put("/onboarding/profile", { data: form });
  };

  const next = async () => {
    setBusy(true);
    setErr("");
    try {
      if (role === "editor" && roleStep === 8) {
      const count = (editorForm.portfolio_videos || []).length;
      if (count < 1) throw new Error("Upload at least 1 video.");
      }
      if (roleStep === totalRoleSteps - 1) {
        await persistProfile();
        const { data } = await api.post("/onboarding/complete");
        await refresh();
        localStorage.removeItem("editcol_client_onboarding");
        localStorage.removeItem("editcol_editor_onboarding");
        setPhase("thanks");
        if (!data.user.can_edit) setTimeout(() => nav("/dashboard", { replace: true }), 1400);
        return;
      }
      await persistProfile();
      setRoleStep((step) => step + 1);
    } catch (e) {
      setErr(formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  const back = () => {
    setErr("");
    if (phase === "profile" && roleStep > 0) setRoleStep((step) => step - 1);
    else if (phase === "profile") setPhase("role");
    else if (phase === "role") setPhase("welcome");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#050608] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <div className="font-heading text-2xl font-black tracking-tight">EDITCOL</div>
          {phase !== "thanks" && <div className="text-xs font-semibold text-gray-400">Step {stepLabel} of {totalSteps}</div>}
        </div>
        {phase !== "thanks" && (
          <div className="mt-5 grid gap-2" style={{ gridTemplateColumns: `repeat(${totalSteps}, minmax(0, 1fr))` }}>
            {Array.from({ length: totalSteps }, (_, index) => (
              <div key={index} className={`h-1 rounded-full ${stepLabel >= index + 1 ? "bg-[#39FF14]" : "bg-white/10"}`} />
            ))}
          </div>
        )}

        <div className="flex flex-1 items-center py-10">
          <AnimatePresence mode="wait">
            {phase === "welcome" && (
              <motion.section key="welcome" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="w-full">
                <div className="max-w-2xl">
                  <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#39FF14]">Welcome {user.name?.split(" ")?.[0] || "there"} 👋</p>
                  <h1 className="mt-4 font-heading text-4xl font-black tracking-tight sm:text-6xl">Let's build your EditCol profile.</h1>
                  <p className="mt-5 text-lg text-gray-400">This only takes about 2 minutes.</p>
                  <button onClick={() => setPhase("role")} className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-[#39FF14] px-6 font-bold text-black">
                    Continue <ArrowRight size={18} />
                  </button>
                </div>
              </motion.section>
            )}

            {phase === "role" && (
              <motion.section key="role" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="w-full">
                <h1 className="font-heading text-4xl font-black">Choose how you want to use EditCol</h1>
                <div className="mt-8 grid gap-5 md:grid-cols-2">
                  <RoleChoice
                    active={role === "client"}
                    emoji="👤"
                    title="I want to hire editors"
                    items={["Create projects", "Hire editors", "Manage work"]}
                    onClick={() => setRole("client")}
                  />
                  <RoleChoice
                    active={role === "editor"}
                    emoji="🎬"
                    title="I'm a professional video editor"
                    items={["Build portfolio", "Receive projects", "Earn money"]}
                    onClick={() => setRole("editor")}
                  />
                </div>
                {err && <p className="mt-4 text-sm text-red-300">{err}</p>}
                <div className="mt-8 flex justify-between">
                  <button onClick={back} className="inline-flex items-center gap-2 text-sm text-gray-400"><ArrowLeft size={16} /> Back</button>
                  <button disabled={!role || busy} onClick={() => saveRole(role)} className="inline-flex h-12 items-center gap-2 rounded-full bg-[#39FF14] px-6 font-bold text-black disabled:opacity-50">
                    {busy && <Loader2 size={16} className="animate-spin" />} Continue
                  </button>
                </div>
              </motion.section>
            )}

            {phase === "profile" && (
              <motion.section key={`${role}-${roleStep}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="w-full">
                <ProfileStep role={role} step={roleStep} form={form} setForm={setForm} toggle={toggle} user={user} />
                {err && <p className="mt-4 text-sm text-red-300">{err}</p>}
                <div className="mt-8 flex justify-between">
                  <button onClick={back} className="inline-flex items-center gap-2 text-sm text-gray-400"><ArrowLeft size={16} /> Back</button>
                  <button onClick={next} disabled={busy} className="inline-flex h-12 items-center gap-2 rounded-full bg-[#39FF14] px-6 font-bold text-black disabled:opacity-50">
                    {busy && <Loader2 size={16} className="animate-spin" />}
                    {roleStep === totalRoleSteps - 1 ? "Submit" : "Continue"}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </motion.section>
            )}

            {phase === "thanks" && (
              <motion.section key="thanks" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto w-full max-w-xl text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#39FF14] text-black">
                  <CheckCircle2 size={34} />
                </div>
                <h1 className="mt-6 font-heading text-4xl font-black">Thank you 🎉</h1>
                <p className="mt-4 text-lg text-gray-300">
                  {role === "editor" ? "Your profile has been submitted." : "Your profile is ready."}
                </p>
                {role === "editor" && (
                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-gray-300">
                    <p>Our team will review your videos.</p>
                    <p className="mt-2 font-semibold text-white">Estimated verification time: 12-24 hours</p>
                  </div>
                )}
                <button onClick={() => nav("/dashboard", { replace: true })} className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-[#39FF14] px-6 font-bold text-black">
                  Go to dashboard <ArrowRight size={16} />
                </button>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function RoleChoice({ active, emoji, title, items, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-72 rounded-3xl border p-7 text-left transition ${active ? "border-[#39FF14] bg-[#39FF14]/10 shadow-[0_0_40px_rgba(57,255,20,0.14)]" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"}`}
    >
      <div className="text-4xl">{emoji}</div>
      <h2 className="mt-5 max-w-sm font-heading text-3xl font-black leading-tight">{title}</h2>
      <ul className="mt-7 space-y-3 text-gray-300">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-3"><CheckCircle2 size={17} className="text-[#39FF14]" /> {item}</li>
        ))}
      </ul>
    </button>
  );
}

function ProfileStep({ role, step, form, setForm, toggle, user }) {
  if (role === "client") return <ClientStep step={step} form={form} setForm={setForm} toggle={toggle} user={user} />;
  return <EditorStep step={step} form={form} setForm={setForm} toggle={toggle} />;
}

function ClientStep({ step, form, setForm, toggle, user }) {
  const screens = [
    {
      title: "Profile",
      content: (
        <WizardCard>
          <div className="space-y-6">
            <AvatarUpload value={form.avatar} onChange={(avatar) => setForm({ avatar })} />
            <TextInput label="Name" value={form.profile_name || user.name} onChange={(profile_name) => setForm({ profile_name })} />
            <TextInput label="Company (optional)" value={form.company} onChange={(company) => setForm({ company })} />
            <TextArea label="Bio" value={form.bio} onChange={(bio) => setForm({ bio })} placeholder="Tell editors what you create." />
          </div>
        </WizardCard>
      ),
    },
    {
      title: "What do you create?",
      content: <ChoiceGrid options={clientCreatorTypes} values={form.creator_types} onToggle={(item) => toggle("creator_types", item)} />,
    },
    {
      title: "What type of editing do you need?",
      content: <ChoiceGrid options={clientEditingTypes} values={form.video_types} onToggle={(item) => toggle("video_types", item)} />,
    },
    {
      title: "How often do you hire?",
      content: <div className="grid gap-3 sm:grid-cols-2">{hireFrequency.map((item) => <RadioCard key={item} active={form.hire_frequency === item} onClick={() => setForm({ hire_frequency: item })}>{item}</RadioCard>)}</div>,
    },
    {
      title: "Monthly Budget",
      content: (
        <WizardCard>
          <input
            type="range"
            min="0"
            max={budgetMarks.length - 1}
            value={Math.max(0, budgetMarks.indexOf(form.monthly_budget))}
            onChange={(e) => setForm({ monthly_budget: budgetMarks[Number(e.target.value)] })}
            className="w-full accent-[#39FF14]"
          />
          <div className="mt-5 flex justify-between text-sm font-semibold text-gray-400">{budgetMarks.map((mark) => <span key={mark}>{mark}</span>)}</div>
          <p className="mt-8 font-heading text-4xl font-black text-[#39FF14]">{form.monthly_budget}</p>
        </WizardCard>
      ),
    },
    {
      title: "Social Links",
      content: <WizardCard><LinkGrid fields={clientSocials} values={form.social_links} onChange={(social_links) => setForm({ social_links })} /></WizardCard>,
    },
  ];

  return <StepShell title={screens[step].title}>{screens[step].content}</StepShell>;
}

function EditorStep({ step, form, setForm, toggle }) {
  const screens = [
    {
      title: "Profile",
      content: (
        <WizardCard>
          <div className="space-y-6">
            <AvatarUpload value={form.avatar} onChange={(avatar) => setForm({ avatar })} />
            <TextArea label="Bio" value={form.bio} onChange={(bio) => setForm({ bio })} placeholder="Describe your editing style, niches, and strongest work." />
            <div className="grid gap-4 sm:grid-cols-3">
              <TextInput label="Country" value={form.country} onChange={(country) => setForm({ country })} />
              <TextInput label="Languages" value={form.languages} onChange={(languages) => setForm({ languages })} />
              <TextInput label="Timezone" value={form.timezone} onChange={(timezone) => setForm({ timezone })} />
            </div>
          </div>
        </WizardCard>
      ),
    },
    {
      title: "Experience Level",
      content: <div className="grid gap-3 sm:grid-cols-2">{experienceLevels.map((item) => <RadioCard key={item} active={form.experience_level === item} onClick={() => setForm({ experience_level: item })}>{item}</RadioCard>)}</div>,
    },
    {
      title: "Years of Experience",
      content: <WizardCard><TextInput label="Years" type="number" value={form.years_experience} onChange={(years_experience) => setForm({ years_experience })} placeholder="3" /></WizardCard>,
    },
    {
      title: "Editing Categories",
      content: <ChoiceGrid options={editorCategories} values={form.categories} onToggle={(item) => toggle("categories", item)} />,
    },
    {
      title: "Software",
      content: <ChoiceGrid options={softwareOptions} values={form.software} onToggle={(item) => toggle("software", item)} />,
    },
    {
      title: "Pricing",
      content: (
        <WizardCard>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextInput label="Hourly" type="number" value={form.hourly_rate} onChange={(hourly_rate) => setForm({ hourly_rate })} />
            <TextInput label="Minimum Project Price" type="number" value={form.starting_price} onChange={(starting_price) => setForm({ starting_price })} />
            <TextInput label="Currency" value={form.currency} onChange={(currency) => setForm({ currency })} />
          </div>
        </WizardCard>
      ),
    },
    {
      title: "Social Links",
      content: <WizardCard><LinkGrid fields={editorSocials} values={form.social_links} onChange={(social_links) => setForm({ social_links })} /></WizardCard>,
    },
    {
      title: "Portfolio",
      content: (
        <WizardCard>
          <LinkGrid fields={portfolioLinks} values={form.portfolio_links} onChange={(portfolio_links) => setForm({ portfolio_links })} />
          <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="font-semibold text-white">Connect your channels</p>
            <p className="mt-1 text-sm text-gray-400">URL verification now. OAuth imports can attach followers, thumbnails, recent work, and profile pictures later.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {connectPlatforms.map((platform) => (
                <TextInput
                  key={platform}
                  label={`Connect ${platform}`}
                  value={form.connected_accounts?.[platform] || ""}
                  invalid={!isUrl(form.connected_accounts?.[platform])}
                  onChange={(value) => setForm({ connected_accounts: { ...(form.connected_accounts || {}), [platform]: value } })}
                  placeholder="https://"
                />
              ))}
            </div>
          </div>
        </WizardCard>
      ),
    },
    {
      title: "Upload Your Best Work",
      content: (
        <WizardCard>
          <p className="text-gray-300"> Upload 1 portfolio video.</p>
          <p className="mt-2 text-sm text-gray-500">Supported: MP4, MOV. Max 500MB each.</p>
          <label className="mt-5 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#39FF14]/40 bg-[#39FF14]/5 p-5 text-center text-sm text-gray-300 hover:bg-[#39FF14]/10">
            <UploadCloud className="mb-2 text-[#39FF14]" /> Upload videos
            <input
  hidden
  type="file"
  accept=".mp4,.mov,video/mp4,video/quicktime"
  onChange={async (e) => {
    const videos = await videosFromFiles(e.target.files, []);
    setForm({
      portfolio_videos: videos.slice(0, 1),
    });
  }}
/>
          </label>
          <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
            <span>{(form.portfolio_videos || []).length}/10 uploaded</span>
            <span>{(form.portfolio_videos || []).length >= 1 ? "Ready" : "Need at least 1"}</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(form.portfolio_videos || []).map((video, index) => (
              <div key={`${video.name}-${index}`} className="rounded-2xl border border-white/10 bg-black/30 p-3">
                <video src={video.src} controls className="aspect-video w-full rounded-xl bg-black object-cover" />
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-gray-400">
                  <span className="truncate">{video.name}</span>
                  <button type="button" onClick={() => setForm({ portfolio_videos: form.portfolio_videos.filter((_, i) => i !== index) })} className="text-red-300">Remove</button>
                </div>
              </div>
            ))}
          </div>
        </WizardCard>
      ),
    },
    {
      title: "Availability",
      content: <div className="grid gap-3 sm:grid-cols-2">{availabilityOptions.map((item) => <RadioCard key={item} active={form.availability === item} onClick={() => setForm({ availability: item })}>{item}</RadioCard>)}</div>,
    },
    {
      title: "Review Everything",
      content: (
        <WizardCard>
          <div className="grid gap-4 text-sm text-gray-300 sm:grid-cols-2">
            <ReviewItem label="Experience" value={form.experience_level} />
            <ReviewItem label="Years" value={form.years_experience} />
            <ReviewItem label="Categories" value={(form.categories || []).join(", ")} />
            <ReviewItem label="Software" value={(form.software || []).join(", ")} />
            <ReviewItem label="Pricing" value={`${form.currency || "INR"} ${form.starting_price || "-"} minimum`} />
            <ReviewItem label="Videos" value={`${(form.portfolio_videos || []).length} uploaded`} />
            <ReviewItem label="Availability" value={form.availability} />
            <ReviewItem label="Connected" value={Object.values(form.connected_accounts || {}).filter(Boolean).length ? "Yes" : "Not yet"} />
          </div>
        </WizardCard>
      ),
    },
  ];

  return <StepShell title={screens[step].title}>{screens[step].content}</StepShell>;
}

function StepShell({ title, children }) {
  return (
    <div>
      <h1 className="font-heading text-4xl font-black">{title}</h1>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function ChoiceGrid({ options, values = [], onToggle }) {
  return (
    <WizardCard>
      <div className="flex flex-wrap gap-3">
        {options.map((item) => <Chip key={item} active={values.includes(item)} onClick={() => onToggle(item)}>{item}</Chip>)}
      </div>
    </WizardCard>
  );
}

function ReviewItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 break-words text-white">{value || "Not added"}</p>
    </div>
  );
}
