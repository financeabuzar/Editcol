import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, BadgeCheck, ChevronDown, Clock, Crown, Film, MessageSquare,
  Play, Scissors, Sparkles, Star, Wand2, Zap, X
} from "lucide-react";
import api from "@/lib/api";
import TrustBadges from "@/components/TrustBadges";
import { useAuth } from "@/context/AuthContext";
import { FAQ_ITEMS, faqJsonLd, jsonLdGraph, SEO_DESCRIPTION, SEO_TITLE } from "@/seo/schema";

const logos = ["VOLT", "NOVA", "FRAME", "ARC", "KIN", "MONO", "LOOP", "PRISM"];
const categories = ["YouTube", "Instagram", "Reels", "Ads", "Podcasts", "Gaming", "Corporate", "Wedding", "Documentary", "Music Videos"];
const stats = [
  ["50K+", "Projects shaped"],
  ["10K+", "Editor network"],
  ["4.9", "Average rating"],
  ["180M+", "Views generated"],
];
const showcase = [
  { name: "Maya Chen", craft: "Retention-first YouTube edits", price: "$420", review: "Turned a loose 48 minute recording into a launch film that felt inevitable." },
  { name: "Leon Armand", craft: "Cinematic ads and founder films", price: "$950", review: "The pacing, grade, and sound design changed how our product felt." },
  { name: "Iris Vale", craft: "Short-form systems for creators", price: "$260", review: "Every hook landed. We finally had a repeatable clips engine." },
];
const visualAssets = [
  "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=900&q=80",
];

export default function Home() {
  const [editors, setEditors] = useState([]);
  const { user } = useAuth();
  const nav = useNavigate();
  const [openFaqIndexes, setOpenFaqIndexes] = useState([0]);

  useEffect(() => {
    api.get("/editors").then(r => setEditors(r.data.slice(0, 6))).catch(() => {});
  }, []);

  useEffect(() => {
    document.title = SEO_TITLE;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", SEO_DESCRIPTION);
  }, []);

  const featured = useMemo(() => {
    if (editors.length) return editors;
    return [
      { id: "demo-1", name: "Maya Chen", bio: "YouTube retention editor for creator-led brands", starting_price: 420, skills: ["YouTube", "Story", "Color"], badges: ["elite"], avatar: visualAssets[0], portfolio_videos: [{ src: "https://assets.mixkit.co/videos/preview/mixkit-woman-filming-with-a-camera-34293-large.mp4", name: "Camera Reel" }] },
      { id: "demo-2", name: "Leon Armand", bio: "Commercial films, product launch ads, cinematic docs", starting_price: 950, skills: ["Ads", "Sound", "Grade"], badges: ["top_rated"], avatar: visualAssets[1], portfolio_videos: [{ src: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-video-editor-using-a-keyboard-and-mouse-41857-large.mp4", name: "Editing Setup" }] },
      { id: "demo-3", name: "Iris Vale", bio: "Short-form systems for podcasts and founders", starting_price: 260, skills: ["Reels", "Captions", "Motion"], badges: ["pro"], avatar: visualAssets[2], portfolio_videos: [{ src: "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4", name: "Cinematic Forest" }] },
    ];
  }, [editors]);

  const becomeEditorTarget = () => {
    if (!user || user === false) return nav("/register");
    if (user.role === "editor") return nav("/editor/onboarding");
    if (user.role === "admin") return nav("/admin");
    return nav("/become-editor");
  };

  const toggleFaq = (index) => {
    setOpenFaqIndexes((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index]
    );
  };

  return (
    <div className="fade-in overflow-hidden">
      <script type="application/ld+json">{JSON.stringify(jsonLdGraph)}</script>
      <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>

      <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden cinema-noise" aria-labelledby="home-hero-title">
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute right-[-10vw] top-20 hidden h-[34rem] w-[58rem] rounded-full bg-[#7c5cff]/15 blur-3xl lg:block" />
        <div className="premium-shell relative grid min-h-[calc(100vh-4rem)] items-center gap-12 py-16 lg:grid-cols-[0.92fr_1.08fr]">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              <Sparkles size={14} className="text-primary" /> Curated post-production talent
            </span>
            <h1 id="home-hero-title" className="mt-6 max-w-5xl text-[clamp(3.6rem,8.4vw,8.8rem)] font-black leading-[0.86] tracking-[-0.035em] text-foreground">
              Hire Editors That Make Content Go Viral.
            </h1>
            <p className="section-copy mt-7 max-w-2xl">
              EditCol connects creators, agencies, brands, and startups with elite video editors who understand retention, pacing, sound, color, thumbnails, and the business of attention.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/ai-match" data-testid="hero-aimatch-btn" className="btn-primary">
                Hire an Editor <ArrowRight size={16} />
              </Link>
              <button onClick={becomeEditorTarget} data-testid="hero-join-btn" className="btn-outline">Become an Editor</button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.94, rotate: 1 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.85, ease: "easeOut", delay: 0.12 }} className="relative min-h-[32rem]">
            <CinematicTimeline />
          </motion.div>
        </div>
      </section>

      <TrustedBy />
      <FeaturedEditors editors={featured} isDemo={!editors.length} becomeEditorTarget={becomeEditorTarget} />
      <EditorShowcase />
      <WhyChoose />
      <Categories />
      <Workflow />
      <Stats />
      <Testimonials />
      <Pricing />
      <Faq openFaqIndexes={openFaqIndexes} toggleFaq={toggleFaq} />
      <SeoSection />

      <section className="premium-shell py-20 sm:py-28" aria-labelledby="home-cta-title">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-secondary p-8 sm:p-14 lg:p-20 cinema-noise">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(124,92,255,0.15),transparent_60%)]" />
          <div className="relative max-w-3xl">
            <p className="eyebrow">Final cut energy</p>
            <h2 id="home-cta-title" className="mt-4 text-5xl font-black leading-[0.95] text-foreground sm:text-7xl">
              Ready to create your next viral video?
            </h2>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/browse" className="btn-primary">Start hiring</Link>
              <button onClick={becomeEditorTarget} className="btn-outline">Join as editor</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function CinematicTimeline() {
  const rows = [
    ["#7c5cff", "Intro hook", "00:00"],
    ["#43d9ff", "B-roll lift", "00:12"],
    ["#7c5cff", "Sound hit", "00:27"],
    ["#7c5cff", "CTA lock", "00:44"],
  ];
  return (
    <div className="absolute left-1/2 top-1/2 w-[42rem] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 perspective-[1200px]">
      <div className="timeline-3d relative rounded-2xl border border-border bg-card/95 p-4 shadow-[0_42px_130px_rgba(0,0,0,0.15)] dark:shadow-[0_42px_130px_rgba(0,0,0,.55)]">
        <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
          <div className="flex gap-2"><span className="h-3 w-3 rounded-full bg-[#ff5f57]" /><span className="h-3 w-3 rounded-full bg-[#ffbd2e]" /><span className="h-3 w-3 rounded-full bg-[#28c840]" /></div>
          <span className="text-xs text-muted-foreground">EditCol Studio / timeline</span>
        </div>
        <div className="relative space-y-3 overflow-hidden">
          <div className="playhead-scan absolute bottom-0 top-0 z-10 w-px bg-[#43d9ff] shadow-[0_0_32px_rgba(67,217,255,.9)]" />
          {rows.map(([color, label, time], index) => (
            <div key={label} className="grid grid-cols-[5rem_1fr_4rem] items-center gap-3">
              <span className="text-xs text-muted-foreground">{time}</span>
              <div className="h-16 overflow-hidden rounded-[8px] border border-border bg-secondary/40">
                <motion.div
                  className="h-full rounded-[7px]"
                  style={{ width: `${78 - index * 9}%`, background: `linear-gradient(90deg, ${color}33, ${color}aa)` }}
                  animate={{ x: [0, 8, 0] }}
                  transition={{ duration: 4 + index, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              <span className="text-right text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {visualAssets.map((src, i) => (
            <img key={src} src={src} alt="" className="h-24 w-full rounded-[8px] border border-border object-cover opacity-80" style={{ transform: `translateY(${i % 2 ? 18 : 0}px)` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TrustedBy() {
  return (
    <section className="border-y border-border bg-secondary/30 py-8" aria-label="Trusted by">
      <div className="premium-shell">
        <p className="eyebrow mb-5">Trusted by creator teams</p>
        <div className="overflow-hidden">
          <div className="animate-marquee flex w-max gap-10">
            {[...logos, ...logos].map((logo, index) => (
              <span key={`${logo}-${index}`} className="text-2xl font-black tracking-[0.22em] text-muted-foreground/35">{logo}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedEditors({ editors, isDemo, becomeEditorTarget }) {
  return (
    <section className="premium-shell py-20 sm:py-28" aria-labelledby="featured-editors-title">
      <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Featured editors</p>
          <h2 id="featured-editors-title" className="section-title mt-3">Elite cuts. Visible signal.</h2>
        </div>
        <Link to="/browse" className="btn-outline md:w-auto">Explore marketplace <ArrowRight size={16} /></Link>
      </div>
      {isDemo && (
        <div className="mb-5 rounded-[8px] border border-white/[0.08] bg-white/[0.035] px-4 py-3 text-sm text-[#a0a0a0]">
          Live editors will appear here as the marketplace fills. These cards show the intended premium browsing experience.
        </div>
      )}
      <div className="grid gap-5 md:grid-cols-3">
        {editors.map((editor, i) => <EditorMiniCard key={editor.id || editor.name} editor={editor} index={i} />)}
      </div>
      {isDemo && <button onClick={becomeEditorTarget} className="btn-primary mt-6">Be the first live editor</button>}
    </section>
  );
}

export function EditorMiniCard({ editor, index = 0 }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const isDemo = String(editor.id || "").startsWith("demo-");
  const bestVideo = editor.portfolio_videos?.[0]?.src;

  const handlePlayClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (bestVideo) {
      setIsPlaying(true);
    } else {
      alert("This editor hasn't uploaded a video reel yet.");
    }
  };

  const content = (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay: index * 0.08, duration: 0.55 }}
      className="card card-hover group h-full overflow-hidden"
      data-testid={editor.id ? `editor-card-${editor.id}` : undefined}
    >
      <div className="relative h-72 overflow-hidden bg-[#0e0e0e]">
        {editor.avatar ? (
          <img src={editor.avatar} alt={`${editor.name} video editor portfolio profile`} loading="lazy" decoding="async" className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-105 group-hover:opacity-100" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        ) : (
          <div className="grid h-full place-items-center text-6xl font-black text-white/20">{editor.name?.[0]?.toUpperCase()}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent" />
        <button 
          onClick={handlePlayClick}
          className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur transition hover:scale-110 active:scale-95 group-hover:border-purple-500/50" 
          aria-label="Preview portfolio"
        >
          <Play size={15} fill="currentColor" />
        </button>
        <div className="absolute bottom-4 left-4 right-4 translate-y-3 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="flex flex-wrap gap-2">
            {(editor.skills || ["Story", "Pacing", "Sound"]).slice(0, 3).map(skill => <span key={skill} className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white backdrop-blur">{skill}</span>)}
          </div>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xl font-bold text-white">{editor.name}</p>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#a0a0a0]">{editor.bio || "Cinematic video editor"}</p>
          </div>
          <p className="rounded-full bg-white/[0.06] px-3 py-1.5 text-sm font-bold text-white">${editor.starting_price ?? "-"}</p>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <TrustBadges badges={editor.badges} />
          <span className="text-xs font-semibold text-[#43d9ff]">Available now</span>
        </div>
      </div>
    </motion.article>
  );

  return (
    <>
      {isDemo ? content : <Link to={`/editor/${editor.id}`} className="block h-full">{content}</Link>}

      <AnimatePresence>
        {isPlaying && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md" 
            onClick={() => setIsPlaying(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-3xl aspect-video rounded-3xl overflow-hidden border border-zinc-800 bg-[#050505] shadow-2xl" 
              onClick={e => e.stopPropagation()}
            >
              <button 
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors border border-white/10" 
                onClick={() => setIsPlaying(false)}
              >
                <X size={18} />
              </button>
              <video 
                src={bestVideo} 
                autoPlay 
                controls 
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 pt-16">
                <div className="text-white text-left">
                  <p className="font-bold text-lg">{editor.name}</p>
                  <p className="text-xs text-zinc-400">Featured Video Reel</p>
                </div>
                <Link 
                  to={`/editor/${editor.id}`} 
                  className="btn-primary text-xs py-2 px-4 min-h-0 font-bold"
                >
                  View Full Profile
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function EditorShowcase() {
  return (
    <section className="bg-secondary/40 py-20 sm:py-28 border-y border-border" aria-labelledby="showcase-title">
      <div className="premium-shell">
        <p className="eyebrow">Editor showcase</p>
        <h2 id="showcase-title" className="section-title mt-3 max-w-5xl">Portfolio pages that sell the craft before the first call.</h2>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {showcase.map((item, i) => (
            <motion.article key={item.name} whileHover={{ y: -8 }} className="card overflow-hidden">
              <img src={visualAssets[i]} alt="" className="h-56 w-full object-cover opacity-80" />
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-foreground">{item.name}</h3>
                  <span className="text-sm font-bold text-primary">{item.price}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.craft}</p>
                <p className="mt-5 border-l border-primary pl-4 text-sm leading-6 text-foreground/80">"{item.review}"</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyChoose() {
  const points = [
    ["01", "Taste-matched", "Briefs are mapped to editing style, channel format, and proof of similar outcomes."],
    ["02", "Signal rich", "Profiles show reels, pricing, reviews, badges, availability, software, and delivery behavior."],
    ["03", "Production ready", "Messaging, hiring, timelines, and project context keep post-production moving."],
  ];
  return (
    <section className="premium-shell py-20 sm:py-28" aria-labelledby="why-title">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="eyebrow">Why EditCol</p>
          <h2 id="why-title" className="section-title mt-3">Not a freelancer list. A talent signal engine.</h2>
        </div>
        <div className="space-y-4">
          {points.map(([n, t, d]) => (
            <motion.div key={n} initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="grid gap-4 rounded-xl border border-border bg-secondary/30 p-5 sm:grid-cols-[4rem_1fr]">
              <span className="text-3xl font-black text-muted-foreground/30">{n}</span>
              <div><h3 className="text-2xl font-bold text-foreground">{t}</h3><p className="mt-2 leading-7 text-muted-foreground">{d}</p></div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Categories() {
  return (
    <section className="border-y border-border bg-secondary/20 py-16" aria-labelledby="categories-title">
      <div className="premium-shell">
        <p className="eyebrow">Editing categories</p>
        <h2 id="categories-title" className="mt-3 text-4xl font-black text-foreground sm:text-6xl">Every format has a native editor.</h2>
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-5">
          {categories.map((cat, i) => (
            <motion.div key={cat} whileHover={{ y: -5, scale: 1.02 }} className="group rounded-xl border border-border bg-card p-4">
              <div className="mb-8 flex justify-between text-xs text-muted-foreground"><span>0{i + 1}</span><Scissors size={15} className="text-primary opacity-0 transition group-hover:opacity-100" /></div>
              <p className="font-bold text-foreground">{cat}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Workflow() {
  const steps = ["Post Project", "Receive Applications", "Chat", "Hire", "Receive Video"];
  return (
    <section className="premium-shell py-20 sm:py-28" aria-labelledby="workflow-title">
      <p className="eyebrow">How it works</p>
      <h2 id="workflow-title" className="section-title mt-3">From raw footage to final delivery.</h2>
      <div className="mt-12 grid gap-4 md:grid-cols-5">
        {steps.map((step, i) => (
          <motion.article key={step} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }} className="card p-5">
            <span className="text-sm font-bold text-primary">0{i + 1}</span>
            <h3 className="mt-8 min-h-14 text-xl font-bold text-foreground">{step}</h3>
            <ArrowRight className="mt-6 text-muted-foreground/30 md:rotate-0" />
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="bg-secondary/30 py-16 border-y border-border" aria-label="Marketplace statistics">
      <div className="premium-shell grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([value, label]) => (
          <div key={label} className="rounded-xl border border-border bg-card p-6">
            <p className="text-5xl font-black text-foreground">{value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="premium-shell py-20 sm:py-28" aria-labelledby="testimonials-title">
      <p className="eyebrow">Video testimonials</p>
      <h2 id="testimonials-title" className="section-title mt-3">Client notes with edit-room proof.</h2>
      <div className="scroll-area mt-10 flex gap-5 overflow-x-auto pb-4">
        {showcase.map((item, i) => (
          <article key={item.name} className="card min-w-[20rem] overflow-hidden sm:min-w-[28rem]">
            <div className="relative h-60">
              <img src={visualAssets[(i + 1) % visualAssets.length]} alt="" className="h-full w-full object-cover opacity-75" />
              <div className="absolute inset-0 grid place-items-center bg-black/18"><span className="grid h-14 w-14 place-items-center rounded-full bg-white text-black"><Play size={18} fill="currentColor" /></span></div>
            </div>
            <div className="p-5"><p className="text-lg font-semibold leading-7 text-foreground">"{item.review}"</p><p className="mt-4 text-sm text-muted-foreground">{item.name}</p></div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    ["Creator Sprint", "For one-off edits", "$250+", ["Short-form cuts", "Clear editor shortlist", "Direct messaging"]],
    ["Launch Film", "For premium campaigns", "$900+", ["Cinematic editors", "Motion and sound", "Priority availability"]],
    ["Content Engine", "For teams publishing weekly", "Custom", ["Dedicated bench", "Recurring delivery", "Performance review"]],
  ];
  return (
    <section className="bg-secondary/20 py-20 sm:py-28 border-y border-border" aria-labelledby="pricing-title">
      <div className="premium-shell">
        <p className="eyebrow">Pricing</p>
        <h2 id="pricing-title" className="section-title mt-3">Premium editors, transparent entry points.</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {plans.map(([name, sub, price, items], i) => (
            <article key={name} className={`card p-6 ${i === 1 ? "ring-2 ring-primary" : ""}`}>
              <p className="text-xl font-bold text-foreground">{name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
              <p className="mt-8 text-5xl font-black text-foreground">{price}</p>
              <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
                {items.map(item => <li key={item} className="flex items-center gap-2"><BadgeCheck size={16} className="text-primary" /> {item}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq({ openFaqIndexes, toggleFaq }) {
  return (
    <section className="premium-shell py-20 sm:py-28" aria-labelledby="faq-title">
      <p className="eyebrow">FAQ</p>
      <h2 id="faq-title" className="section-title mt-3">Before you book the edit.</h2>
      <div className="mt-10 max-w-4xl space-y-3">
        {FAQ_ITEMS.slice(0, 6).map((item, index) => (
          <article key={item.question} className="card overflow-hidden">
            <button type="button" aria-expanded={openFaqIndexes.includes(index)} className="flex w-full items-start justify-between gap-4 p-5 text-left text-lg font-bold text-foreground" onClick={() => toggleFaq(index)}>
              <span>{item.question}</span>
              <ChevronDown size={20} className={`mt-1 shrink-0 transition ${openFaqIndexes.includes(index) ? "rotate-180 text-primary" : "text-muted-foreground"}`} />
            </button>
            <motion.div initial={false} animate={openFaqIndexes.includes(index) ? "open" : "closed"} variants={{ open: { height: "auto", opacity: 1 }, closed: { height: 0, opacity: 0 } }} transition={{ duration: 0.22 }} className="overflow-hidden">
              <p className="px-5 pb-5 leading-7 text-muted-foreground">{item.answer}</p>
            </motion.div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SeoSection() {
  return (
    <section className="premium-shell py-12 sm:py-16" aria-labelledby="seo-info-title">
      <div className="card p-6 sm:p-10 bg-secondary/15 border border-border">
        <h2 id="seo-info-title" className="text-2xl sm:text-3xl font-black text-foreground">
          EditCol: The Ultimate Video Editor Portfolio & Job Marketplace
        </h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2 text-xs sm:text-sm leading-6 sm:leading-7 text-muted-foreground">
          <div className="space-y-4">
            <p>
              In the modern digital landscape, video has become the primary medium for storytelling, brand marketing, and community building. However, creating high-quality video content requires more than just recording raw footage; it demands professional editing and strategic post-production. This is where <strong>EditCol</strong> steps in. As <strong>The Video Editor Portfolio & Job Marketplace</strong>, EditCol serves as a specialized network connecting talented video creators, agencies, and businesses with top-tier editors. Whether you are looking to hire a professional or searching for a <strong>remote Video Editor job</strong> to showcase your skills, EditCol provides a streamlined, secure environment to collaborate and achieve excellent visual results.
            </p>
            <p>
              For content creators, finding the right post-production partner can be the difference between a viral video and an overlooked one. If you want to <strong>Find Your Editor</strong>, EditCol offers a <strong>global pool of video editors covering every genre</strong>. Whether you need a specialist who is the <strong>bester videoeditor für youtube-videos</strong> or a master of short-form formats who acts as the <strong>bester videoeditor für social media content</strong>, our marketplace lets you browse verified profiles with active portfolios. When you hire through EditCol, you <strong>Get Video Editing services from experts</strong> who specialize in DaVinci Resolve, Premiere Pro, and After Effects. From advanced motion graphics to detailed sound engineering, creators can access <strong>Professional online video editing services and post production</strong> that align perfectly with their specific goals and formatting needs.
            </p>
          </div>
          <div className="space-y-4">
            <p>
              If you are a professional <strong>videoeditor</strong>, finding consistent, high-paying work is often a major challenge. EditCol solves this by aggregating the <strong>best freelance Video Editor jobs and get more clients</strong> under a single platform. We help you build a professional portfolio that details your starting prices, software competencies, reviews, and client trust scores. By organizing your work under verified search tags—and participating in the global creator community with hashtags like <strong>#videoeditor</strong>—you gain direct exposure to brand managers and producers actively looking to hire. If you are looking to secure a stable <strong>remote Video Editor job</strong> or expand your freelance client list, EditCol gives you the visibility and tools to run a successful creative business.
            </p>
            <p>
              What makes EditCol stand out from generic freelance platforms is our dedicated post-production workflow design. We understand that editing is a collaborative process that relies on file sizes, timeline check-ins, and specific pacing guidelines. Our platform features an AI-assisted matchmaking system where creators can input their budget, deadline (ranging from 24 hours to custom dates), and footage requirements to find the ideal match. With absolute visibility built into our trust score system—which tracks completion rates, response rates, and on-time delivery—both creators and editors can collaborate with confidence. Sourcing a skilled <strong>videoeditor</strong> or securing <strong>Professional online video editing services and post production</strong> is now secure, transparent, and built for speed.
            </p>
            <p>
              As visual content continues to dominate platforms like YouTube, Instagram, TikTok, and LinkedIn, the demand for sophisticated video editing will only increase. EditCol is committed to empowering this creative economy by providing a marketplace that values craft, proof of outcomes, and transparent communication. Furthermore, because EditCol supports a diverse set of languages and locations, you can find localized talent who understand regional trends and platform algorithms perfectly. Whether you require video editing services in English, German, Spanish, or other languages, our search filter assists you in locating the perfect match. Post your project, find the <strong>bester videoeditor für youtube-videos</strong>, and transform your raw footage into polished, high-engagement videos with the help of industry experts today.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
