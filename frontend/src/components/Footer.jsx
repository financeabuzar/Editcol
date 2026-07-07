import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import { Twitter, Instagram, Mail, ArrowRight } from "lucide-react";

const SOCIAL_LINKS = [
  { Icon: Instagram, href: "https://www.instagram.com/editcol_insta/", label: "EditCol on Instagram" },
  { Icon: Twitter, href: "https://x.com/editcol_x", label: "EditCol on X" },
  { Icon: Mail, href: "mailto:official@editcol.com", label: "Email EditCol" },
];

export default function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-border bg-background text-muted-foreground cinema-noise">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
      <div className="premium-shell py-14 sm:py-18">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <Logo size="md" as="div" />
            <h2 className="mt-8 max-w-3xl text-4xl font-semibold leading-[0.98] text-foreground sm:text-6xl">
              Ready to create your next viral video?
            </h2>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/browse" className="btn-primary">Hire an Editor <ArrowRight size={16} /></Link>
              <Link to="/register" className="btn-outline">Become an Editor</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <FooterGroup title="Platform" links={[
              ["/browse", "Marketplace"],
              ["/how-it-works", "Workflow"],
              ["/trust", "Trust"],
              ["/success-stories", "Stories"],
            ]} />
            <FooterGroup title="Legal" links={[
              ["/legal/terms", "Terms"],
              ["/legal/privacy", "Privacy"],
              ["/legal/cookies", "Cookies"],
              ["/legal/refund", "Refunds"],
            ]} />
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-foreground">Social</p>
              <div className="flex gap-2">
                {SOCIAL_LINKS.map(({ Icon, href, label }) => (
                  <a key={href} href={href} aria-label={label} target="_blank" rel="noreferrer" className="grid h-10 w-10 place-items-center rounded-full border border-border transition hover:border-accent hover:text-foreground">
                    <Icon size={16} />
                  </a>
                ))}
              </div>
              <a href="mailto:official@editcol.com" className="mt-4 block text-sm transition hover:text-foreground">official@editcol.com</a>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col justify-between gap-3 border-t border-border pt-5 text-xs text-zinc-500 md:flex-row">
          <p>© {new Date().getFullYear()} EditCol. All rights reserved.</p>
          <p>Elite editing talent, curated for serious creators.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({ title, links }) {
  return (
    <div>
      <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-foreground">{title}</p>
      <ul className="space-y-2 text-sm">
        {links.map(([to, label]) => (
          <li key={to}><Link to={to} className="transition hover:text-foreground">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
