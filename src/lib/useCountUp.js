import { useEffect, useRef, useState } from "react";

// Animates a number from 0 up to `target` with an ease-out curve.
// Skips straight to the final value when the user prefers reduced motion.
export function useCountUp(target, { active = true, duration = 900, decimals = 0 } = {}) {
  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [value, setValue] = useState(prefersReducedMotion ? target : 0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!active || !Number.isFinite(target) || prefersReducedMotion) return undefined;
    const startTime = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, active, duration, prefersReducedMotion]);

  return Number(value.toFixed(decimals));
}
