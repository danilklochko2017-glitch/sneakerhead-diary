import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces
        "midnight-core":    "#0d0e11",
        "obsidian-base":    "#14151a",
        "charcoal-canvas":  "#282a36",
        // Borders
        "slate-border":     "#3a3a3f",
        "graphite-accent":  "#3b3f4b",
        // Text
        "ash-text":         "#6b7280",
        "silver-text":      "#e5e7eb",
        "polar-white":      "#ffffff",
        // Accents
        "cyber-pink":       "#f472b6",
        "neon-violet":      "#a855f7",
        "faded-rose":       "#fbcfe8",
        "magenta-glow":     "#ec4899",
        "electric-cyan":    "#22d3ee",
        "virtual-violet":   "#c084fc",
        // Status
        "system-green":     "#34d399",
        "warning-yellow":   "#fcd34d",
        "danger-red":       "#f87171",
      },
      fontFamily: {
        sans:  ["Inter", "system-ui", "ui-sans-serif", "sans-serif"],
        mono:  ["'Bricolage Grotesque'", "sans-serif"],
      },
      fontSize: {
        caption:      ["12px", { lineHeight: "1.5" }],
        body:         ["14px", { lineHeight: "1.43" }],
        heading:      ["20px", { lineHeight: "1.4" }],
        "heading-lg": ["24px", { lineHeight: "1.33" }],
        display:      ["60px", { lineHeight: "1" }],
      },
      borderRadius: {
        DEFAULT:  "8px",
        input:    "7px",
        button:   "8px",
        badge:    "9999px",
        full:     "9999px",
      },
      maxWidth: {
        content: "1280px",
      },
      spacing: {
        "4":   "4px",
        "8":   "8px",
        "12":  "12px",
        "16":  "16px",
        "20":  "20px",
        "24":  "24px",
        "32":  "32px",
        "40":  "40px",
        "48":  "48px",
        "64":  "64px",
        "80":  "80px",
        "96":  "96px",
        "120": "120px",
        "128": "128px",
      },
      boxShadow: {
        xl: "rgba(0, 0, 0, 0.25) 0px 25px 50px -12px",
        md: "rgba(131, 24, 67, 0.1) 0px 10px 15px -3px, rgba(131, 24, 67, 0.1) 0px 4px 6px -4px",
      },
    },
  },
  plugins: [],
};
export default config;
