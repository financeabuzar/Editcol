import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck, Star, Zap, CheckCircle2, Crown, Award, Wand2, ChevronDown } from "lucide-react";
import api from "@/lib/api";
import TrustBadges from "@/components/TrustBadges";
import TiltCard from "@/components/TiltCard";
import AiOrb from "@/components/AiOrb";
import { useAuth } from "@/context/AuthContext";
import { useMousePosition, useTranslate } from "@/lib/useMousePosition";
import { FAQ_ITEMS, faqJsonLd, jsonLdGraph, SEO_DESCRIPTION, SEO_TITLE } from "@/seo/schema";

export default function Home() {
  const [editors, setEditors] = useState([]);
  const { user } = useAuth();
  const nav = useNavigate();
  const { mx, my } = useMousePosition();
  const heroTx = useTranslate(mx, 14);
  const heroTy = useTranslate(my, 10);
  const [openFaqIndexes, setOpenFaqIndexes] = useState([0]);

  useEffect(() => {
    api.get("/editors").then(r => setEditors(r.data.slice(0, 6))).catch(() => {});
  }, []);

  useEffect(() => {
    document.title = SEO_TITLE;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", SEO_DESCRIPTION);
  }, []);

  const becomeEditorTarget = () => {
    if (!user || user === false) return nav("/register?role=editor");
    if (user.role === "editor") return nav("/editor/onboarding");
    if (user.role === "admin") return nav("/admin");
    return nav("/become-editor");
  };

  const toggleFaq = (index) => {
    setOpenFaqIndexes((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index]
    );
  };

  return (
    <div className="fade-in">
      <script type="application/ld+json">{JSON.stringify(jsonLdGraph)}</script>
      <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>

      <section className="relative overflow-hidden" aria-labelledby="home-hero-title">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute right-[-120px] top-[-80px] hidden md:block">
          <AiOrb size={460} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-14 sm:pt-20 pb-16 sm:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-3xl"
            style={{ x: heroTx, y: heroTy }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-700 shadow-sm">
              <Sparkles size={14} className="text-[#39FF14]" />
              Trust-first video editing marketplace
            </span>
            <h1 id="home-hero-title" className="font-heading text-4xl sm:text-6xl lg:text-7xl font-bold mt-6 text-gray-900 leading-[1.05] break-words">
              Hire a video editor freelancer<br />
              you can actually <span className="text-neon-grad">trust</span>.
            </h1>
            <p className="mt-5 sm:mt-6 text-base sm:text-lg text-gray-600 max-w-2xl leading-relaxed">
              Verified profiles, real reviews, transparent trust scores, and an AI matchmaker for YouTube, Reels, TikTok, podcasts, ads, and brand videos.
            </p>
            <div className="mt-8 sm:mt-9 flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <Link to="/ai-match" data-testid="hero-aimatch-btn" className="btn-primary inline-flex items-center justify-center gap-2">
                <Wand2 size={16} /> Find my editor <ArrowRight size={16} />
              </Link>
              <Link to="/browse" data-testid="hero-browse-btn" className="btn-dark text-center">Browse editors</Link>
              <button onClick={becomeEditorTarget} data-testid="hero-join-btn" className="btn-outline">Become an editor</button>
            </div>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#39FF14]" /> Identity-verified editors</div>
              <div className="flex items-center gap-2"><Star size={16} className="text-amber-500" /> Verified reviews only</div>
              <div className="flex items-center gap-2"><Zap size={16} className="text-[#39FF14]" /> Real-time messaging</div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-gray-200 bg-white" aria-label="Editor trust badges">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 sm:gap-6">
          {[
            { Icon: CheckCircle2, title: "Verified Editor", sub: "Email + phone verified" },
            { Icon: Award, title: "Pro Editor", sub: "5+ completed projects" },
            { Icon: Star, title: "Top Rated", sub: "4.7 stars across 5+ reviews" },
            { Icon: Crown, title: "Elite Editor", sub: "20+ projects and 4.8+ stars" },
          ].map(({ Icon, title, sub }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              className="flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-ink text-white flex items-center justify-center">
                <Icon size={18} className="text-[#39FF14]" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{title}</p>
                <p className="text-xs text-gray-500">{sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 border-b border-gray-200" aria-labelledby="marketplace-overview-title">
        <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-20">
          <p className="text-xs font-bold tracking-wider uppercase text-gray-500">Video editing services</p>
          <h2 id="marketplace-overview-title" className="font-heading text-3xl sm:text-4xl font-semibold mt-2 text-gray-900">
            Find the right freelance video editor for every channel
          </h2>
          <div className="mt-8 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 text-gray-600 leading-relaxed">
            <div className="space-y-5">
              <p>
                EditCol is a video editing marketplace built for clients who need professional quality without a slow hiring process. Instead of searching scattered portfolios, you can find a video editor, compare real work, review ratings, and contact a remote video editor from one focused platform. Whether you need a Video Editor Freelancer for a launch campaign, a social media video editor for weekly clips, or a video editing expert for a polished brand story, EditCol helps you shortlist talent with confidence.
              </p>
              <p>
                Businesses, agencies, ecommerce brands, startup founders, and course creators use EditCol to hire video editor talent for marketing videos, product demos, testimonials, paid ads, training content, and brand videos. A professional video editor can improve pacing, story structure, sound, motion graphics, captions, color grading, and thumbnail creation so the final asset feels sharp, clear, and ready to publish. Affordable pricing and remote collaboration make it easier to scale content editing services without building an internal post-production team.
              </p>
              <p>
                Creators also get a faster path to consistent output. A YouTube video editor or editor for YouTube can shape long-form episodes, intros, B-roll, retention edits, thumbnails, and upload-ready cuts. YouTube Shorts creators can hire youtube editor support for high-volume shorts, hooks, subtitles, and trend-aware pacing. Instagram creators can find an instagram reel editor, editor for Instagram, editor for reels, or reel video editor who understands vertical framing, music timing, captions, and mobile-first storytelling.
              </p>
            </div>
            <div className="space-y-5">
              <p>
                TikTok creators, podcast creators, and content teams can hire reel editor talent for short-form video editing, repurposed clips, audiograms, podcast editing, and social cutdowns. The platform supports both long-form editing and fast short-form workflows, so clients can match each brief to the right freelance video editor instead of forcing every project through one style.
              </p>
              <p>
                Every editor profile is designed to make hiring practical: portfolio samples, badges, ratings, bios, specialties, and starting prices give clients useful signals before the first message. Secure communication keeps project details organized, while transparent profiles help clients compare the best freelance video editor for their channel, budget, and timeline.
              </p>
              <p>
                Freelancers join EditCol to build a credible video editor portfolio, earn ratings, and get discovered by clients searching for video editor jobs and video editing services. If you are a motion graphics editor, podcast video editor, short form video editor, business video editor, or video editing freelancer, EditCol gives your work a dedicated place to be found by brands, creators, and agencies ready to hire.
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-20" aria-labelledby="featured-editors-title">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <p className="text-xs font-bold tracking-wider uppercase text-gray-500">Featured editors</p>
            <h2 id="featured-editors-title" className="font-heading text-3xl sm:text-4xl font-semibold mt-2 text-gray-900">Browse trusted talent</h2>
          </div>
          <Link to="/browse" className="text-sm font-semibold text-gray-900 inline-flex items-center gap-1 hover:gap-2 transition-all">
            See all <ArrowRight size={16} />
          </Link>
        </div>

        {editors.length === 0 ? (
          <div className="card p-6 sm:p-12 text-center">
            <p className="font-heading text-2xl text-gray-900">No editors live yet</p>
            <p className="mt-2 text-gray-500">EditCol launched with an empty database, and real editors join organically.</p>
            <button onClick={becomeEditorTarget} data-testid="empty-state-join" className="btn-primary inline-block mt-6">Be the first editor</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {editors.map(e => <EditorMiniCard key={e.id} editor={e} />)}
          </div>
        )}
      </section>

      <section className="bg-white border-y border-gray-200" aria-labelledby="workflow-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-20">
          <p className="text-xs font-bold tracking-wider uppercase text-gray-500">How it works</p>
          <h2 id="workflow-title" className="font-heading text-3xl sm:text-4xl font-semibold mt-2 text-gray-900">From brief to delivery in 8 steps</h2>
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {[
              { n: "01", t: "Post your project", d: "Tell us your content type, style, budget, and deadline." },
              { n: "02", t: "AI matches editors", d: "Our matcher ranks verified editors by skills, badges, and fit." },
              { n: "03", t: "Chat & deliver", d: "Private workspace opens automatically when you accept an application." },
            ].map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <TiltCard className="card p-6 h-full">
                  <p className="text-neon-grad font-bold font-mono">{s.n}</p>
                  <h3 className="mt-2 font-semibold text-lg text-gray-900">{s.t}</h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">{s.d}</p>
                </TiltCard>
              </motion.div>
            ))}
          </div>
          <div className="mt-8">
            <Link to="/how-it-works" className="text-sm font-semibold text-gray-900 inline-flex items-center gap-1 hover:gap-2 transition-all">
              See full workflow <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-20" aria-labelledby="faq-title">
        <p className="text-xs font-bold tracking-wider uppercase text-gray-500">FAQ</p>
        <h2 id="faq-title" className="font-heading text-3xl sm:text-4xl font-semibold mt-2 text-gray-900">
          Hiring a video editor on EditCol
        </h2>
        <div className="mt-10 max-w-4xl space-y-3">
          {FAQ_ITEMS.map((item, index) => (
            <article key={item.question} className="card overflow-hidden">
              <h3 className="font-heading text-lg font-semibold text-gray-900">
                <button
                  type="button"
                  id={`faq-button-${index}`}
                  aria-expanded={openFaqIndexes.includes(index)}
                  aria-controls={`faq-panel-${index}`}
                  className="w-full flex items-start justify-between gap-4 p-4 sm:p-6 text-left hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14] focus-visible:ring-offset-2"
                  onClick={() => toggleFaq(index)}
                >
                  <span className="min-w-0 pr-2">{item.question}</span>
                  <ChevronDown
                    size={20}
                    aria-hidden="true"
                    className={`mt-0.5 shrink-0 text-gray-400 transition-transform duration-200 ${
                      openFaqIndexes.includes(index) ? "rotate-180 text-gray-900" : ""
                    }`}
                  />
                </button>
              </h3>
              <motion.div
                id={`faq-panel-${index}`}
                role="region"
                aria-labelledby={`faq-button-${index}`}
                initial={false}
                animate={openFaqIndexes.includes(index) ? "open" : "closed"}
                variants={{
                  open: { height: "auto", opacity: 1 },
                  closed: { height: 0, opacity: 0 },
                }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="px-4 sm:px-6 pb-5 sm:pb-6">
                  <p className="text-sm text-gray-600 leading-relaxed">{item.answer}</p>
                </div>
              </motion.div>
            </article>
          ))}
        </div>
        <nav aria-label="FAQ related links" className="mt-10 flex flex-wrap gap-3 text-sm">
          {[
            { to: "/", label: "Home" },
            { to: "/browse", label: "Find Video Editors" },
            { to: "/browse", label: "Browse Editors" },
            { to: "/register", label: "Become an Editor" },
            { to: "/how-it-works", label: "Help Center" },
            { to: "/trust", label: "Contact" },
          ].map((link) => (
            <Link key={`${link.to}-${link.label}`} to={link.to} className="btn-outline py-2 px-4">
              {link.label}
            </Link>
          ))}
        </nav>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-20" aria-labelledby="home-cta-title">
        <TiltCard maxTilt={4} className="rounded-2xl sm:rounded-3xl bg-ink text-white p-6 sm:p-10 md:p-16 relative overflow-hidden">
          <motion.div
            className="absolute -right-20 -top-20 w-72 h-72 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(57,255,20,0.35), transparent 70%)" }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          <p className="text-xs font-bold tracking-wider uppercase text-[#DFFF00]">Built for serious creators</p>
          <h2 id="home-cta-title" className="font-heading text-3xl sm:text-5xl font-semibold mt-3 max-w-2xl leading-tight">
            Start your next project with a verified editor today.
          </h2>
          <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">
            <Link to="/ai-match" className="btn-primary text-center">Find my editor</Link>
            <button
              onClick={becomeEditorTarget}
              className="btn-outline"
              style={{ background: "transparent", color: "white", borderColor: "rgba(255,255,255,0.2)" }}
            >
              Become an editor
            </button>
          </div>
        </TiltCard>
      </section>
    </div>
  );
}

export function EditorMiniCard({ editor }) {
  return (
    <Link to={`/editor/${editor.id}`} data-testid={`editor-card-${editor.id}`} className="block">
      <TiltCard className="card card-hover overflow-hidden h-full">
        <div className="h-44 bg-gray-100 overflow-hidden">
          {editor.avatar ? (
            <img
              src={editor.avatar}
              alt={`${editor.name} video editor portfolio profile`}
              width="480"
              height="320"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-heading text-3xl text-gray-300">{editor.name?.[0]?.toUpperCase()}</div>
          )}
        </div>
        <div className="p-5">
          <div className="flex justify-between items-start gap-3">
            <div>
              <p className="font-semibold text-gray-900">{editor.name}</p>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{editor.bio || "Video editor"}</p>
            </div>
            <p className="text-sm font-mono text-gray-900">${editor.starting_price ?? "-"}</p>
          </div>
          <div className="mt-3"><TrustBadges badges={editor.badges} /></div>
        </div>
      </TiltCard>
    </Link>
  );
}
