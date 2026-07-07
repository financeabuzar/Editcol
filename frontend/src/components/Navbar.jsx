import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X, MessageCircle, LayoutDashboard, Shield, Sparkles } from "lucide-react";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  const links = [
    { to: "/browse", label: "Marketplace" },
    { to: "/success-stories", label: "Showcase" },
    { to: "/how-it-works", label: "Workflow" },
    { to: "/trust", label: "Trust" },
    { to: "/ai-match", label: "AI Match" },
  ];
  const isLoggedIn = user && user !== false;
  const onLogout = async () => { await logout(); nav("/"); };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="premium-shell h-16 flex items-center justify-between gap-3 text-foreground">
        <div className="flex min-w-0 items-center gap-8">
          <Logo size="md" />
          <nav className="hidden lg:flex items-center gap-1 rounded-full border border-border bg-foreground/[0.035] p-1 text-sm">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                data-testid={`nav-${l.to.replace(/\//g,"")}`}
                className={({isActive}) => `rounded-full px-3.5 py-2 transition-colors ${isActive ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground transition-all hover:bg-foreground/5 mr-1" />
          {isLoggedIn ? (
            <>
              <Link to="/messages" data-testid="nav-messages" className="rounded-full border border-border p-2 text-muted-foreground transition hover:border-foreground/20 hover:text-foreground">
                <MessageCircle size={18} />
              </Link>
              <Link to="/dashboard" data-testid="nav-dashboard" className="btn-outline !min-h-10 !px-4">
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              {user.role === "admin" && (
                <Link to="/admin" data-testid="nav-admin" className="btn-outline !min-h-10 !px-4">
                  <Shield size={16}/> Admin
                </Link>
              )}
              <button onClick={onLogout} data-testid="nav-logout" className="btn-primary !min-h-10 !px-4">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" data-testid="nav-login" className="text-sm font-semibold text-muted-foreground transition hover:text-foreground">Sign in</Link>
              <Link to="/register" data-testid="nav-register" className="btn-primary !min-h-10 !px-4">
                <Sparkles size={16} /> Get Started
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen(!open)}
          data-testid="nav-menu-toggle"
          className="md:hidden rounded-full border border-border p-2 text-foreground"
          aria-expanded={open}
          aria-label="Toggle navigation menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background px-4 pb-5 pt-3 text-foreground">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block rounded-lg px-2 py-3 text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all">
              {l.label}
            </Link>
          ))}
          <div className="mt-3 grid gap-2 border-t border-border pt-4">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Select Theme</span>
              <ThemeToggle className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground transition-all hover:bg-foreground/5" />
            </div>
            {isLoggedIn ? (
              <>
                <Link to="/messages" onClick={()=>setOpen(false)} className="btn-outline">Messages</Link>
                <Link to="/dashboard" onClick={()=>setOpen(false)} className="btn-outline">Dashboard</Link>
                {user.role === "admin" && <Link to="/admin" onClick={()=>setOpen(false)} className="btn-outline">Admin</Link>}
                <button onClick={()=>{ setOpen(false); onLogout(); }} className="btn-primary">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={()=>setOpen(false)} className="btn-outline">Sign in</Link>
                <Link to="/register" onClick={()=>setOpen(false)} className="btn-primary">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
