import { ShieldCheck, MessageSquare, Briefcase, Star } from "lucide-react";

export function HowItWorks() {
  return (
    <div className="fade-in max-w-4xl mx-auto px-6 lg:px-10 py-16">
      <h1 className="font-heading text-4xl font-bold text-gray-900">How EditCol works</h1>
      <p className="mt-3 text-gray-500">A clean, trust-first workflow from first message to final delivery.</p>
      <div className="mt-12 grid md:grid-cols-2 gap-6">
        {[
          { Icon: ShieldCheck, t: "Browse verified editors", d: "Every editor passes email + phone verification before listing." },
          { Icon: MessageSquare, t: "Message editors directly", d: "Open a real-time chat from any editor profile." },
          { Icon: Briefcase,   t: "Send a project request", d: "Structured form with budget, deadline, content type, and motion graphics needs." },
          { Icon: Star,        t: "Pay, deliver, review",   d: "Only verified clients can leave reviews. Trust scores update automatically." },
        ].map(s => (
          <div key={s.t} className="card p-6">
            <div className="w-10 h-10 rounded-xl bg-ink text-white flex items-center justify-center"><s.Icon size={18} className="text-[#39FF14]"/></div>
            <p className="mt-4 font-semibold text-gray-900">{s.t}</p>
            <p className="mt-1 text-sm text-gray-500 leading-relaxed">{s.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrustSafety() {
  return (
    <div className="fade-in max-w-4xl mx-auto px-6 lg:px-10 py-16">
      <h1 className="font-heading text-4xl font-bold text-gray-900">Trust & Safety</h1>
      <p className="mt-3 text-gray-500">How EditCol keeps the marketplace authentic.</p>
      <div className="mt-12 space-y-4">
        {[
          { t: "Identity verification", d: "Email and phone verification are mandatory before any editor goes public." },
          { t: "Trust scores", d: "Completion rate, response rate, on-time delivery, and client satisfaction — calculated in real time." },
          { t: "Tiered badges", d: "Verified Editor, Pro Editor, Top Rated, and Elite Editor — earned, never bought." },
          { t: "Anti-fake system", d: "We detect duplicate accounts, fake reviews, and suspicious behavior. Reports go to a human admin queue." },
          { t: "Real-time messaging", d: "Encrypted in transit; attachments and read receipts supported." },
          { t: "Refund mediation", d: "If a project fails, the EditCol team mediates within 48 hours." },
        ].map((b, i) => (
          <div key={i} className="card p-5">
            <p className="font-semibold text-gray-900">{b.t}</p>
            <p className="mt-1 text-sm text-gray-500">{b.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
