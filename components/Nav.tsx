"use client";

import { useState, useEffect } from "react";

const DISPLAY = "'Unbounded', sans-serif";
const BODY    = "'Bricolage Grotesque', sans-serif";

const links = [
  { label: "Journal",  href: "#journal" },
  { label: "Setups",   href: "#setups"  },
  { label: "Reviews",  href: "#reviews" },
];

export default function Nav() {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const onScroll = () => {
      const sections = ["journal", "setups", "reviews"];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 80) setActive(`#${id}`);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header style={{
      position: "fixed", top: "16px", left: 0, right: 0, zIndex: 50,
      display: "flex", justifyContent: "center",
      pointerEvents: "none",
    }}>
      <nav style={{
        pointerEvents: "auto",
        display: "inline-flex", alignItems: "center", gap: "4px",
        backgroundColor: "#14151a",
        border: "1px solid #3a3a3f",
        borderRadius: "12px",
        padding: "5px",
        boxShadow: "rgba(0,0,0,0.4) 0px 8px 32px -4px, rgba(0,0,0,0.2) 0px 2px 8px 0px",
      }}>

        {/* Logo badge — yellow */}
        <a href="#hero" style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: "34px", height: "34px",
          backgroundColor: "#FFF93C",
          borderRadius: "8px",
          textDecoration: "none",
          flexShrink: 0,
          marginRight: "4px",
          boxShadow: "rgba(255,249,60,0.3) 0px 4px 12px 0px",
        }}>
          <span style={{
            fontFamily: DISPLAY, fontWeight: 900,
            fontSize: "15px", color: "#0d0e11", lineHeight: 1,
            userSelect: "none",
          }}>S</span>
        </a>

        {/* Divider */}
        <div style={{ width: "1px", height: "20px", backgroundColor: "#3a3a3f", marginRight: "4px", flexShrink: 0 }} />

        {/* Nav links */}
        {links.map(l => {
          const isActive = active === l.href;
          return (
            <a key={l.href} href={l.href}
              onClick={() => setActive(l.href)}
              style={{
                fontFamily: BODY, fontWeight: isActive ? 600 : 400,
                fontSize: "14px", textDecoration: "none",
                color: isActive ? "#ffffff" : "#6b7280",
                padding: "6px 14px",
                borderRadius: "8px",
                backgroundColor: isActive ? "#282a36" : "transparent",
                transition: "color 0.15s, background-color 0.15s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = "#e5e7eb"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = "#6b7280"; }}
            >
              {l.label}
            </a>
          );
        })}
      </nav>
    </header>
  );
}
