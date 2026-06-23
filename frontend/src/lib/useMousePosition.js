import { useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

/**
 * Tracks the mouse position globally and exposes smooth-spring x/y values
 * normalized to the viewport. Each consumer can derive tilt / translate from these.
 *
 * Returns: { mx, my } (motion values), each in [-0.5, 0.5] roughly.
 */
export function useMousePosition({ damping = 18, stiffness = 110 } = {}) {
  const mxRaw = useMotionValue(0);
  const myRaw = useMotionValue(0);
  const mx = useSpring(mxRaw, { damping, stiffness, mass: 0.4 });
  const my = useSpring(myRaw, { damping, stiffness, mass: 0.4 });

  useEffect(() => {
    const handle = (e) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      mxRaw.set(x);
      myRaw.set(y);
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, [mxRaw, myRaw]);

  return { mx, my };
}

/**
 * Useful transform helper — translate range
 */
export function useTranslate(motionValue, range = 24) {
  return useTransform(motionValue, [-0.5, 0.5], [-range, range]);
}
