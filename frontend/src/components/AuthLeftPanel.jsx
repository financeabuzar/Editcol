import { motion } from "framer-motion";
import Logo from "@/components/Logo";

/**
 * Minimal left-panel for auth pages.
 * Dark full-height panel with subtle glow blobs.
 * Logo + tagline pinned to the bottom.
 */
export default function AuthLeftPanel({ isSignUp }) {
  return (
    <div
      className="
        relative shrink-0 overflow-hidden
        w-full lg:w-[44%]
        self-stretch
        min-h-[72px] lg:min-h-full
        flex flex-col
        bg-secondary/50 backdrop-blur-sm
        border-b border-border lg:border-b-0 lg:border-r lg:border-border
        lg:rounded-l-3xl
      "
    >
      {/* ── Background glow blobs (always visible) ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* top-left purple bloom */}
        <div
          className="absolute -top-24 -left-24 w-80 h-80 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)",
            filter: "blur(70px)",
          }}
        />
        {/* bottom-right cyan bloom */}
        <div
          className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)",
            filter: "blur(65px)",
          }}
        />
        {/* centre ambient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 40% 60%, rgba(124,58,237,0.1) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* ══ MOBILE: horizontal logo row (top) ══ */}
      <div className="lg:hidden relative z-10 flex items-center px-5 h-[80px]">
        <Logo size="sm" as="div" />
      </div>

      {/* ══ DESKTOP: content pinned to the bottom ══ */}
      <div className="hidden lg:flex flex-col justify-end flex-1 relative z-10 px-10 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="space-y-5"
        >
          {/* Logo */}
          <Logo size="lg" as="div" />

          {/* Divider */}
          <div className="w-8 h-px bg-gradient-to-r from-purple-500/60 via-cyan-500/40 to-transparent" />

          {/* Tagline */}
          <motion.div
            key={isSignUp ? "signup" : "login"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="space-y-2"
          >
            <p className="text-lg font-bold tracking-tight text-foreground leading-snug">
              {isSignUp ? "Match. Edit. Create." : "Welcome back."}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[200px]">
              {isSignUp
                ? "The premier hub for elite video editors and world-class creators."
                : "Sign in to access your projects and editor network."}
            </p>
          </motion.div>

          {/* Portal dot */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground/85 font-mono pt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/60 animate-pulse" />
            editcol.com
          </div>
        </motion.div>
      </div>
    </div>
  );
}
