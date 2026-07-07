import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { EditorMiniCard } from "@/pages/Home";
import { Search, Filter, SlidersHorizontal, Sparkles } from "lucide-react";

const SKILLS = ["Color Grading", "Motion Graphics", "VFX", "Sound Design", "Editing", "Animation", "Reels", "YouTube", "Wedding", "Corporate"];
const BADGE_FILTERS = [
  { v: "verified", l: "Verified" },
  { v: "pro", l: "Pro" },
  { v: "top_rated", l: "Top Rated" },
  { v: "elite", l: "Elite" },
];

export default function BrowseEditors() {
  const [editors, setEditors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [skill, setSkill] = useState("");
  const [badge, setBadge] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const fetchEditors = async () => {
    setLoading(true);
    const params = {};
    if (q) params.q = q;
    if (skill) params.skill = skill;
    if (badge) params.badge = badge;
    if (maxPrice) params.max_price = maxPrice;
    try {
      const { data } = await api.get("/editors", { params });
      setEditors(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchEditors(); /* eslint-disable-next-line */ }, [skill, badge, maxPrice]);

  return (
    <div className="fade-in">
      <section className="relative overflow-hidden border-b border-border bg-secondary/40 py-14 sm:py-20 cinema-noise">
        <div className="absolute inset-0 bg-grid" />
        <div className="premium-shell relative">
          <p className="eyebrow">Marketplace</p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_24rem] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.025em] text-foreground sm:text-7xl">
                Browse editors with proof, taste, and availability.
              </h1>
              <p className="section-copy mt-6 max-w-2xl">
                Search portfolios like Behance, book like a modern marketplace, and filter by the signals that matter before a deadline.
              </p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="text-primary" size={18} />
                <div>
                  <p className="text-sm font-bold text-foreground">Live marketplace</p>
                  <p className="text-xs text-muted-foreground">{loading ? "Scanning editors" : `${editors.length} matching editors`}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="premium-shell py-8 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[300px,1fr]">
          <aside className="space-y-4 lg:sticky lg:top-24 self-start">
            <div className="card p-5">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">Filters</p>
                <SlidersHorizontal size={16} className="text-muted-foreground" />
              </div>
              <label className="input-label">Search</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input data-testid="filter-search" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&fetchEditors()} placeholder="Editor, format, style..." className="input pl-9" />
              </div>
              <button onClick={fetchEditors} className="btn-primary mt-3 w-full">Search</button>
            </div>

            <FilterGroup title="Badge">
              <Chip active={!badge} onClick={()=>setBadge("")}>All</Chip>
              {BADGE_FILTERS.map(b => <Chip key={b.v} active={badge===b.v} onClick={()=>setBadge(b.v)} testId={`filter-badge-${b.v}`}>{b.l}</Chip>)}
            </FilterGroup>

            <FilterGroup title="Skill">
              <Chip active={!skill} onClick={()=>setSkill("")}>Any</Chip>
              {SKILLS.map(s => <Chip key={s} active={skill===s} onClick={()=>setSkill(s)}>{s}</Chip>)}
            </FilterGroup>

            <div className="card p-5">
              <label className="input-label">Max price ($)</label>
              <input data-testid="filter-max-price" type="number" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} className="input" placeholder="500" />
            </div>
          </aside>

          <main>
            {loading ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {[1,2,3,4,5,6].map(i => <div key={i} className="card overflow-hidden"><div className="skeleton h-72"/><div className="p-5 space-y-3"><div className="skeleton h-5 w-2/3"/><div className="skeleton h-3 w-full"/><div className="skeleton h-3 w-1/2"/></div></div>)}
              </div>
            ) : editors.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-10 text-center">
                <Filter size={30} className="mx-auto text-[#43d9ff]" />
                <p className="mt-4 text-3xl font-black text-white">No editors match this cut.</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#a0a0a0]">Remove a filter or search for a broader format. The best portfolios sometimes hide behind fewer constraints.</p>
              </motion.div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {editors.map((e, i) => <EditorMiniCard key={e.id} editor={e} index={i} />)}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }) {
  return (
    <div className="card p-5">
      <p className="input-label">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children, testId }) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
        active 
          ? "border-purple-500/50 bg-purple-500/10 text-foreground shadow-[0_0_15px_rgba(124,58,237,0.15)]" 
          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
