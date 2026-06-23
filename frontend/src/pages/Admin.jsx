import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Users, ShieldAlert, MessageSquare, Briefcase, Star, Award, UserX, CheckCircle2, Search } from "lucide-react";
import TrustBadges from "@/components/TrustBadges";

const TABS = [
  { id: "overview", label: "Overview", Icon: ShieldAlert },
  { id: "users", label: "Users", Icon: Users },
  { id: "editors", label: "Editor Verification", Icon: Award },
  { id: "reports", label: "Reports", Icon: ShieldAlert },
  { id: "projects", label: "Projects", Icon: Briefcase },
  { id: "reviews", label: "Reviews", Icon: Star },
];

export default function Admin() {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/admin/stats").then(r => setStats(r.data)).catch(() => {});
  }, [tab]);

  return (
    <div className="fade-in max-w-7xl mx-auto px-6 lg:px-10 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-bold tracking-wider uppercase text-gray-500">Trust & Safety</p>
          <h1 className="font-heading text-4xl font-bold text-gray-900">Admin Console</h1>
        </div>
        <span className="badge badge-elite">ADMIN</span>
      </div>

      <div className="grid lg:grid-cols-[220px,1fr] gap-8">
        <aside className="space-y-1">
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} data-testid={`admin-tab-${t.id}`}
              className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                ${tab===t.id ? "bg-ink text-white" : "text-gray-600 hover:bg-gray-100"}`}>
              <t.Icon size={14}/> {t.label}
            </button>
          ))}
        </aside>
        <main>
          {tab === "overview" && <Overview stats={stats}/>}
          {tab === "users" && <UsersTab/>}
          {tab === "editors" && <EditorsTab/>}
          {tab === "reports" && <ReportsTab/>}
          {tab === "projects" && <ProjectsTab/>}
          {tab === "reviews" && <ReviewsTab/>}
        </main>
      </div>
    </div>
  );
}

function Overview({ stats }) {
  if (!stats) return <div className="card p-8 text-gray-500">Loading stats…</div>;
  const cards = [
    { l: "Total users", v: stats.users },
    { l: "Editors", v: stats.editors },
    { l: "Public editors", v: stats.public_editors },
    { l: "Open reports", v: stats.open_reports, danger: stats.open_reports > 0 },
    { l: "Projects", v: stats.projects },
    { l: "Pending projects", v: stats.pending_projects },
  ];
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map(c => (
        <div key={c.l} className={`card p-5 ${c.danger ? "border-red-200 bg-red-50" : ""}`}>
          <p className="text-xs font-bold tracking-wider uppercase text-gray-500">{c.l}</p>
          <p className="font-heading text-4xl font-bold mt-2 text-gray-900">{c.v}</p>
        </div>
      ))}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]); const [q, setQ] = useState("");
  const load = () => api.get("/admin/users").then(r=>setUsers(r.data));
  useEffect(() => { load(); }, []);
  const action = async (id, action) => {
    if (!confirm(`${action} this user?`)) return;
    await api.post(`/admin/users/${id}/action`, { action }); load();
  };
  const filtered = users.filter(u => !q || u.name?.toLowerCase().includes(q.toLowerCase()) || u.email?.includes(q.toLowerCase()));
  return (
    <div>
      <div className="mb-4 relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input data-testid="admin-users-search" placeholder="Search users…" value={q} onChange={e=>setQ(e.target.value)} className="input pl-9"/>
      </div>
      <div className="card overflow-hidden divide-y divide-gray-100">
        {filtered.map(u => (
          <div key={u.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
            <div>
              <p className="font-semibold text-gray-900">{u.name} <span className="text-xs text-gray-500 font-mono ml-2">{u.email}</span></p>
              <p className="text-xs text-gray-500 mt-0.5">
                {u.role} · {u.status}
                {u.email_verified && " · email ✓"}
                {u.phone_verified && " · phone ✓"}
              </p>
            </div>
            <div className="flex gap-2">
              {u.status === "active"
                ? <>
                    <button onClick={()=>action(u.id,"suspend")} data-testid={`suspend-${u.id}`} className="btn-outline text-xs">Suspend</button>
                    <button onClick={()=>action(u.id,"ban")} data-testid={`ban-${u.id}`} className="text-xs px-3 py-2 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700">Ban</button>
                  </>
                : <button onClick={()=>action(u.id,"unban")} className="btn-primary text-xs">Reactivate</button>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="p-6 text-center text-gray-500">No users.</p>}
      </div>
    </div>
  );
}

function EditorsTab() {
  const [editors, setEditors] = useState([]);
  const load = () => api.get("/admin/editors-pending").then(r=>setEditors(r.data));
  useEffect(() => { load(); }, []);
  const action = async (id, action) => { await api.post(`/admin/users/${id}/action`, { action }); load(); };
  return (
    <div className="card overflow-hidden divide-y divide-gray-100">
      {editors.length === 0 ? <p className="p-6 text-center text-gray-500">No editors yet.</p> : editors.map(e => (
        <div key={e.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
          <div>
            <p className="font-semibold text-gray-900">{e.name} <span className="text-xs font-mono text-gray-500 ml-2">{e.email}</span></p>
            <p className="text-xs text-gray-500 mt-0.5">
              {e.is_public ? "Public" : "Private"} · {e.email_verified?"email ✓":"email ✗"} · {e.phone_verified?"phone ✓":"phone ✗"}
            </p>
            <div className="mt-2"><TrustBadges badges={e.badges}/></div>
          </div>
          <button onClick={()=>action(e.user_id, "approve")} className="btn-primary text-xs">Approve verification</button>
        </div>
      ))}
    </div>
  );
}

function ReportsTab() {
  const [reports, setReports] = useState([]);
  const load = () => api.get("/admin/reports").then(r=>setReports(r.data));
  useEffect(()=>{ load(); }, []);
  const act = async (id, action) => { await api.post(`/admin/reports/${id}/action`, { action }); load(); };
  return (
    <div className="space-y-3">
      {reports.length === 0 ? <p className="card p-6 text-center text-gray-500">No reports.</p> : reports.map(r => (
        <div key={r.id} className="card p-5">
          <div className="flex justify-between items-start">
            <div>
              <span className={`badge ${r.kind==="scam"?"badge-elite":"badge-verified"}`}>{r.kind.toUpperCase()}</span>
              <p className="mt-2 font-semibold text-gray-900">Target: {r.target_name}</p>
              <p className="text-xs text-gray-500">Reporter: {r.reporter_name}</p>
              <p className="mt-2 text-sm text-gray-700">{r.reason}</p>
            </div>
            <span className={`text-xs font-bold ${r.status==="open"?"text-red-600":"text-gray-400"}`}>{r.status.toUpperCase()}</span>
          </div>
          {r.status === "open" && (
            <div className="mt-3 flex gap-2 flex-wrap">
              <button onClick={()=>act(r.id, "approve")} data-testid={`report-resolve-${r.id}`} className="btn-outline text-xs">Mark resolved</button>
              <button onClick={()=>act(r.id, "reject")} className="btn-outline text-xs">Dismiss</button>
              <button onClick={()=>act(r.id, "suspend")} className="text-xs px-3 py-2 rounded-full bg-amber-500 text-white font-semibold">Suspend user</button>
              <button onClick={()=>act(r.id, "ban")} className="text-xs px-3 py-2 rounded-full bg-red-600 text-white font-semibold">Ban user</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ProjectsTab() {
  const [projects, setProjects] = useState([]);
  useEffect(() => { api.get("/admin/projects").then(r=>setProjects(r.data)); }, []);
  return (
    <div className="card overflow-hidden divide-y divide-gray-100">
      {projects.length === 0 ? <p className="p-6 text-center text-gray-500">No projects yet.</p> : projects.map(p => (
        <div key={p.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
          <div>
            <p className="font-semibold text-gray-900">{p.title}</p>
            <p className="text-xs text-gray-500">{p.content_type} · ${p.budget} · deadline {p.deadline}</p>
          </div>
          <span className="badge badge-verified">{p.status}</span>
        </div>
      ))}
    </div>
  );
}

function ReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const load = () => api.get("/admin/reviews").then(r=>setReviews(r.data));
  useEffect(()=>{ load(); }, []);
  const del = async (id) => { if (!confirm("Delete this review?")) return; await api.delete(`/admin/reviews/${id}`); load(); };
  return (
    <div className="space-y-3">
      {reviews.length === 0 ? <p className="card p-6 text-center text-gray-500">No reviews.</p> : reviews.map(r => (
        <div key={r.id} className="card p-4 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900">{r.client_name}</p>
              <div className="flex">{Array.from({length:5}).map((_,i)=><Star key={i} size={12} className={i<r.rating?"text-amber-500 fill-amber-500":"text-gray-300"}/>)}</div>
            </div>
            <p className="mt-1 text-sm text-gray-700">{r.comment}</p>
          </div>
          <button onClick={()=>del(r.id)} className="text-xs px-3 py-1.5 rounded-full bg-red-600 text-white">Delete</button>
        </div>
      ))}
    </div>
  );
}
