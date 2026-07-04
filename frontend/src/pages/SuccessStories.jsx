import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Sparkles, ArrowRight } from "lucide-react";

export default function SuccessStories() {
  return (
    <div className="fade-in">
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 pt-14 sm:pt-20 pb-10 text-center">
        <p className="text-xs font-bold tracking-wider uppercase text-gray-500">Success stories</p>
        <h1 className="font-heading text-4xl sm:text-6xl font-bold text-gray-900 mt-4 leading-tight break-words">
          Real projects.<br/>Real <span className="text-neon-grad">creators</span>.
        </h1>
        <p className="mt-5 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
          Once verified editors complete projects on EditCol, their stories appear here — pulled directly from real reviews and outcomes. Nothing is fabricated.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 pb-20 sm:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="card p-6 sm:p-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-50 bg-grid" />
          <div className="relative">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-ink text-white flex items-center justify-center">
              <Trophy size={22} className="text-[#39FF14]"/>
            </div>
            <h2 className="font-heading text-3xl font-bold mt-5 text-gray-900">Be the first story</h2>
            <p className="mt-3 text-gray-600 max-w-md mx-auto">
              EditCol launched with no fake testimonials. The first verified projects to complete will be featured here — with full credit.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row sm:flex-wrap gap-3 justify-center">
              <Link to="/ai-match" data-testid="ss-aimatch" className="btn-primary inline-flex items-center justify-center gap-2">
                <Sparkles size={16}/> Start a project
              </Link>
              <Link to="/register?role=editor" data-testid="ss-join-editor" className="btn-outline text-center">
                Join as editor
              </Link>
            </div>
          </div>
        </motion.div>

        <div className="mt-10 text-center text-xs text-gray-400">
          Want your project featured? Email <a href="mailto:hello@editcol.com" className="underline">hello@editcol.com</a> once it's complete.
        </div>
      </section>
    </div>
  );
}
