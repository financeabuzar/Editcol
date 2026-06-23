import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FilePlus, Sparkles, Users, Handshake, MessageSquare, UploadCloud, FileVideo, Wallet, ArrowRight } from "lucide-react";
import TiltCard from "@/components/TiltCard";

const STEPS = [
  { n: "01", Icon: FilePlus,     t: "Client posts a project",   d: "Describe your edit — content type, editing style, footage size, motion graphics needs, budget, and deadline." },
  { n: "02", Icon: Sparkles,     t: "AI matches editors",       d: "EditCol's AI matcher ranks verified editors by skill fit, trust score, badges, and price — instantly." },
  { n: "03", Icon: Users,        t: "Editors apply",            d: "Vetted editors submit a short proposal. You review their portfolio, badges, and trust score side by side." },
  { n: "04", Icon: Handshake,    t: "Client accepts an editor", d: "One click. EditCol freezes the project to that editor and automatically declines other open applications." },
  { n: "05", Icon: MessageSquare,t: "Private chat opens",       d: "A workspace appears in your Messages instantly — no manual setup. Both sides get a system welcome message." },
  { n: "06", Icon: UploadCloud,  t: "Files are uploaded",       d: "Share footage, references, brand assets, and notes directly in chat. Images, videos, and documents supported." },
  { n: "07", Icon: FileVideo,    t: "Editor delivers work",     d: "Deliverables and revision rounds happen inside the same workspace. Read receipts confirm visibility." },
  { n: "08", Icon: Wallet,       t: "Payment is released",      d: "Mark the project complete and release payment. Both sides leave verified reviews that fuel trust scores." },
];

export default function HowItWorks() {
  return (
    <div className="fade-in">
      <section className="max-w-5xl mx-auto px-6 lg:px-10 pt-20 pb-10 text-center">
        <p className="text-xs font-bold tracking-wider uppercase text-gray-500">How EditCol works</p>
        <h1 className="font-heading text-5xl sm:text-6xl font-bold text-gray-900 mt-4 leading-tight">
          A frictionless workflow,<br/>built on <span className="text-neon-grad">trust</span>.
        </h1>
        <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto">
          Eight clean steps from brief to delivery — no DMs, no spreadsheets, no chasing.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 lg:px-10 pb-20">
        <div className="relative">
          {/* Vertical neon track on the left */}
          <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[#39FF14] via-[#DFFF00] to-transparent hidden sm:block" />

          <div className="space-y-5">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.45, delay: i * 0.04 }}
                className="relative pl-0 sm:pl-20"
              >
                <div className="hidden sm:flex absolute left-0 top-2 w-16 h-16 rounded-2xl bg-ink text-white items-center justify-center shadow-lg">
                  <s.Icon size={22} className="text-[#39FF14]" />
                </div>
                <TiltCard className="card p-6 sm:p-7" maxTilt={3} glare={false}>
                  <div className="flex items-start gap-4">
                    <div className="sm:hidden w-12 h-12 rounded-xl bg-ink text-white flex items-center justify-center shrink-0">
                      <s.Icon size={18} className="text-[#39FF14]"/>
                    </div>
                    <div className="flex-1">
                      <p className="text-neon-grad font-mono font-bold text-sm">STEP {s.n}</p>
                      <p className="mt-1 font-heading text-xl sm:text-2xl font-semibold text-gray-900">{s.t}</p>
                      <p className="mt-2 text-gray-600 leading-relaxed">{s.d}</p>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <Link to="/ai-match" className="btn-primary inline-flex items-center gap-2">
            Try AI Match now <ArrowRight size={16}/>
          </Link>
        </div>
      </section>
    </div>
  );
}
