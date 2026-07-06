import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import TrustBadges from "@/components/TrustBadges";
import { Briefcase, MessageSquare, Award, AlertTriangle, ArrowRight, Calendar, DollarSign, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [editor, setEditor] = useState(null);

  useEffect(() => {
    api.get("/projects").then(r => setProjects(r.data)).catch(() => {});
    if (user?.role === "editor") api.get("/editors/me/profile").then(r => setEditor(r.data)).catch(() => {});
  }, [user]);

  if (!user) return null;

  const isEditor = user.role === "editor";

  return (
    <div className="fade-in">
      <section className="border-b border-white/[0.08] bg-[#050505] py-10 sm:py-14 cinema-noise">
        <div className="premium-shell">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Command center</p>
              <h1 className="mt-3 text-5xl font-black leading-[0.95] text-white sm:text-7xl">Welcome back, {user.name}</h1>
              <p className="section-copy mt-4 max-w-2xl">{isEditor ? "Track revenue, project health, and marketplace readiness." : "Manage briefs, messages, timelines, invoices, and active edits."}</p>
            </div>
            <span className="badge badge-pro w-fit">{user.role.toUpperCase()}</span>
          </div>
        </div>
      </section>

      <div className="premium-shell py-8 sm:py-12">
        {(!user.email_verified || !user.phone_verified) && (
          <div className="card mb-6 flex flex-col gap-3 border-amber-300/25 bg-amber-300/8 p-4 sm:flex-row sm:items-center">
            <AlertTriangle size={18} className="text-amber-300"/>
            <div className="flex-1 text-sm text-amber-100">
              Verify your {!user.email_verified && "email"}{!user.email_verified && !user.phone_verified && " and "}{!user.phone_verified && "phone"} to unlock all features.
            </div>
            <Link to="/verify" className="text-sm font-bold text-amber-100 hover:text-white">Verify now <ArrowRight size={13} className="inline" /></Link>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard Icon={Briefcase} label="Projects" value={projects.length} />
          <StatCard Icon={MessageSquare} label="Active conversations" value="Live" link={{ to: "/messages", l: "Open" }} />
          <StatCard Icon={isEditor ? DollarSign : Calendar} label={isEditor ? "Revenue pulse" : "Next milestone"} value={isEditor ? "$0" : "Draft"} />
          <StatCard Icon={Award} label="Account status" value={user.status === "active" ? "Active" : user.status} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <main className="space-y-8">
            {isEditor && editor && (
              <section className="card p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <p className="eyebrow">Editor profile</p>
                    <h2 className="mt-2 text-3xl font-black text-white">{editor.is_public ? "Live on the marketplace" : "Profile needs polish"}</h2>
                    <p className="mt-2 text-sm leading-6 text-[#a0a0a0]">{editor.is_public ? "Your portfolio is discoverable by clients." : "Complete the essentials to make the profile feel bookable."}</p>
                  </div>
                  <Link to="/editor/onboarding" className="btn-outline sm:w-auto">Edit profile</Link>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <Checklist label="Email verified" done={user.email_verified}/>
                  <Checklist label="Phone verified" done={user.phone_verified}/>
                  <Checklist label="Profile photo" done={!!editor.avatar}/>
                  <Checklist label="Bio" done={!!editor.bio}/>
                  <Checklist label="Skills" done={(editor.skills||[]).length>0}/>
                  <Checklist label="Portfolio" done={(editor.portfolio||[]).length>0}/>
                </div>
                <div className="mt-5"><TrustBadges badges={editor.badges}/></div>
              </section>
            )}

            <section>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="eyebrow">Timeline</p>
                  <h2 className="mt-2 text-3xl font-black text-white">Recent projects</h2>
                </div>
                {user.role === "client" && <Link to="/browse" className="btn-primary hidden sm:inline-flex">Find editor</Link>}
              </div>
              {projects.length === 0 ? (
                <div className="card p-10 text-center">
                  <p className="text-2xl font-black text-white">No projects yet.</p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#a0a0a0]">Start with a strong brief and compare editors by proof, price, and availability.</p>
                  {user.role === "client" && <Link to="/browse" className="btn-primary mt-5">Find an editor</Link>}
                </div>
              ) : (
                <div className="card overflow-hidden divide-y divide-white/[0.08]">
                  {projects.map(p => (
                    <div key={p.id} className="grid gap-3 p-5 transition hover:bg-white/[0.035] sm:grid-cols-[1fr_auto] sm:items-center">
                      <div className="min-w-0">
                        <p className="font-bold text-white">{p.title}</p>
                        <p className="mt-1 text-xs text-[#a0a0a0]">{p.content_type} · ${p.budget} · Deadline {p.deadline}</p>
                      </div>
                      <span className={`badge ${p.status === "completed" ? "badge-pro" : "badge-verified"}`}>{p.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </main>

          <aside className="space-y-5 lg:sticky lg:top-24 self-start">
            <div className="card p-5">
              <p className="eyebrow">Performance</p>
              <div className="mt-5 space-y-4">
                <Metric label="Brief quality" value="82%" />
                <Metric label={isEditor ? "Response velocity" : "Editor fit"} value="91%" />
                <Metric label="Delivery confidence" value="76%" />
              </div>
            </div>
            <div className="card p-5">
              <p className="flex items-center gap-2 text-sm font-bold text-white"><TrendingUp size={16} className="text-[#43d9ff]" /> Weekly pulse</p>
              <div className="mt-5 flex h-28 items-end gap-2">
                {[38, 54, 42, 76, 61, 88, 70].map((h, i) => <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-[#7c5cff] to-[#43d9ff]" style={{ height: `${h}%` }} />)}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function StatCard({ Icon, label, value, link }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <Icon size={18} className="text-[#43d9ff]"/>
        {link && <Link to={link.to} className="text-xs font-bold text-[#a0a0a0] transition hover:text-white">{link.l}</Link>}
      </div>
      <p className="mt-5 text-4xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs text-[#a0a0a0]">{label}</p>
    </div>
  );
}

function Checklist({ label, done }) {
  return (
    <div className={`flex items-center gap-2 rounded-[8px] border p-3 text-xs ${done ? "border-[#43d9ff]/25 bg-[#43d9ff]/8 text-white" : "border-white/[0.08] text-[#777]"}`}>
      <span className={`grid h-4 w-4 place-items-center rounded-full border ${done ? "border-[#43d9ff] bg-[#43d9ff]" : "border-white/20"}`}>
        {done && <span className="text-[10px] font-black text-black">✓</span>}
      </span>
      {label}
    </div>
  );
}

function Metric({ label, value }) {
  const number = Number(String(value).replace("%", "")) || 0;
  return (
    <div>
      <div className="flex justify-between text-xs"><span className="text-[#a0a0a0]">{label}</span><span className="font-bold text-white">{value}</span></div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full rounded-full bg-neon-grad" style={{ width: `${number}%` }} /></div>
    </div>
  );
}
