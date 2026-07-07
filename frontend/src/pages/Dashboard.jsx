import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import TrustBadges from "@/components/TrustBadges";
import {
  Briefcase,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

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

  // Calculate missing items for editor onboarding checklist if profile isn't public
  const checklist = editor ? [
    { label: "Profile photo", done: !!editor.avatar },
    { label: "Bio detail", done: !!editor.bio },
    { label: "Key skills", done: (editor.skills || []).length > 0 },
    { label: "Portfolio items", done: (editor.portfolio || []).length > 0 },
  ] : [];
  const completedCount = checklist.filter(c => c.done).length;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-purple-600 selection:text-white relative overflow-hidden">
      {/* Background glow blobs */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-purple-900/5 rounded-full pointer-events-none" style={{ filter: "blur(140px)" }} />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-950/5 rounded-full pointer-events-none" style={{ filter: "blur(130px)" }} />

      <div className="premium-shell py-8 sm:py-12 z-10 relative">
        
        {/* Verification alert banner */}
        {(!user.email_verified || !user.phone_verified) && (
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center justify-between rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 text-sm text-amber-600 dark:text-amber-200">
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} className="text-amber-500 shrink-0" />
              <span>
                Please verify your {!user.email_verified && "email"}{!user.email_verified && !user.phone_verified && " and "}{!user.phone_verified && "phone"} to secure your account.
              </span>
            </div>
            <Link to="/verify" className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-200 hover:underline transition-colors text-xs uppercase tracking-wider">
              Verify Account <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* Minimal Greeting Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border pb-8 mb-10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground font-mono">Command Center</span>
            </div>
            <h1 className="mt-2 text-4xl sm:text-5xl font-black tracking-tight text-foreground">
              Welcome, {user.name}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isEditor ? "Track your marketplace visibility, stats, and project queue." : "Manage active editing briefs, conversations, and timelines."}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-full bg-card border border-border text-[11px] font-mono font-bold tracking-wider text-muted-foreground">
              {user.role.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Two-Column Minimalist Grid */}
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          
          {/* Main workspace (Left side) */}
          <main className="space-y-8 min-w-0">
            
            {/* Editor profile status bar (Sleek minimalist alert) */}
            {isEditor && editor && (
              <div className="rounded-2xl border border-border bg-card p-5 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">Marketplace Standing</span>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-foreground">
                      {editor.is_public ? "Live & Discoverable" : "Profile Setup Pending"}
                    </h3>
                    <span className={`h-2 w-2 rounded-full ${editor.is_public ? "bg-emerald-500" : "bg-purple-500 animate-pulse"}`} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {editor.is_public 
                      ? "Your portfolio is live. Creators can browse and book you." 
                      : `Complete ${checklist.length - completedCount} more details to go live on the directory.`
                    }
                  </p>
                </div>
                
                <div className="flex items-center gap-4 shrink-0">
                  {!editor.is_public && (
                    <div className="hidden sm:block text-right">
                      <span className="text-xs font-bold text-foreground font-mono">{completedCount}/{checklist.length}</span>
                      <p className="text-[10px] text-muted-foreground">Requirements met</p>
                    </div>
                  )}
                  <Link 
                    to="/editor/onboarding" 
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-xs font-bold text-foreground hover:bg-card transition-colors"
                  >
                    Edit Profile
                  </Link>
                </div>
              </div>
            )}

            {/* Quick stats metrics */}
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
              <StatCard label="Total Projects" value={projects.length} />
              <StatCard label="Direct Messages" value="Inbox" link="/messages" />
              <StatCard label={isEditor ? "Starting Price" : "Milestone Target"} value={isEditor ? `$${editor?.starting_price || 0}` : "Active"} />
              <StatCard label="Account Status" value={user.status === "active" ? "Active" : user.status} />
            </div>

            {/* Recent projects block */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Briefcase size={18} className="text-purple-400" />
                  <span>Recent Workspaces</span>
                </h3>
                {user.role === "client" && (
                  <Link to="/browse" className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1">
                    Find editors <ArrowRight size={12} />
                  </Link>
                )}
              </div>

              {projects.length === 0 ? (
                <div className="rounded-3xl border border-border bg-card/40 p-10 text-center backdrop-blur-md">
                  <p className="text-lg font-bold text-foreground">No active workspaces</p>
                  <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
                    Start a project brief to match with elite video editors on the platform.
                  </p>
                  {user.role === "client" && (
                    <Link to="/browse" className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-foreground text-background hover:opacity-90 font-bold px-5 text-xs transition-all">
                      Browse Portfolio Directory
                    </Link>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-card backdrop-blur-md overflow-hidden divide-y divide-border">
                  {projects.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-4 transition-all duration-200 hover:bg-foreground/[0.02] group">
                      <div className="min-w-0 pr-4">
                        <p className="font-bold text-foreground group-hover:text-purple-400 transition-colors truncate">{p.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {p.content_type} · ${p.budget} · Deadline {p.deadline}
                        </p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                        p.status === "completed" 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                          : "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400"
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </main>

          {/* Sidebar (Right side) */}
          <aside className="space-y-6 lg:sticky lg:top-24">
            
            {/* Quick Actions Panel */}
            <div className="rounded-2xl border border-border bg-card p-5 backdrop-blur-md space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">Quick Shortcuts</span>
              <div className="grid gap-2">
                <SidebarLink to="/messages" label="Message Hub" desc="Check direct conversations" />
                <SidebarLink to="/ai-match" label="AI Matchmaking" desc="Find creators instantly" />
                {isEditor ? (
                  <SidebarLink to={`/editor/${user.id}`} label="View Live Profile" desc="Preview what clients see" />
                ) : (
                  <SidebarLink to="/browse" label="Explore Editors" desc="Browse our directory list" />
                )}
              </div>
            </div>

            {/* Performance confidence panel */}
            <div className="rounded-2xl border border-border bg-card p-5 backdrop-blur-md space-y-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">Performance Metrics</span>
              <div className="space-y-4">
                <Metric label="Brief Accuracy" value="82%" />
                <Metric label={isEditor ? "Response Speed" : "Editor Alignment"} value="91%" />
                <Metric label="Delivery Trust" value="76%" />
              </div>
            </div>

          </aside>

        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, link }) {
  const content = (
    <div className="rounded-2xl border border-border bg-card p-4 backdrop-blur-md hover:border-zinc-400 dark:hover:border-zinc-800 transition-all duration-200">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono truncate">{label}</p>
      <div className="mt-3 flex items-baseline gap-1.5">
        <p className="text-2xl font-black text-foreground tracking-tight">{value}</p>
        {link && <ChevronRight size={14} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />}
      </div>
    </div>
  );

  if (link) {
    return (
      <Link to={link} className="block group">
        {content}
      </Link>
    );
  }

  return content;
}

function SidebarLink({ to, label, desc }) {
  return (
    <Link to={to} className="group flex items-center justify-between p-2.5 rounded-xl bg-background border border-border hover:bg-foreground/[0.02] transition-all">
      <div className="min-w-0">
        <p className="text-xs font-bold text-foreground group-hover:text-purple-400 transition-colors">{label}</p>
        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{desc}</p>
      </div>
      <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
    </Link>
  );
}

function Metric({ label, value }) {
  const percentNum = Number(String(value).replace("%", "")) || 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold text-foreground font-mono">{value}</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-850">
        <div 
          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500" 
          style={{ width: `${percentNum}%` }} 
        />
      </div>
    </div>
  );
}
