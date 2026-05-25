"use client";

import { useEffect } from "react";

// Global mouse-tracking glow for all .card-glow elements.
// Updates CSS vars --glow-x / --glow-y per card; the ::before pseudo-element
// in globals.css renders the diffused white spotlight.
export default function GlowEffect() {
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      document.querySelectorAll<HTMLElement>(".card-glow").forEach((card) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--glow-x", `${e.clientX - r.left}px`);
        card.style.setProperty("--glow-y", `${e.clientY - r.top}px`);
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return null;
}
