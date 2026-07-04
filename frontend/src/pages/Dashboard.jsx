import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import TrustBadges from "@/components/TrustBadges";
import { Briefcase, MessageSquare, Award, Mail, Phone, AlertTriangle, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [editor, setEditor] = useState(null);

  useEffect(() => {
    api.get("/projects").then(r => setProjects(r.data)).catch(() => {});
    if (user?.role === "editor") api.get("/editors/me/profile").then(r => setEditor(r.data)).catch(() => {});
  }, [user]);

  if (!user) return null;

  return (
    <div className="fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-8">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-wider uppercase text-gray-500">Welcome back</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900 break-words">{user.name}</h1>
        </div>
        <span className="badge badge-pro w-fit">{user.role.toUpperCase()}</span>
      </div>

      {/* Verification banner */}
      {(!user.email_verified || !user.phone_verified) && (
        <div className="card p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3 border-amber-200 bg-amber-50">
          <AlertTriangle size={18} className="text-amber-600"/>
          <div className="flex-1 text-sm text-amber-900">
            Verify your {!user.email_verified && "email"}{!user.email_verified && !user.phone_verified && " and "}{!user.phone_verified && "phone"} to unlock all features.
          </div>
          <Link to="/register" className="text-sm font-semibold text-amber-900 hover:underline whitespace-nowrap">Verify now →</Link>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4 mb-10">
        <StatCard Icon={Briefcase} label="Projects" value={projects.length} />
        <StatCard Icon={MessageSquare} label="Active conversations" value={"—"} link={{ to: "/messages", l: "Open messages" }} />
        <StatCard Icon={Award} label="Account status" value={user.status === "active" ? "Active" : user.status} />
      </div>

      {user.role === "editor" && editor && (
        <section className="card p-6 mb-10">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
            <div>
              <h2 className="font-heading text-xl font-semibold text-gray-900">Editor profile</h2>
              <p className="text-sm text-gray-500">{editor.is_public ? "Live on EditCol marketplace" : "Private — complete your profile to go live"}</p>
            </div>
            <Link to="/editor/onboarding" className="btn-outline text-sm text-center">Edit profile</Link>
          </div>
          <div className="grid sm:grid-cols-4 gap-3 mb-4">
            <Checklist label="Email verified" done={user.email_verified}/>
            <Checklist label="Phone verified" done={user.phone_verified}/>
            <Checklist label="Profile photo" done={!!editor.avatar}/>
            <Checklist label="Bio" done={!!editor.bio}/>
            <Checklist label="Skills" done={(editor.skills||[]).length>0}/>
            <Checklist label="Portfolio" done={(editor.portfolio||[]).length>0}/>
          </div>
          <TrustBadges badges={editor.badges}/>
        </section>
      )}

      <section>
        <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">Recent projects</h2>
        {projects.length === 0 ? (
          <div className="card p-10 text-center text-gray-500">No projects yet.
            {user.role === "client" && <Link to="/browse" className="block mt-3 btn-primary inline-block w-fit mx-auto">Find an editor</Link>}
          </div>
        ) : (
          <div className="card overflow-hidden divide-y divide-gray-200">
            {projects.map(p => (
              <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-gray-50">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{p.title}</p>
                  <p className="text-xs text-gray-500">{p.content_type} · ${p.budget} · Deadline {p.deadline}</p>
                </div>
                <span className={`badge ${p.status === "completed" ? "badge-pro" : "badge-verified"}`}>{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ Icon, label, value, link }) {
  return (
    <div className="card p-5">
      <div className="flex justify-between items-start">
        <Icon size={18} className="text-gray-400"/>
        {link && <Link to={link.to} className="text-xs font-semibold text-gray-900 inline-flex items-center gap-1 hover:gap-2 transition-all">{link.l} <ArrowRight size={12}/></Link>}
      </div>
      <p className="font-heading text-3xl font-bold mt-3">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function Checklist({ label, done }) {
  return (
    <div className={`text-xs flex items-center gap-2 p-2 rounded-lg ${done ? "text-gray-900" : "text-gray-400"}`}>
      <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${done ? "bg-neon-grad border-transparent" : "border-gray-300"}`}>
        {done && <span className="text-[10px] text-ink">✓</span>}
      </span>
      {label}
    </div>
  );
}
