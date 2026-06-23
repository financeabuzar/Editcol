import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, useTransform } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck, MessageSquare, Star, Zap, CheckCircle2, Crown, Award, Wand2 } from "lucide-react";
import api from "@/lib/api";
import TrustBadges from "@/components/TrustBadges";
import TiltCard from "@/components/TiltCard";
import AiOrb from "@/components/AiOrb";
import { useAuth } from "@/context/AuthContext";
import { useMousePosition, useTranslate } from "@/lib/useMousePosition";

export default function Home() {
  const [editors, setEditors] = useState([]);
  const { user } = useAuth();
  const nav = useNavigate();
  const { mx, my } = useMousePosition();
  const heroTx = useTranslate(mx, 14);
  const heroTy = useTranslate(my, 10);

  useEffect(() => {
    api.get("/editors").then(r => setEditors(r.data.slice(0, 6))).catch(() => {});
  }, []);

  // Fix: if logged in, "Become an editor" leads to the right place
  const becomeEditorTarget = () => {
    if (!user || user === false) return nav("/register?role=editor");
    if (user.role === "editor") return nav("/editor/onboarding");
    if (user.role === "admin") return nav("/admin");
    return nav("/become-editor"); // upgrade flow for existing clients
  };

  return (
    <div className="fade-in">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50" />
        {/* Orb */}
        <div className="absolute right-[-120px] top-[-80px] hidden md:block">
          <AiOrb size={460} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-3xl"
            style={{ x: heroTx, y: heroTy }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-700 shadow-sm">
              <Sparkles size={14} className="text-[#39FF14]" />
              Trust-first editor marketplace · V3
            </span>
            <h1 className="font-heading text-5xl sm:text-7xl font-bold mt-6 text-gray-900 leading-[1.05]">
              Hire video editors<br />
              you can actually <span className="text-neon-grad">trust</span>.
            </h1>
            <p className="mt-6 text-lg text-gray-600 max-w-2xl leading-relaxed">
              Verified profiles. Real reviews. Transparent trust scores. And an AI matchmaker that pairs you with the right editor in seconds.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/ai-match" data-testid="hero-aimatch-btn" className="btn-primary inline-flex items-center gap-2">
                <Wand2 size={16}/> Find my editor <ArrowRight size={16} />
              </Link>
              <Link to="/browse" data-testid="hero-browse-btn" className="btn-dark">Browse editors</Link>
              <button onClick={becomeEditorTarget} data-testid="hero-join-btn" className="btn-outline">Become an editor</button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#39FF14]"/> Identity-verified editors</div>
              <div className="flex items-center gap-2"><Star size={16} className="text-amber-500"/> Verified reviews only</div>
              <div className="flex items-center gap-2"><Zap size={16} className="text-[#39FF14]"/> Real-time messaging</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TRUST BADGES STRIP */}
      <section className="border-y border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { Icon: CheckCircle2, title: "Verified Editor", sub: "Email + Phone verified" },
            { Icon: Award,        title: "Pro Editor",      sub: "5+ completed projects" },
            { Icon: Star,         title: "Top Rated",       sub: "4.7★ across 5+ reviews" },
            { Icon: Crown,        title: "Elite Editor",    sub: "20+ projects · 4.8★+" },
          ].map(({Icon, title, sub}, i) => (
            <motion.div key={title}
              initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              className="flex items-start gap-3">
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

      {/* FEATURED EDITORS */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-bold tracking-wider uppercase text-gray-500">Featured editors</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold mt-2 text-gray-900">Browse trusted talent</h2>
          </div>
          <Link to="/browse" className="text-sm font-semibold text-gray-900 inline-flex items-center gap-1 hover:gap-2 transition-all">
            See all <ArrowRight size={16} />
          </Link>
        </div>

        {editors.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="font-heading text-2xl text-gray-900">No editors live yet</p>
            <p className="mt-2 text-gray-500">EditCol launched with an empty database — real editors join organically.</p>
            <button onClick={becomeEditorTarget} data-testid="empty-state-join" className="btn-primary inline-block mt-6">Be the first editor</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {editors.map(e => <EditorMiniCard key={e.id} editor={e} />)}
          </div>
        )}
      </section>

      {/* HOW IT WORKS PREVIEW */}
      <section className="bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
          <p className="text-xs font-bold tracking-wider uppercase text-gray-500">How it works</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold mt-2 text-gray-900">From brief to delivery in 8 steps</h2>
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {[
              { n: "01", t: "Post your project", d: "Tell us your content type, style, budget, and deadline." },
              { n: "02", t: "AI matches editors", d: "Our matcher ranks verified editors by skills, badges, and fit." },
              { n: "03", t: "Chat & deliver",    d: "Private workspace opens automatically when you accept an application." },
            ].map((s, i) => (
              <motion.div key={s.n}
                initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}>
                <TiltCard className="card p-6 h-full">
                  <p className="text-neon-grad font-bold font-mono">{s.n}</p>
                  <p className="mt-2 font-semibold text-lg text-gray-900">{s.t}</p>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">{s.d}</p>
                </TiltCard>
              </motion.div>
            ))}
          </div>
          <div className="mt-8">
            <Link to="/how-it-works" className="text-sm font-semibold text-gray-900 inline-flex items-center gap-1 hover:gap-2 transition-all">
              See full workflow <ArrowRight size={14}/>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <TiltCard maxTilt={4} className="rounded-3xl bg-ink text-white p-10 md:p-16 relative overflow-hidden">
          <motion.div className="absolute -right-20 -top-20 w-72 h-72 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(57,255,20,0.35), transparent 70%)" }}
            animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 6, repeat: Infinity }} />
          <p className="text-xs font-bold tracking-wider uppercase text-[#DFFF00]">Built for serious creators</p>
          <h3 className="font-heading text-3xl sm:text-5xl font-semibold mt-3 max-w-2xl leading-tight">
            Start your next project with a verified editor today.
          </h3>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/ai-match" className="btn-primary">Find my editor</Link>
            <button onClick={becomeEditorTarget} className="btn-outline" style={{ background: "transparent", color: "white", borderColor: "rgba(255,255,255,0.2)" }}>Become an editor</button>
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
            <img src={editor.avatar} alt={editor.name} className="w-full h-full object-cover" onError={(e)=>{e.currentTarget.style.display="none"}} />
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
            <p className="text-sm font-mono text-gray-900">${editor.starting_price ?? "—"}</p>
          </div>
          <div className="mt-3"><TrustBadges badges={editor.badges} /></div>
        </div>
      </TiltCard>
    </Link>
  );
}
