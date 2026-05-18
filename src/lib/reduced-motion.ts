import { useEffect, useState } from "react";

const KEY = "necrack_reduced_motion"; // "on" | "off" | "system"

export type RMMode = "on" | "off" | "system";

export function getRMMode(): RMMode {
  try {
    const v = localStorage.getItem(KEY) as RMMode | null;
    return v ?? "system";
  } catch {
    return "system";
  }
}

export function setRMMode(m: RMMode) {
  try { localStorage.setItem(KEY, m); } catch {}
  window.dispatchEvent(new CustomEvent("necrack-rm-change"));
}

function systemPrefers(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    const m = getRMMode();
    if (m === "on") return true;
    if (m === "off") return false;
    return systemPrefers();
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const recompute = () => {
      const m = getRMMode();
      if (m === "on") setReduced(true);
      else if (m === "off") setReduced(false);
      else setReduced(mq.matches);
    };
    mq.addEventListener?.("change", recompute);
    window.addEventListener("necrack-rm-change", recompute);
    window.addEventListener("storage", recompute);
    return () => {
      mq.removeEventListener?.("change", recompute);
      window.removeEventListener("necrack-rm-change", recompute);
      window.removeEventListener("storage", recompute);
    };
  }, []);

  return reduced;
}
