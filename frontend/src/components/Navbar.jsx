import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X, MessageCircle, LayoutDashboard, Shield } from "lucide-react";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  const appLinks = [
    { to: "/browse", label: "Browse Editors" },
    { to: "/how-it-works", label: "How It Works" },
    { to: "/ai-match", label: "AI Match" },
    { to: "/trust", label: "Trust & Safety" },
    { to: "/success-stories", label: "Success Stories" },
  ];
  const isLoggedIn = user && user !== false;
  const links = appLinks;

  const onLogout = async () => { await logout(); nav("/"); };

  return (
    <header className="sticky top-0 z-40 bg-ink/95 backdrop-blur supports-[backdrop-filter]:bg-ink/80" style={{ background: "rgba(10,10,10,0.92)", backdropFilter: "blur(10px)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-3 text-white">
        <div className="flex min-w-0 items-center gap-10">
          <Logo size="md" />
          <nav className="hidden md:flex items-center gap-4 lg:gap-7 text-sm">
            {links.map((l) => (
              <NavLink
                key={l.to} to={l.to} data-testid={`nav-${l.to.replace(/\//g,"")}`}
                className={({isActive}) => `transition-colors hover:text-white ${isActive ? "text-white" : "text-gray-400"}`}>
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {isLoggedIn ? (
            <>
              <Link to="/messages" data-testid="nav-messages" className="text-gray-300 hover:text-white p-2 rounded-full hover:bg-white/5">
                <MessageCircle size={18} />
              </Link>
              <Link to="/dashboard" data-testid="nav-dashboard" className="text-sm text-gray-300 hover:text-white flex items-center gap-2">
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              {user.role === "admin" && (
                <Link to="/admin" data-testid="nav-admin" className="text-sm text-gray-300 hover:text-white flex items-center gap-2">
                  <Shield size={16}/> Admin
                </Link>
              )}
              <button onClick={onLogout} data-testid="nav-logout" className="btn-primary text-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" data-testid="nav-login" className="text-sm text-gray-300 hover:text-white">Sign in</Link>
              <Link to="/register" data-testid="nav-register" className="btn-primary text-sm">Get Started</Link>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen(!open)}
          data-testid="nav-menu-toggle"
          className="md:hidden text-white p-2 -mr-2 rounded-full hover:bg-white/10"
          aria-expanded={open}
          aria-label="Toggle navigation menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-ink text-white px-4 sm:px-6 pb-5 space-y-3 border-t border-white/10 max-h-[calc(100vh-4rem)] overflow-y-auto scroll-area">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block py-2 text-gray-300">{l.label}</Link>
          ))}
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            <ThemeToggle className="w-full justify-center" />
            {isLoggedIn ? (
              <>
                <Link to="/messages" onClick={()=>setOpen(false)} className="btn-outline text-center">Messages</Link>
                <Link to="/dashboard" onClick={()=>setOpen(false)} className="btn-outline text-center">Dashboard</Link>
                {user.role === "admin" && (
                  <Link to="/admin" onClick={()=>setOpen(false)} className="btn-outline text-center">Admin</Link>
                )}
                <button onClick={()=>{ setOpen(false); onLogout(); }} className="btn-primary">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={()=>setOpen(false)} className="btn-outline text-center">Sign in</Link>
                <Link to="/register" onClick={()=>setOpen(false)} className="btn-primary text-center">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
