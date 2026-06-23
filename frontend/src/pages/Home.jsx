import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, ShieldCheck, MessageSquare, Star, Zap, CheckCircle2, Crown, Award } from "lucide-react";
import api from "@/lib/api";
import TrustBadges from "@/components/TrustBadges";

export default function Home() {
  const [editors, setEditors] = useState([]);
  useEffect(() => {
    api.get("/editors").then(r => setEditors(r.data.slice(0, 6))).catch(() => {});
  }, []);

  return (
    <div className="fade-in">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-700">
              <Sparkles size={14} className="text-[#39FF14]" />
              Trust-first editor marketplace · V2
            </span>
            <h1 className="font-heading text-5xl sm:text-7xl font-bold mt-6 text-gray-900 leading-[1.05]">
              Hire video editors<br />
              you can actually <span className="text-neon-grad">trust</span>.
            </h1>
            <p className="mt-6 text-lg text-gray-600 max-w-2xl leading-relaxed">
              Verified profiles. Real reviews. Transparent trust scores. EditCol pairs serious creators with elite editors — fast, safe, and on your terms.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/browse" data-testid="hero-browse-btn" className="btn-primary inline-flex items-center gap-2">
                Browse editors <ArrowRight size={18} />
              </Link>
              <Link to="/register" data-testid="hero-join-btn" className="btn-dark">
                Become an editor
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#39FF14]"/> Identity-verified editors</div>
              <div className="flex items-center gap-2"><Star size={16} className="text-amber-500"/> Verified reviews only</div>
              <div className="flex items-center gap-2"><Zap size={16} className="text-[#39FF14]"/> Real-time messaging</div>
            </div>
          </div>
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
          ].map(({Icon, title, sub}) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-ink text-white flex items-center justify-center">
                <Icon size={18} className="text-[#39FF14]" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{title}</p>
                <p className="text-xs text-gray-500">{sub}</p>
              </div>
            </div>
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
            <Link to="/register" data-testid="empty-state-join" className="btn-primary inline-block mt-6">Be the first editor</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {editors.map(e => <EditorMiniCard key={e.id} editor={e} />)}
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
          <p className="text-xs font-bold tracking-wider uppercase text-gray-500">How it works</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold mt-2 text-gray-900">A workflow built on trust</h2>
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {[
              { n: "01", t: "Browse verified editors", d: "Filter by skill, badge, and budget. Every editor passes email + phone verification before listing." },
              { n: "02", t: "Message or hire instantly", d: "Open a private chat from any profile — or send a structured project request with budget and deadline." },
              { n: "03", t: "Track delivery, leave a review", d: "Monitor progress, message in real time, and only verified clients can leave reviews." },
            ].map(s => (
              <div key={s.n} className="card p-6">
                <p className="text-neon-grad font-bold font-mono">{s.n}</p>
                <p className="mt-2 font-semibold text-lg text-gray-900">{s.t}</p>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <div className="rounded-3xl bg-ink text-white p-10 md:p-16 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(57,255,20,0.35), transparent 70%)" }} />
          <p className="text-xs font-bold tracking-wider uppercase text-[#DFFF00]">Built for serious creators</p>
          <h3 className="font-heading text-3xl sm:text-5xl font-semibold mt-3 max-w-2xl leading-tight">
            Start your next project with a verified editor today.
          </h3>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/browse" className="btn-primary">Browse editors</Link>
            <Link to="/register" className="btn-outline" style={{ background: "transparent", color: "white", borderColor: "rgba(255,255,255,0.2)" }}>Become an editor</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export function EditorMiniCard({ editor }) {
  return (
    <Link to={`/editor/${editor.id}`} data-testid={`editor-card-${editor.id}`} className="card card-hover overflow-hidden block transition-all">
      <div className="h-44 bg-gray-100 overflow-hidden">
        {editor.avatar ? (
          <img src={editor.avatar} alt={editor.name} className="w-full h-full object-cover" />
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
    </Link>
  );
}
