import { motion } from "framer-motion";
import { ShieldCheck, BadgeCheck, Eye, Lock, CreditCard, FileSearch, Flag, AlertOctagon } from "lucide-react";
import TiltCard from "@/components/TiltCard";

const PILLARS = [
  { Icon: BadgeCheck,  t: "Verified Editors",            d: "Every editor must complete mandatory email and phone verification before going public. No exceptions." },
  { Icon: Eye,         t: "Identity Verification",       d: "Profiles are tied to verified contact details. Suspicious patterns (duplicate names, throwaway emails) flag automatically." },
  { Icon: FileSearch,  t: "Anti-Fake Portfolio Detection", d: "We compare uploaded work against our index of known sources to surface plagiarism and stock-only portfolios." },
  { Icon: Lock,        t: "Escrow Protection",           d: "Project funds are held safely until you confirm delivery. Editors get paid, you get a deliverable, no surprises." },
  { Icon: CreditCard,  t: "Secure Payments",             d: "Card data never touches our servers. Payouts and refunds run on a PCI-compliant rail with tokenised cards." },
  { Icon: ShieldCheck, t: "Review Moderation",           d: "Only verified clients can review. Our moderation team removes incentivised, retaliatory, and bot-generated reviews." },
  { Icon: Flag,        t: "Report Scam System",          d: "One click on any profile to report scams, fakes, or harassment. A human admin reviews every report." },
  { Icon: AlertOctagon,t: "Fraud Detection",             d: "Behavioural heuristics catch duplicate accounts, fake reviews, off-platform payment attempts, and chargeback abuse." },
];

export default function TrustSafety() {
  return (
    <div className="fade-in">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 pt-14 sm:pt-20 pb-10 text-center">
        <p className="text-xs font-bold tracking-wider uppercase text-gray-500">Trust & Safety</p>
        <h1 className="font-heading text-4xl sm:text-6xl font-bold text-gray-900 mt-4 leading-tight break-words">
          A platform built like<br/>a <span className="text-neon-grad">financial product</span>.
        </h1>
        <p className="mt-5 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
          Eight layers of protection, from identity verification through fraud detection — so creators and editors only ever focus on the work.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pb-16 sm:pb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PILLARS.map((p, i) => (
            <motion.div key={p.t}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}>
              <TiltCard className="card p-5 h-full" maxTilt={6}>
                <div className="w-10 h-10 rounded-xl bg-ink text-white flex items-center justify-center">
                  <p.Icon size={18} className="text-[#39FF14]"/>
                </div>
                <p className="mt-4 font-semibold text-gray-900">{p.t}</p>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{p.d}</p>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 pb-20 sm:pb-24">
        <div className="card p-6 sm:p-10 bg-ink text-white relative overflow-hidden rounded-2xl sm:rounded-3xl">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(57,255,20,0.4), transparent 70%)"}}/>
          <p className="text-xs font-bold tracking-wider uppercase text-[#DFFF00]">For our community</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold mt-3">Report something? Get a real human in 24h.</h2>
          <p className="mt-3 text-gray-300 max-w-2xl">Email <a href="mailto:trust@editcol.com" className="underline">trust@editcol.com</a> or use the Report button on any profile. Every report enters the moderation queue and a human admin reviews it.</p>
        </div>
      </section>
    </div>
  );
}
