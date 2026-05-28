"use client";

import { useState } from "react";
import type { SetupCard, Trade } from "@/types/trade";
import Image from "next/image";

const D = "var(--font-display)";  // Instrument Serif
const M = "var(--font-mono)";     // DM Mono
const B = "var(--font-body)";     // Geist
const AQUA = "#19d0e8";
const INNER = "#141414";

// ─── Inline markdown renderer ─────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  const boldRx = /\*\*(.+?)\*\*/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = boldRx.exec(text)) !== null) {
    if (m.index > last) result.push(text.slice(last, m.index));
    result.push(
      <strong key={m.index} style={{ color: AQUA, fontWeight: 500 }}>
        {m[1]}
      </strong>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) result.push(text.slice(last));
  return result;
}

// ─── Section parser ───────────────────────────────────────────────────────────

interface Section {
  title: string;
  lines: string[];
  link?: { label: string; url: string };
}

function parseDescriptionSections(text: string): Section[] {
  const sections: Section[] = [];
  let current: Section = { title: "", lines: [] };

  for (const line of text.split("\n")) {
    if (line.startsWith("### ")) {
      if (current.title || current.lines.some(l => l.trim())) sections.push(current);
      current = { title: line.slice(4).trim(), lines: [] };
    } else {
      const linkM = line.match(/^(.+?):\s+Link\s+\((.+?)\)\s*$/);
      if (linkM) current.link = { label: linkM[1], url: linkM[2] };
      else current.lines.push(line);
    }
  }
  if (current.title || current.lines.some(l => l.trim())) sections.push(current);
  return sections;
}

function renderSectionLines(lines: string[]) {
  return lines
    .filter((line, i, arr) => {
      if (line.trim() !== "") return true;
      const first = arr.findIndex(l => l.trim());
      const last  = arr.length - 1 - [...arr].reverse().findIndex(l => l.trim());
      return i > first && i < last;
    })
    .map((line, idx) => {
      const numM = line.match(/^(\d+)\.\s+(.+)/);
      if (numM) return (
        <div key={idx} style={{ display: "flex", gap: "10px", marginBottom: "5px" }}>
          <span style={{ color: AQUA, fontWeight: 500, flexShrink: 0, fontFamily: M, fontSize: "13px", minWidth: "14px" }}>
            {numM[1]}.
          </span>
          <span style={{ fontFamily: B, fontSize: "13px", color: "var(--color-near-white)", lineHeight: "1.65", letterSpacing: "-0.01em" }}>
            {renderInline(numM[2])}
          </span>
        </div>
      );
      if (line.startsWith("- ")) return (
        <div key={idx} style={{ display: "flex", gap: "10px", marginBottom: "5px" }}>
          <span style={{ color: AQUA, flexShrink: 0, fontFamily: M, fontSize: "13px" }}>–</span>
          <span style={{ fontFamily: B, fontSize: "13px", color: "var(--color-near-white)", lineHeight: "1.65", letterSpacing: "-0.01em" }}>
            {renderInline(line.slice(2))}
          </span>
        </div>
      );
      if (line.trim() === "") return <div key={idx} style={{ height: "4px" }} />;
      return (
        <p key={idx} style={{ fontFamily: B, fontSize: "13px", lineHeight: "1.65", color: "var(--color-near-white)", letterSpacing: "-0.01em" }}>
          {renderInline(line)}
        </p>
      );
    });
}

function renderDescriptionBlocks(text: string) {
  const sections = parseDescriptionSections(text);
  const backtest = sections.find(s => s.link)?.link;
  const contentSections = sections.filter(s => s.title || s.lines.some(l => l.trim()));

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: "1px", backgroundColor: "#0a0a0a" }}>
        {contentSections.map((section, i) => (
          <div key={i} style={{ padding: "14px 16px", backgroundColor: INNER }}>
            {section.title && (
              <div style={{
                fontFamily: M, fontSize: "12px", fontWeight: 500,
                color: "var(--color-ash-gray)", textTransform: "uppercase",
                letterSpacing: "0.12em", marginBottom: "8px",
              }}>
                {section.title}
              </div>
            )}
            {renderSectionLines(section.lines)}
          </div>
        ))}
      </div>

      {/* Backtest link */}
      {backtest && (
        <div style={{
          marginTop: "1px", padding: "12px 16px",
          backgroundColor: INNER,
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          <span style={{ fontFamily: M, fontSize: "12px", fontWeight: 500, color: "var(--color-ash-gray)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            {backtest.label}
          </span>
          <a
            href={backtest.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: M, fontSize: "12px", fontWeight: 500,
              color: AQUA, textDecoration: "none",
              border: "1px solid rgba(25,208,232,0.4)",
              backgroundColor: "rgba(25,208,232,0.08)",
              borderRadius: "var(--radius-buttons)", padding: "2px 10px",
              letterSpacing: "0.05em",
            }}
          >
            Open ↗
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Win-rate badge ───────────────────────────────────────────────────────────

function WinRateBadge({ trades, setupName }: { trades: Trade[]; setupName: string }) {
  const relevant = trades.filter(t => t.setup === setupName && t.result !== "Pending");
  if (relevant.length === 0) return null;
  const wins = relevant.filter(t => t.result === "Win").length;
  const rate = wins / relevant.length;
  const color = rate >= 0.5 ? "var(--color-win)" : "var(--color-loss)";
  const bg    = rate >= 0.5 ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)";
  const border = rate >= 0.5 ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)";
  return (
    <span style={{
      fontFamily: M, fontSize: "12px", fontWeight: 500,
      color, backgroundColor: bg,
      border: `1px solid ${border}`,
      borderRadius: "var(--radius-buttons)",
      padding: "2px 10px", whiteSpace: "nowrap",
      letterSpacing: "0.05em",
    }}>
      {Math.round(rate * 100)}% · {relevant.length}T
    </span>
  );
}

// ─── Setup Card ───────────────────────────────────────────────────────────────

function SetupCardUI({ s, trades }: { s: SetupCard; trades: Trade[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ backgroundColor: INNER, borderRadius: "var(--radius-default)", overflow: "hidden" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", background: "none", border: "none",
          padding: "0 16px", minHeight: "64px", cursor: "pointer",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: "12px",
          flexWrap: "wrap", textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span style={{
            fontFamily: D, fontWeight: 400, fontSize: "18px",
            lineHeight: 1.1, color: "var(--color-near-white)", letterSpacing: "-0.02em",
          }}>
            {s.name}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
          {[{ l: "Timeframes", v: s.timeframe }, { l: "Sessions", v: s.session }].map(item => (
            <div key={item.l} style={{ textAlign: "right" }}>
              <div style={{ fontFamily: M, fontSize: "12px", fontWeight: 500, color: "var(--color-ash-gray)", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {item.l}
              </div>
              <div style={{ fontFamily: M, fontSize: "12px", fontWeight: 400, color: "var(--color-near-white)" }}>
                {item.v}
              </div>
            </div>
          ))}

          <div style={{
            width: "24px", height: "24px", borderRadius: "9999px",
            border: "1px solid var(--color-dark-charcoal)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.25s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            flexShrink: 0,
          }}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 4.5L6 7.5L10 4.5" stroke="var(--color-ash-gray)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </button>

      {open && (
        <div style={{ borderTop: "1px solid #0a0a0a" }}>
          {renderDescriptionBlocks(s.description)}

          {s.imageUrls.length > 0 && (
            <div style={{
              padding: "0 16px 16px",
              display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px",
            }}>
              {s.imageUrls.map((url, i) => (
                <div key={i} style={{
                  borderRadius: "var(--radius-default)", overflow: "hidden",
                  aspectRatio: "16/9", position: "relative",
                  backgroundColor: "var(--surface-canvas)", border: "1px solid var(--color-dark-charcoal)",
                }}>
                  <Image src={url} alt={`${s.name} chart ${i + 1}`} fill style={{ objectFit: "cover" }} unoptimized />
                </div>
              ))}
            </div>
          )}

          {s.tags.length > 0 && (
            <div style={{ padding: "12px 16px", borderTop: "1px solid #0a0a0a", display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {s.tags.map(tag => (
                <span key={tag} style={{
                  fontFamily: M, fontSize: "12px", fontWeight: 500,
                  color: "var(--color-ash-gray)", border: "1px solid var(--color-dark-charcoal)",
                  backgroundColor: "transparent",
                  borderRadius: "var(--radius-buttons)", padding: "2px 10px",
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

export default function SetupsGrid({ setups, trades = [] }: { setups: SetupCard[]; trades?: Trade[] }) {
  return (
    <div id="setups" className="card-glow" style={{
      backgroundColor: "var(--surface-card)",
      borderRadius: "var(--radius-cards)",
      padding: "var(--card-padding)",
    }}>
      <div style={{ marginBottom: "16px" }}>
        <p style={{ fontFamily: M, fontSize: "12px", fontWeight: 500, color: "var(--color-ash-gray)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
          Setups
        </p>
      </div>

      {setups.length === 0 ? (
        <div style={{
          borderRadius: "var(--radius-default)", padding: "48px",
          textAlign: "center", fontFamily: M, fontSize: "12px",
          color: "var(--color-ash-gray)", backgroundColor: INNER,
        }}>
          No setups loaded.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", backgroundColor: "#0a0a0a", borderRadius: "var(--radius-default)", overflow: "hidden" }}>
          {setups.map(s => <SetupCardUI key={s.id} s={s} trades={trades} />)}
        </div>
      )}
    </div>
  );
}
