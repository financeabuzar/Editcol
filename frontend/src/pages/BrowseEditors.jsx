import { useEffect, useState } from "react";
import api from "@/lib/api";
import { EditorMiniCard } from "@/pages/Home";
import { Search, Filter } from "lucide-react";

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
    <div className="fade-in max-w-7xl mx-auto px-6 lg:px-10 py-12">
      <h1 className="font-heading text-4xl font-bold text-gray-900">Browse editors</h1>
      <p className="mt-2 text-gray-500">All editors are identity-verified. Filter by skill, badge, or price.</p>

      <div className="mt-8 grid lg:grid-cols-[280px,1fr] gap-8">
        <aside className="space-y-6 lg:sticky lg:top-24 self-start">
          <div className="card p-5">
            <label className="input-label">Search</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input data-testid="filter-search" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&fetchEditors()} placeholder="Search by name…" className="input pl-9" />
            </div>
          </div>
          <div className="card p-5">
            <p className="input-label">Badge</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={()=>setBadge("")} className={`text-xs px-3 py-1.5 rounded-full border ${!badge?"bg-ink text-white border-ink":"border-gray-200"}`}>All</button>
              {BADGE_FILTERS.map(b => (
                <button key={b.v} data-testid={`filter-badge-${b.v}`} onClick={()=>setBadge(b.v)} className={`text-xs px-3 py-1.5 rounded-full border ${badge===b.v?"bg-ink text-white border-ink":"border-gray-200"}`}>{b.l}</button>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <p className="input-label">Skill</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={()=>setSkill("")} className={`text-xs px-3 py-1.5 rounded-full border ${!skill?"bg-ink text-white border-ink":"border-gray-200"}`}>Any</button>
              {SKILLS.map(s => (
                <button key={s} onClick={()=>setSkill(s)} className={`text-xs px-3 py-1.5 rounded-full border ${skill===s?"bg-ink text-white border-ink":"border-gray-200"}`}>{s}</button>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <label className="input-label">Max price ($)</label>
            <input data-testid="filter-max-price" type="number" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} className="input" placeholder="e.g. 500" />
          </div>
        </aside>

        <main>
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => <div key={i} className="card overflow-hidden"><div className="skeleton h-44"/><div className="p-5 space-y-2"><div className="skeleton h-4 w-2/3"/><div className="skeleton h-3 w-full"/></div></div>)}
            </div>
          ) : editors.length === 0 ? (
            <div className="card p-12 text-center">
              <Filter size={28} className="mx-auto text-gray-300" />
              <p className="font-heading text-2xl mt-4 text-gray-900">No editors match your filters</p>
              <p className="mt-2 text-gray-500 text-sm">Try removing filters — or be the first editor to join.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {editors.map(e => <EditorMiniCard key={e.id} editor={e} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
