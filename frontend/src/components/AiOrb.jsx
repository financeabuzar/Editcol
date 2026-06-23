import { motion, useMotionTemplate, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { useMousePosition } from "@/lib/useMousePosition";

/**
 * Floating, slowly-rotating neon orb that follows the cursor with a slight lag.
 * Used as a hero decoration. Honors prefers-reduced-motion.
 */
export default function AiOrb({ size = 360 }) {
  const { mx, my } = useMousePosition({ damping: 28, stiffness: 90 });
  const tx = useTransform(mx, [-0.5, 0.5], [-30, 30]);
  const ty = useTransform(my, [-0.5, 0.5], [-20, 20]);

  return (
    <motion.div
      aria-hidden
      className="absolute pointer-events-none select-none"
      style={{ x: tx, y: ty, width: size, height: size }}
    >
      <motion.div
        className="w-full h-full rounded-full relative"
        style={{
          background:
            "radial-gradient(circle at 35% 35%, rgba(57,255,20,0.95) 0%, rgba(223,255,0,0.55) 35%, rgba(57,255,20,0.05) 70%, transparent 80%)",
          filter: "blur(8px)",
        }}
        animate={{ rotate: 360, scale: [1, 1.04, 1] }}
        transition={{ rotate: { duration: 32, repeat: Infinity, ease: "linear" },
                      scale:  { duration: 6,  repeat: Infinity, ease: "easeInOut" } }}
      />
      {/* Inner glassy core */}
      <motion.div
        className="absolute inset-[18%] rounded-full"
        style={{
          background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5), rgba(255,255,255,0) 60%)",
          backdropFilter: "blur(12px)",
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  );
}
