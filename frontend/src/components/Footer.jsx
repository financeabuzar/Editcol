import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import { Twitter, Instagram, Mail } from "lucide-react";

const SOCIAL_LINKS = [
  { Icon: Instagram, href: "https://www.instagram.com/editcol_insta/", label: "EditCol on Instagram" },
  { Icon: Twitter, href: "https://x.com/editcol_x", label: "EditCol on X" },
  { Icon: Mail, href: "mailto:official@editcol.com", label: "Email EditCol" },
];

export default function Footer() {
  return (
    <footer className="mt-16 sm:mt-24 bg-ink text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 sm:gap-10">
        <div className="sm:col-span-2">
          <Logo size="md" as="div" />
          <p className="mt-5 max-w-sm text-sm text-gray-400 leading-relaxed">
            EditCol is the premium marketplace for hiring verified video editors.
            Trust scores, real reviews, and transparent workflows — built for serious creators.
          </p>
          <div className="mt-6 flex gap-3">
            {SOCIAL_LINKS.map(({ Icon, href, label }) => (
              <a key={href} href={href} aria-label={label} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:border-[#39FF14] hover:text-white" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-white mb-4">Platform</p>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><Link to="/browse" className="hover:text-white">Browse Editors</Link></li>
            <li><Link to="/how-it-works" className="hover:text-white">How It Works</Link></li>
            <li><Link to="/trust" className="hover:text-white">Trust & Safety</Link></li>
            <li><Link to="/register" className="hover:text-white">Become an Editor</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-white mb-4">Legal</p>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><Link to="/legal/terms" data-testid="footer-terms" className="hover:text-white">Terms of Service</Link></li>
            <li><Link to="/legal/privacy" data-testid="footer-privacy" className="hover:text-white">Privacy Policy</Link></li>
            <li><Link to="/legal/cookies" data-testid="footer-cookies" className="hover:text-white">Cookie Policy</Link></li>
            <li><Link to="/legal/refund" data-testid="footer-refund" className="hover:text-white">Refund Policy</Link></li>
            <li><Link to="/legal/community" data-testid="footer-community" className="hover:text-white">Community Guidelines</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-white mb-4">Support</p>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><a href="mailto:official@editcol.com" className="hover:text-white">official@editcol.com</a></li>
            <li><Link to="/trust" className="hover:text-white">Report a Problem</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-5 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-gray-500 text-center md:text-left">
          <p>© {new Date().getFullYear()} EditCol. All rights reserved.</p>
          <p>Crafted with neon and discipline.</p>
        </div>
      </div>
    </footer>
  );
}
